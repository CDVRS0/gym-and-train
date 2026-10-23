'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const TABLE = 'gym_app_state';

export function useGymCloudSync({ state, setState, loaded }) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('offline');
  const [conflict, setConflict] = useState(null);
  const [revision, setRevision] = useState(0);
  const stateRef = useRef(state);
  const userRef = useRef(null);
  const ready = useRef(false);
  const generation = useRef(0);
  const lastCloud = useRef(null);
  const saving = useRef(false);
  const pending = useRef(false);
  stateRef.current = state;

  const fetchCloud = useCallback(async (id) => {
    const { data, error } = await supabase.from(TABLE).select('state').eq('user_id', id).maybeSingle();
    if (error) throw error;
    return data?.state ?? null;
  }, []);

  const writeCloud = useCallback(async (id, snapshot) => {
    const { error } = await supabase.from(TABLE).upsert({ user_id: id, state: snapshot, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  }, []);

  const recover = useCallback(async (nextUser) => {
    const token = ++generation.current;
    ready.current = false;
    userRef.current = nextUser;
    setUser(nextUser);
    setConflict(null);
    lastCloud.current = null;
    if (!supabase || !nextUser) { setSyncStatus('offline'); return; }
    setSyncStatus('loading');
    try {
      const cloud = await fetchCloud(nextUser.id);
      if (token !== generation.current) return;
      if (cloud && (!Array.isArray(cloud.history) || !Array.isArray(cloud.sessions) || !cloud.settings)) {
        throw new Error('Cloud data has an unsupported format. Local data has been kept.');
      }
      if (JSON.stringify(cloud) !== JSON.stringify(stateRef.current)) {
        setConflict({ cloud });
        setSyncStatus('needs-decision');
        return;
      }
      lastCloud.current = JSON.stringify(cloud);
      ready.current = true;
      setSyncStatus('synced');
      setRevision((n) => n + 1);
    } catch (error) {
      if (token !== generation.current) return;
      // A failed read must never authorize an upload over an unknown cloud state.
      console.error('Cloud recovery failed:', error);
      setSyncStatus('error');
    }
  }, [fetchCloud]);

  const resolveConflict = useCallback(async (choice) => {
    const currentUser = userRef.current;
    if (!conflict || !currentUser || (choice !== 'local' && choice !== 'cloud')) return;
    const token = ++generation.current;
    ready.current = false;
    setSyncStatus('loading');
    try {
      if (choice === 'cloud') {
        // Preserve edits made while the decision was visible before replacing them.
        localStorage.setItem(`gym-training-os-v8-before-cloud-${Date.now()}`, JSON.stringify(stateRef.current));
        const cloud = conflict.cloud;
        if (!cloud) throw new Error('Cloud data is unavailable.');
        const restored = { ...stateRef.current, ...cloud, drafts: cloud.drafts || {}, runLogs: cloud.runLogs || [], bbLogs: cloud.bbLogs || [], water: cloud.water || {}, loads: cloud.loads || {}, settings: { ...stateRef.current.settings, ...cloud.settings } };
        stateRef.current = restored;
        setState(restored);
        lastCloud.current = JSON.stringify(restored);
      } else {
        // Use the latest browser edits, not the snapshot taken when recovery began.
        const snapshot = stateRef.current;
        await writeCloud(currentUser.id, snapshot);
        if (token !== generation.current) return;
        lastCloud.current = JSON.stringify(snapshot);
      }
      ready.current = true;
      setConflict(null);
      setSyncStatus('synced');
      setRevision((n) => n + 1);
    } catch (error) {
      if (token !== generation.current) return;
      console.error('Cloud recovery decision failed:', error);
      setSyncStatus('error');
    }
  }, [conflict, setState, writeCloud]);

  // All automatic writes, including reconnects, pass through this one queue.
  const flush = useCallback(async () => {
    if (!ready.current || !userRef.current || !supabase) return;
    if (!navigator.onLine) { setSyncStatus('offline'); return; }
    if (saving.current) { pending.current = true; return; }
    saving.current = true;
    try {
      do {
        pending.current = false;
        const currentUser = userRef.current;
        const token = generation.current;
        if (!ready.current || !currentUser) break;
        const snapshot = stateRef.current;
        const json = JSON.stringify(snapshot);
        if (json === lastCloud.current) { setSyncStatus('synced'); break; }
        setSyncStatus('loading');
        await writeCloud(currentUser.id, snapshot);
        if (token !== generation.current) break;
        lastCloud.current = json;
        setSyncStatus('synced');
        pending.current = json !== JSON.stringify(stateRef.current);
      } while (pending.current);
    } catch (error) {
      console.error('Cloud save failed:', error);
      setSyncStatus('error');
    } finally {
      saving.current = false;
    }
  }, [writeCloud]);

  useEffect(() => {
    if (!loaded || !supabase) return;
    let active = true;
    let initialized = false;
    const onSession = (nextUser) => {
      if (!active) return;
      if (initialized && userRef.current?.id === nextUser?.id) return;
      initialized = true;
      recover(nextUser);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => onSession(session?.user ?? null), 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) { setSyncStatus('error'); return; }
      onSession(data.session?.user ?? null);
    }).catch(() => { if (active) setSyncStatus('error'); });
    return () => {
      active = false;
      subscription.unsubscribe();
      generation.current += 1;
      ready.current = false;
    };
  }, [loaded, recover]);

  useEffect(() => {
    if (!loaded || !ready.current || conflict) return;
    const timer = setTimeout(flush, 1000);
    return () => clearTimeout(timer);
  }, [state, loaded, conflict, revision, flush]);

  useEffect(() => {
    const online = () => { if (ready.current) flush(); else if (userRef.current) recover(userRef.current); };
    const offline = () => setSyncStatus('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [flush, recover]);

  const retrySync = useCallback(async () => {
    if (ready.current) await flush();
    else await recover(userRef.current);
  }, [flush, recover]);
  return { user, syncStatus, conflict, resolveConflict, retrySync };
}
