'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
const prompts = ['What should I train today?', 'Suggest progressive overload for my recent workouts.', 'Analyse my weekly volume across gym, basketball and running.', 'Suggest substitutions to improve strength and jumping.', 'Summarise my training progress this week.'];
export default function TrainingCoach() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);
  const [interrupted, setInterrupted] = useState(false);
  async function ask(event) {
    event.preventDefault(); if(busy || !question.trim()) return;
    setBusy(true); setError(''); setAnswer(''); setSyncedAt(null); setInterrupted(false);
    try {
      if (!supabase) throw new Error('Configure Supabase and sign in through Settings first.');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if(authError || !session) throw new Error('Sign in through cloud sync Settings first.');
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ message: question.trim() }) });
      const data = await response.json(); if(!response.ok) throw new Error(data.error || 'CEED could not respond. Please try again.');
      setAnswer(data.message); setSyncedAt(data.syncedAt); setInterrupted(Boolean(data.interrupted));
    } catch(e) { setError(e.message || 'The coach could not respond.'); } finally { setBusy(false); }
  }
  return <section className="training-coach"><div className="section-heading"><div><p className="eyebrow">POWERED BY CEED</p><h2>AI training coach</h2></div></div><p className="muted">CEED uses your automatically saved cloud training records. Wait for “Saved to cloud” before asking. This coach answers one question at a time.</p>
    <div className="coach-prompts">{prompts.map(p => <button className="button" disabled={busy} key={p} onClick={() => setQuestion(p)}>{p}</button>)}</div>
    <form onSubmit={ask}><label htmlFor="coach-question">Ask about your training</label><textarea id="coach-question" maxLength={8000} rows={3} value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} placeholder="How should I balance legs, basketball and running this week?"/><button className="button button-primary" disabled={busy || !question.trim()}>{busy ? 'Reviewing your records…' : 'Ask CEED'}</button></form>
    {busy && <p role="status">Reviewing your saved training with CEED…</p>}{error && <p role="alert" className="coach-error">{error}</p>}{answer && <article className="coach-answer" aria-live="polite"><h3>CEED</h3><p>{answer}</p>{interrupted && <p role="status">This reply was interrupted. Ask again before using it to change your programme.</p>}<small>Cloud sync: {syncedAt ? new Date(syncedAt).toLocaleString() : 'No cloud records yet'}</small></article>}<p className="muted">Programme changes are suggestions for your review. Apply changes manually only after approving them. The coach cannot edit your programme.</p></section>;
}
