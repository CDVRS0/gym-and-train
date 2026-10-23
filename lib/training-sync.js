import { supabase } from './supabase';

export async function syncTrainingSession(session, userId) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!userId) {
    throw new Error('You must be signed in to synchronise training.');
  }

  if (!session?.id) {
    throw new Error('The training session must have an ID.');
  }

  const sessionType =
    session.type === 'train'
      ? 'gym'
      : session.type === 'run' ? 'running' : session.type;

  const allowedTypes = ['gym', 'basketball', 'running'];

  if (!allowedTypes.includes(sessionType)) {
    throw new Error(`Unsupported session type: ${sessionType}`);
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .upsert(
      {
        user_id: userId,
        source_id: String(session.id),
        session_type: sessionType,
        name: session.name || 'Training session',
        duration_seconds: Math.max(
          0,
          Number(session.duration) || 0
        ),
        session_date: session.date || new Date().toISOString().slice(0, 10),
        notes: session.notes || null,
        metadata: {
          source: 'gym-training-os',
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,source_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getTrainingSessions(userId, limit = 50) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!userId) {
    throw new Error('You must be signed in.');
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .select(
      'id, source_id, session_type, name, duration_seconds, session_date, notes, metadata'
    )
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}