'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const TABLE = 'gym_app_state';
const STORAGE_KEY = 'gym-training-os-v8';
const SAVE_DELAY = 1000;

export function useGymCloudSync({
  state,
  setState,
  loaded,
}) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [conflict, setConflict] = useState(null);

  const stateRef = useRef(state);
  const userRef = useRef(null);
  const readyRef = useRef(false);
  const generationRef = useRef(0);
  const lastCloudJSONRef = useRef(null);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getLocalState = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const saveLocalState = useCallback((nextState) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextState)
      );
    } catch (error) {
      console.error('Local save failed:', error);
    }
  }, []);

  const fetchCloudState = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }, []);

  const writeCloudState = useCallback(async (userId, nextState) => {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          state: nextState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
  }, []);

  /*
   * Recover cloud data after authentication.
   * Never upload application defaults before recovery completes.
   */
  const recover = useCallback(async (authenticatedUser) => {
    const generation = ++generationRef.current;

    readyRef.current = false;
    userRef.current = authenticatedUser;
    setUser(authenticatedUser);
    setConflict(null);
    setSyncStatus('loading');

    if (!authenticatedUser || !supabase) {
      readyRef.current = true;
      setSyncStatus('offline');
      return;
    }

    try {
      const cloudRow = await fetchCloudState(authenticatedUser.id);

      if (generation !== generationRef.current) return;

      const localState = getLocalState();
      const cloudState = cloudRow?.state ?? null;

      if (!cloudState && localState) {
        setConflict({
          type: 'local-only',
          local: localState,
          cloud: null,
        });

        setSyncStatus('needs-decision');
        return;
      }

      if (cloudState && !localState) {
        saveLocalState(cloudState);
        setState(cloudState);
        lastCloudJSONRef.current = JSON.stringify(cloudState);

        readyRef.current = true;
        setSyncStatus('synced');
        return;
      }

      if (cloudState && localState) {
        const localJSON = JSON.stringify(localState);
        const cloudJSON = JSON.stringify(cloudState);

        if (localJSON !== cloudJSON) {
          setConflict({
            type: 'both-exist',
            local: localState,
            cloud: cloudState,
          });

          setSyncStatus('needs-decision');
          return;
        }

        lastCloudJSONRef.current = cloudJSON;
      }

      readyRef.current = true;
      setSyncStatus('synced');
    } catch (error) {
      console.error('Cloud recovery failed:', error);

      if (generation === generationRef.current) {
        readyRef.current = true;
        setSyncStatus('error');
      }
    }
  }, [
    fetchCloudState,
    getLocalState,
    saveLocalState,
    setState,
  ]);

  /*
   * Resolve a recovery conflict explicitly.
   */
  const resolveConflict = useCallback(async (choice) => {
    if (!conflict || !userRef.current) return;

    const currentUser = userRef.current;
    const generation = generationRef.current;

    readyRef.current = false;
    setSyncStatus('loading');

    try {
      if (choice === 'cloud' && conflict.cloud) {
        const latestCloud = await fetchCloudState(currentUser.id);

        if (generation !== generationRef.current) return;

        const cloudState = latestCloud?.state;

        if (!cloudState) {
          throw new Error('Cloud backup is no longer available.');
        }

        saveLocalState(cloudState);
        setState(cloudState);
        stateRef.current = cloudState;
        lastCloudJSONRef.current = JSON.stringify(cloudState);
      } else {
        const localState = conflict.local ?? stateRef.current;

        await writeCloudState(currentUser.id, localState);

        if (generation !== generationRef.current) return;

        saveLocalState(localState);
        lastCloudJSONRef.current = JSON.stringify(localState);
      }

      setConflict(null);
      readyRef.current = true;
      setSyncStatus('synced');
    } catch (error) {
      console.error('Unable to resolve cloud conflict:', error);
      setSyncStatus('error');
    }
  }, [
    conflict,
    fetchCloudState,
    saveLocalState,
    setState,
    writeCloudState,
  ]);

  /*
   * Authentication lifecycle.
   */
  useEffect(() => {
    if (!supabase || !loaded) return;

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        generationRef.current += 1;
        readyRef.current = true;
        userRef.current = null;
        setUser(null);
        setConflict(null);
        setSyncStatus('offline');
        return;
      }

      if (session?.user) {
        /*
         * Defer database work until the auth callback finishes.
         */
        setTimeout(() => {
          if (active) recover(session.user);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setSyncStatus('error');
        return;
      }

      if (data.session?.user) {
        recover(data.session.user);
      } else {
        readyRef.current = true;
        setSyncStatus('offline');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      generationRef.current += 1;
      clearTimeout(timerRef.current);
    };
  }, [loaded, recover]);

  /*
   * Save locally immediately. Cloud writes are debounced.
   */
  useEffect(() => {
    if (!loaded) return;

    saveLocalState(state);

    if (!userRef.current || !readyRef.current || conflict) {
      return;
    }

    if (!supabase) {
      setSyncStatus('offline');
      return;
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (savingRef.current) {
        pendingSaveRef.current = true;
        return;
      }

      const currentUser = userRef.current;

      if (!currentUser || !readyRef.current) return;

      const snapshot = stateRef.current;
      const snapshotJSON = JSON.stringify(snapshot);

      if (snapshotJSON === lastCloudJSONRef.current) {
        setSyncStatus('synced');
        return;
      }

      savingRef.current = true;
      pendingSaveRef.current = false;
      setSyncStatus('loading');

      try {
        await writeCloudState(currentUser.id, snapshot);

        if (userRef.current?.id !== currentUser.id) return;

        lastCloudJSONRef.current = snapshotJSON;
        setSyncStatus('synced');
      } catch (error) {
        console.error('Automatic cloud save failed:', error);
        setSyncStatus('error');
      } finally {
        savingRef.current = false;

        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          setSyncStatus('loading');

          timerRef.current = setTimeout(() => {
            if (userRef.current && readyRef.current) {
              const latest = stateRef.current;

              writeCloudState(userRef.current.id, latest)
                .then(() => {
                  lastCloudJSONRef.current = JSON.stringify(latest);
                  setSyncStatus('synced');
                })
                .catch((error) => {
                  console.error('Follow-up cloud save failed:', error);
                  setSyncStatus('error');
                });
            }
          }, SAVE_DELAY);
        }
      }
    }, SAVE_DELAY);

    return () => clearTimeout(timerRef.current);
  }, [
    state,
    loaded,
    conflict,
    saveLocalState,
    writeCloudState,
  ]);

  /*
   * Sync pending local changes when connectivity returns.
   */
  useEffect(() => {
    const handleOnline = async () => {
      const currentUser = userRef.current;

      if (!currentUser || !readyRef.current || conflict) return;

      setSyncStatus('loading');

      try {
        const snapshot = stateRef.current;

        await writeCloudState(currentUser.id, snapshot);

        lastCloudJSONRef.current = JSON.stringify(snapshot);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Reconnect sync failed:', error);
        setSyncStatus('error');
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [conflict, writeCloudState]);

  return {
    user,
    syncStatus,
    conflict,
    resolveConflict,
  };
}