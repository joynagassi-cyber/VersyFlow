# AGENTS.md

<!-- BACKEND:START -->
## Backend — Supabase + PowerSync

This project (VersyFlow — bilingual biblical verse memorization, Ionic React + Capacitor)
runs on **Supabase** (auth, Postgres, Storage) with **PowerSync** for offline-first
local-first sync. InsForge was used historically and is **OBSOLETE** (see `.env.example`).

- **Credentials:** app code reads keys from `.env.local` / env (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, optional `POWERSYNC_URL` / `POWERSYNC_SECRET`).
  Never hardcode or commit keys.

Key patterns:

- Auth is Supabase-only: `src/auth/SupabaseAuthService.ts` (signIn / signUp / signOut /
  verifyOtp) wrapped by `src/store/auth-store.ts` (zustand).
- Synced writes go through the PowerSync repositories in
  `src/infrastructure/repository/powersync-repositories.ts`; local-only data (e.g.
  semantic memory) uses SQLite adapters.
- Learner records are owned by the authenticated user: bind writes with
  `getSyncUserIdProvider().resolveUserId()`; invalidate it on sign-out.
<!-- BACKEND:END -->
