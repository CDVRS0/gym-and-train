// This app forwards to CDVRS AI; it never calls a model provider itself.
export async function POST(request) {
  const origin = process.env.CDVRS_AI_URL;
  if (!origin) return Response.json({ error: 'Set the server-side CDVRS_AI_URL to connect your central AI backend.' }, { status: 503 });
  const authorization = request.headers.get('authorization');
  if (!/^Bearer .+$/i.test(authorization || '')) return Response.json({ error: 'Sign in using cloud sync settings first.' }, { status: 401 });
  try {
    const target = new URL('/api/training/coach', origin);
    if (target.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(target.hostname))) throw new Error('HTTPS is required.');
    const body = await request.json();
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 8000) return Response.json({ error: 'Enter a message of up to 8,000 characters.' }, { status: 400 });
    const response = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authorization }, body: JSON.stringify({ message: body.message }), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(120000) });
    const data = await response.json();
    return Response.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Could not reach CDVRS AI. Check the backend URL and try again.' }, { status: 503 }); }
}
