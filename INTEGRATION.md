# CDVRS AI coach

The existing workouts, cardio, basketball, hydration, progression, timers and cloud-sync logic are retained. The new AI Coach tab calls this app's `/api/coach`, which forwards only the question and signed-in Supabase bearer to the central CDVRS `/api/training/coach` endpoint. It does not run a separate model provider.

Both apps must use the same Supabase project and account. In `.env.local`, keep existing public Supabase settings and add server-only `CDVRS_AI_URL=http://127.0.0.1:3017` for development. Production requires your trusted CDVRS HTTPS origin; redirects are refused. Never put provider/service-role keys in public variables. `.env.local` is now untracked and ignored; `.env.example` contains placeholders.

Run `npm test`, `npm run build`, then `npm run dev -- --hostname 127.0.0.1 --port 3018`. Sign in through Settings, review local/cloud sync and sync your saved training. The coach reads the resulting cloud snapshot, not unsynced browser drafts. It answers one question at a time; answers are not persisted as main-app conversations. Programme changes require review and manual application.

The central app contains a proposed database migration and audit/cleanup tool. The safety migration has been applied and verified on the shared project. The authorised test-conversation cleanup removed 52 conversations and 356 messages after private backup; independent memory, auth and training were preserved. Test with a shared staging project first. No application deployment has been performed. The production Vercel environment is now prepared with shared public Supabase configuration and the trusted central CDVRS URL.

This repository originally tracks `.next` artifacts. The tested generated build is retained outside the source checkout and tracked baseline artifacts restored for a focused source review; run a fresh build before `npm start`. Do not include generated build diffs in a source commit.

The local workspace delivery includes `IMPLEMENTATION.md`, `CHANGED-FILES.md` and synthetic browser screenshots under `verification/`.
