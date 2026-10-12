'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function GymCloudSync({ state }) {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setUser(null);
        return;
      }

      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    if (!email.trim()) {
      setStatus('Enter your email address.');
      return;
    }

    setBusy(true);
    setStatus('Sending sign-in link...');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setStatus(
        'Check your email for the sign-in link. Open it in this browser.'
      );
    } catch (error) {
      setStatus(error.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function syncToCloud() {
    if (!supabase || !user) {
      setStatus('Sign in before synchronising.');
      return;
    }

    setBusy(true);
    setStatus('Checking your cloud data...');

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!currentUser || currentUser.id !== user.id) {
        throw new Error('Your session has changed. Sign in again.');
      }

      // Check whether cloud data already exists before overwriting it.
      const { data: existing, error: readError } = await supabase
        .from('gym_app_state')
        .select('user_id, updated_at')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (readError) throw readError;

      const message = existing
        ? `Cloud data already exists, last updated ${new Date(
            existing.updated_at
          ).toLocaleString()}.\n\nUploading will replace that saved GYM Training OS state with the data currently in this browser.\n\nContinue?`
        : 'This will upload the GYM Training OS data currently in this browser to your cloud account. Continue?';

      if (!window.confirm(message)) {
        setStatus('Sync cancelled. Your data has not been uploaded.');
        return;
      }

      setStatus('Synchronising training data...');

      const { error } = await supabase.from('gym_app_state').upsert(
        {
          user_id: currentUser.id,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      setStatus(
        `Successfully synchronised at ${new Date().toLocaleTimeString()}.`
      );
    } catch (error) {
      setStatus(
        error.message ||
          'Synchronisation failed. Your local data remains available.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;

    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setStatus('Signed out.');
    } catch (error) {
      setStatus(error.message || 'Sign-out failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!supabase) {
    return (
      <div>
        <p>
          Supabase is not configured. Check your project URL and publishable
          key in `.env.local`.
        </p>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>

          <button
            type="button"
            className="button"
            onClick={syncToCloud}
            disabled={busy}
          >
            {busy ? 'Please wait...' : 'Sync training data'}
          </button>

          <button
            type="button"
            className="button"
            onClick={signOut}
            disabled={busy}
            style={{ marginLeft: 8 }}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <label
            htmlFor="gym-cloud-email"
            style={{ display: 'block', marginBottom: 8 }}
          >
            Email address
          </label>

          <input
            id="gym-cloud-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{ marginRight: 8, marginBottom: 10 }}
          />

          <button
            type="button"
            className="button"
            onClick={signIn}
            disabled={busy}
          >
            {busy ? 'Please wait...' : 'Email me a sign-in link'}
          </button>
        </>
      )}

      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}