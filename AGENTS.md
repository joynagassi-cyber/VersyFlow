# AGENTS.md

<!-- SUPABASE:START -->
## Supabase backend (backend primaire)

Ce projet utilise [Supabase](https://supabase.com) : un backend Postgres open-source (BaaS) qui fournit à l'application une base de données, de l'authentification (GoTrue), du stockage de fichiers, des edge functions (Deno), du realtime et une couche de sync via [PowerSync](https://powersync.com).

- **Projet** : API base `https://dspqvyesfngxuwqhceog.supabase.co` (voir `.env.local` → `VITE_SUPABASE_URL`)
- **Client** : `@supabase/supabase-js` (authentification + RLS CRUD), `@powersync/web` + `@powersync/capacitor` pour la synchronisation temps réel des données applicatives
- **Credentials** : app code lit les clés depuis `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Ne JAMAIS hardcoder ni committer les clés.

Patterns clés :

- Les inserts Supabase prennent un tableau : `insert([{ ... }])` (ou un objet unique pour une seule ligne).
- Référencer les utilisateurs via `auth.uid()` dans les policies RLS ; le câblage `auth.users` → `public.users` est assuré par les triggers `handle_new_user` / `handle_user_updated` (voir `supabase/migrations/005`).
- Pour les uploads Storage, persister les deux champs `url` ET `key` retournés par l'API.
- **Datasets statiques** (Bible, etc.) : les fichiers de contenu non synchronisés sont distribués via Supabase Storage (bucket `bible-datasets`), pas via la publication PowerSync.
<!-- SUPABASE:END -->
