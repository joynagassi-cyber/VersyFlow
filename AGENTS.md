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

<!-- PLAYBOOK:START -->
## Règles d'écran — Playbook UX/UI 2026 (77 règles)

Source : `UX-UI-Playbook_EN.pdf` (140 p.) + `UX-UI-Playbook_BONUS-KIT_EN.pdf` (26 p.).
Rapport courant : `docs/design/PLAYBOOK-AUDIT.md`, régénéré par `node scripts/audit-playbook.mjs`.

Ce que **tout** écran doit respecter sans qu'on le redemande :

- **Structure** — un seul `h1` par écran (ou le `title` de `FullScreenPage`), pas de niveau
  sauté, `main`/`nav`/`header` nommés, 5 entrées maximum dans une barre principale.
- **Couleur** — aucune couleur en dur dans un écran : jetons uniquement (`var(--…)`).
  Un second jeu de jetons porte le mode sombre (jamais un filtre). Aucune information par
  la couleur seule : `aria-current`, `aria-checked`, icône ou texte.
- **Typographie** — deux familles au plus, une échelle de 8 tailles (`tailwind.config.js`),
  **rien d'utile sous 12 px**, corps 15–17 px, lignes de 45–80 caractères
  (`--reading-width: min(720px, 70ch)`).
- **Cibles** — 24 × 24 px minimum, 44 px sous `pointer: coarse`, 48 px sur Android
  (`html[data-platform="android"]`). Règles globales dans `globals.css`.
- **États** — les cinq existent : vide (`EmptyState`), chargement (`ScreenSkeleton`,
  jamais un `fallback={null}`), erreur, succès, limite. Un état désactivé dit pourquoi
  (`aria-describedby`).
- **Formulaires** — chaque champ a un nom accessible : `ui/input.tsx` impose `label` ou
  `aria-label` **par le type**. Erreur sous le champ + `aria-invalid` + `role="alert"`.
- **Accessibilité** — `SkipLink` en tête de coquille, `#main-content` focusable,
  `useRouteFocus()` après navigation, `:focus-visible` visible partout, `lang` et `dir`
  synchronisés par `DirSync`.
- **Mouvement** — aucun `animation: … infinite`, rien au-delà de 400 ms sans raison écrite
  en commentaire, et tout est coupé sous `prefers-reduced-motion`.
- **Confiance** — aucune case pré-cochée (consentement = opt-in), aucune promesse
  invérifiable, mode démo signalé à l'écran.

Vérification : `npm run verify` (types, lint, tests de conception, audits) et
`npx vitest run tests/design/playbook-rules.test.tsx` (verrouille les règles bloquantes).
<!-- PLAYBOOK:END -->
