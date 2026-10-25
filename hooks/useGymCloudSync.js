'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const TABLE = 'gym_app_state';

export function useGymCloudSync({ state, setState, loaded, createEmptyState, onRecovered }) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [cloudReady, setCloudReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const stateRef = useRef(state);
  const userRef = useRef(null);
  const ready = useRef(false);
  const generation = useRef(0);
  const lastCloud = useRef(null);
  const cloudVersion = useRef(null);
  const saving = useRef(false);
  const pending = useRef(false);
  const paused = useRef(false);
  stateRef.current = state;

  const recover = useCallback(async (nextUser) => {
    const token = ++generation.current;
    ready.current = false;
    paused.current = false;
    setCloudReady(false);
    userRef.current = nextUser;
    setUser(nextUser);
    setErrorMessage('');
    lastCloud.current = null;
    cloudVersion.current = null;
    // Never display a previous account's data or read a device workout snapshot.
    const initial = createEmptyState();
    stateRef.current = initial;
    setState(initial);
    if (!supabase || !nextUser) { setSyncStatus('signed-out'); return; }
    setSyncStatus('loading');
    try {
      const { data, error } = await supabase.from(TABLE).select('state,updated_at').eq('user_id', nextUser.id).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
      if (error) throw error;
      if (token !== generation.current) return;
      const cloud = data?.state;
      if (data && (!cloud || !Array.isArray(cloud.history) || !Array.isArray(cloud.sessions) || !cloud.settings)) {
        throw new Error('Cloud history could not be read safely. No data has been replaced.');
      }
      const restored = cloud ? { ...initial, ...cloud, drafts: cloud.drafts || {}, runLogs: cloud.runLogs || [], bbLogs: cloud.bbLogs || [], water: cloud.water || {}, loads: cloud.loads || {}, settings: { ...initial.settings, ...cloud.settings } } : initial;
      stateRef.current = restored;
      setState(restored);
      onRecovered?.(restored);
      lastCloud.current = JSON.stringify(restored);
      cloudVersion.current = data?.updated_at ?? null;
      ready.current = true;
      setCloudReady(true);
      setSyncStatus('synced');
      setRevision(n => n + 1);
    } catch (error) {
      if (token !== generation.current) return;
      setErrorMessage(error.message || 'Could not load cloud history.');
      setSyncStatus('error');
    }
  }, [createEmptyState, onRecovered, setState]);

  const flush = useCallback(async () => {
    if (!ready.current || !userRef.current || !supabase || paused.current) return;
    if (!navigator.onLine) { setSyncStatus('offline'); return; }
    if (saving.current) { pending.current = true; return; }
    saving.current = true;
    const startedGeneration = generation.current;
    try {
      do {
        pending.current = false;
        const currentUser = userRef.current;
        if (!ready.current || !currentUser || generation.current !== startedGeneration) break;
        const snapshot = stateRef.current;
        const json = JSON.stringify(snapshot);
        if (json === lastCloud.current) { setSyncStatus('synced'); break; }
        setSyncStatus('loading');
        const version = cloudVersion.current;
        const updatedAt = new Date(Math.max(Date.now(), version ? Date.parse(version) + 1 : 0)).toISOString();
        const payload = { state: snapshot, updated_at: updatedAt };
        // Conditional writes prevent an older open device replacing newer history.
        const result = version
          ? await supabase.from(TABLE).update(payload).eq('user_id', currentUser.id).eq('updated_at', version).select('updated_at').abortSignal(AbortSignal.timeout(10000)).maybeSingle()
          : await supabase.from(TABLE).insert({ user_id: currentUser.id, ...payload }).select('updated_at').abortSignal(AbortSignal.timeout(10000)).single();
        if (generation.current !== startedGeneration) break;
        if (result.error) {
          if (result.error.code === '23505') paused.current = true;
          throw result.error;
        }
        if (!result.data) {
          paused.current = true;
          throw new Error('Cloud data changed on another device. Download unsaved changes, then reload cloud history.');
        }
        cloudVersion.current = result.data.updated_at;
        lastCloud.current = json;
        setErrorMessage('');
        setSyncStatus('synced');
        pending.current = json !== JSON.stringify(stateRef.current);
      } while (pending.current);
    } catch (error) {
      if (generation.current !== startedGeneration) return;
      setErrorMessage(error.message || 'Cloud save failed. Keep this app open and retry.');
      setSyncStatus('error');
    } finally { saving.current = false; }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!supabase) { setSyncStatus('error'); setErrorMessage('Cloud sign-in is not configured.'); return; }
    let active = true;
    let initialized = false;
    const onSession = nextUser => {
      if (!active || (initialized && userRef.current?.id === nextUser?.id)) return;
      initialized = true;
      void recover(nextUser);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => onSession(session?.user ?? null), 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) { setSyncStatus('error');setErrorMessage('Could not restore cloud sign-in.');return; }
      onSession(data.session?.user ?? null);
    }).catch(() => { if (active) {setSyncStatus('error');setErrorMessage('Could not restore cloud sign-in.');} });
    return () => { active = false; subscription.unsubscribe(); generation.current += 1; ready.current = false; };
  }, [loaded, recover]);

  useEffect(() => {
    if (!loaded || !ready.current) return;
    const timer = setTimeout(flush, 150);
    return () => clearTimeout(timer);
  }, [state, loaded, revision, flush]);

  useEffect(() => {
    const reconnect = async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      if (!ready.current) { void recover(currentUser); return; }
      if (saving.current || JSON.stringify(stateRef.current) !== lastCloud.current) { void flush(); return; }
      const token = generation.current;
      try {
        const { data, error } = await supabase.from(TABLE).select('updated_at').eq('user_id', currentUser.id).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
        if (token !== generation.current) return;
        if (error) throw error;
        // Keep untouched forms mounted when this account's cloud data is unchanged.
        if ((data?.updated_at ?? null) !== cloudVersion.current) void recover(currentUser);
        else setSyncStatus('synced');
      } catch (error) {
        if (token === generation.current) { setErrorMessage(error.message || 'Could not refresh cloud history.');setSyncStatus('error'); }
      }
    };
    const offline = () => setSyncStatus('offline');
    const visibility = () => {
      if (document.visibilityState === 'hidden') void flush();
      else reconnect();
    };
    const beforeUnload = event => {
      if (ready.current && (saving.current || JSON.stringify(stateRef.current) !== lastCloud.current)) {
        event.preventDefault();event.returnValue = '';
      }
    };
    window.addEventListener('online', reconnect);
    window.addEventListener('offline', offline);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('online', reconnect);window.removeEventListener('offline', offline);
      window.removeEventListener('beforeunload', beforeUnload);document.removeEventListener('visibilitychange', visibility);
    };
  }, [flush, recover]);

  const retrySync = useCallback(async () => {
    if (ready.current) await flush();
    else await recover(userRef.current);
  }, [flush, recover]);
  const reloadCloud = useCallback(() => recover(userRef.current), [recover]);
  const visibleStatus = cloudReady && syncStatus === 'synced' && JSON.stringify(state) !== lastCloud.current ? 'loading' : syncStatus;
  return { user, syncStatus: visibleStatus, cloudReady, errorMessage, retrySync, reloadCloud };
}
