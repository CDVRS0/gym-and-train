'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { passwordSignIn, setAccountPassword, sendAccountLink } from '../lib/gym-auth';

export default function GymCloudSync({ onSync }) {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setUser(null);
        return;
      }

      setUser(data.session?.user ?? null);
    }).catch(() => { if (active) setStatus('Could not restore sign-in. Please try again.'); });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') { setPassword(''); setConfirmation(''); }
        setUser(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(useLink = false) {
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    if (!email.trim()) {
      setStatus('Enter your email address.');
      return;
    }

    setBusy(true);
    setStatus(useLink ? 'Sending sign-in link...' : 'Signing in...');

    try {
      if (useLink) {
        await sendAccountLink(supabase, email, window.location.origin);
        setStatus('Open the email link in Safari, then Settings → Set or change password. Return to the Home Screen app and sign in with that password.');
      } else {
        await passwordSignIn(supabase, email, password);
        setPassword('');
        setStatus('Signed in. This app will remember your session.');
      }
    } catch (error) {
      setStatus(error.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('Saving password...');
    try {
      await setAccountPassword(supabase, password, confirmation);
      setPassword('');
      setConfirmation('');
      setStatus('Password saved for your existing account. Your workout data is unchanged. Use this email and password in the Home Screen app.');
    } catch (error) {
      setStatus(error.message || 'Could not save password.');
    } finally { setBusy(false); }
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

      await onSync?.();
      setStatus('Cloud check complete. Changes save automatically.');
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
      const { error } = await supabase.auth.signOut({ scope: 'local' });

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
            className="button button-secondary"
            onClick={syncToCloud}
            disabled={busy}
          >
            {busy ? 'Please wait...' : 'Check cloud connection'}
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={signOut}
            disabled={busy}
            style={{ marginLeft: 8 }}
          >
            Sign out
          </button>
          <details style={{ marginTop: 16 }}>
            <summary>Set or change password</summary>
            <p>Keep this existing account and its workout data. This password also works for your shared CDVRS AI account.</p>
            <form onSubmit={savePassword}>
              <label htmlFor="gym-new-password">New password</label>
              <input id="gym-new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
              <label htmlFor="gym-confirm-password">Confirm password</label>
              <input id="gym-confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
              <button type="submit" className="button button-primary" disabled={busy}>Save password</button>
            </form>
          </details>
        </>
      ) : (
        <form onSubmit={e => { e.preventDefault(); void signIn(); }}>
          <label
            htmlFor="gym-cloud-email"
            style={{ display: 'block', marginBottom: 8 }}
          >
            Email address
          </label>

          <input
            id="gym-cloud-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{ marginRight: 8, marginBottom: 10 }}
          />

          <label htmlFor="gym-cloud-password" style={{ display: 'block', marginBottom: 8 }}>Password</label>
          <input id="gym-cloud-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 10 }} />
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Please wait...' : 'Sign in with password'}</button>
          <button type="button" className="button button-secondary" disabled={busy} onClick={() => void signIn(true)} style={{ marginLeft: 8 }}>Set up or forgot password?</button>
          <p>Use your existing account email. For first-time password setup, the email link opens Safari; set your password there, then sign in here.</p>
        </form>
      )}

      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}
export function GymSyncStatus({ status }) {
  const labels = {
    loading: 'Saving to cloud…',
    synced: 'Saved to cloud',
    offline: 'Offline — cloud save unavailable',
    error: 'Not saved — retry your cloud connection',
    'signed-out': 'Sign in to load your cloud history',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <p className="text-sm font-medium text-white">
        {labels[status] ?? 'Sync status unknown'}
      </p>
    </div>
  );
}
