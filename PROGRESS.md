# PROGRESS — VersyFlow Senior Rescue (2026-10-06)

## Phase 0 — Discovery & Stack Detection

| Item | Value |
|---|---|
| Framework | Ionic React 7 + React 18 (function components, hooks) |
| Bundler | Vite (`npm run build` = `tsc -b tsconfig.build.json && vite build`) |
| Package manager | npm (lockfile: package-lock.json) |
| Test tooling | Vitest (`npm test` = `vitest run`) |
| i18n | i18next 24 + 44 locales (src/i18n/locales/*.ts) |
| State | Zustand v5 (src/store/*) + Capacitor persist |
| Targets | **Web + Capacitor mobile (Android + iOS)** — NO Electron desktop, NO Next.js. Skill's Phase 4 "Render deploy" does not apply; substitute = verify `vite build` green. |
| SSoT | `.claude/CLAUDE.md` (architecture rules, domains, non-negotiables), `docs/28-constitution.md`, `docs/09-architecture.md`, `docs/30-domain-rulebook.md`, `docs/31-ui-rulebook.md` |
| Domain layering | `app/`+`src/components/` → `src/hooks/` → `src/services/` → `src/domains/` (pure) → `src/infrastructure/` (I/O). Violations forbidden. |

### Baseline health (2026-10-06, updated)
| Gate | Result |
|---|---|
| typecheck (`npx tsc --noEmit`) | ✅ 0 errors |
| lint (`npx eslint app src --ext .ts,.tsx`) | ✅ 0 errors (exit 0) |
| tests (`npx vitest run`) | ✅ **1187/1187 passed (110 files)** after P1+P2 fixes |
| prod build (`vite build`) | ✅ **PASS 3 min 58 s (2026-10-06, 4e vérif post-fixes)** — chunk `index.js` 642.74 kB (gzip 178.21 kB), avertissement >500 kB préexistant, non bloquant |

### Fixed (commits)
- **P1 i18n parity failure** — 6 `auth.*` keys (identify, identifySubtitle, name,
  continue, ready, readySubtitle) used by the new frictionless-identify
  screens existed only in fr.ts; added to en.ts → `3a488ff`
- **P2 catalog audit drift** — `bible-translation-names-audit.test.ts` pinned
  to the 48-dataset ground truth; updated to 57 (no pending stubs remain) and
  extended the expected language tail with the 9 CC-BY-SA reader-language
  groups → `3a488ff`
- **P3 migration 034 tracking** — `supabase/migrations/034_powersync_rls_strictness.sql`
  was uncommitted while already applied live (2 `v_` views + FORCE RLS on 5
  business tables confirmed live via supabase-versyflow MCP 2026-10-06).
  Tracked → `51a0299`
- **P-new layering: hooks → domain value imports** — `docs/29-architecture-rulebook.md`
  §1 forbade `hooks/ → domains/`, but 3 hooks carried domain *value* imports
  (classes/constants), plus 1 `domain → services` type-import smell. Fixed
  via **documented exception + service routing** (minimum-change path chosen
  autonomously per senior-rescue rules):
  - `docs/29-architecture-rulebook.md` §6 Exception 4 added: type-only domain
    imports from hooks are allowed (erased at compile time, no runtime
    coupling); value imports must route through `src/services/`.
  - `useTranslationPreference.ts`: `DEFAULT_BIBLE_TRANSLATIONS` (value) →
    new `getKnownTranslationIds()` in
    `src/services/translation-preference-service.ts`.
  - `useMemorizationSession.ts` + `useMemorizationWorkspace.ts`: `SessionEngine`,
    `MemorizationSessionEngine`, `ComparisonEngine`, `MemorizationService`,
    `DEFAULT_MVP_STRATEGY`, `BIBLE_BOOKS`/`resolveBookId` (all values) →
    new composition root `src/services/memorization-session-service.ts`
    (facades `createSessionEngine` / `createWorkspaceEngine` /
    `createMemorizationService` / `compareWrittenRecall` /
    `resolveBookIdFromText` / `BIBLE_BOOKS_LIST`). Hooks keep type-only
    domain imports + the concrete repo adapter `LocalBibleRepository`
    (constructor-injected, docs/29 §4).
  - `src/domains/memorization/tracker.ts` no longer imports `WordFailure`
    from `src/services/word-failure-tracker.ts` (inverted): `WordFailure`
    is now domain-owned, service re-exports it for consumer compat.
  - Verification: `tsc -p tsconfig.app.json --noEmit` → 0 errors;
    targeted vitest (hook + tracker + ai-coach-flow) → 25/25 green.
  Not yet committed — will be part of the next commit.

### Decisions
- **D1 (P-new)** — hooks→domains violation resolved as "documented exception
  + service facades" rather than moving domain engines up: smallest diff,
  keeps testability (constructor injection preserved), and the exception is
  now codified in `docs/29` §6 so the rule and the code can't drift again.
  The 2 memorization hooks + 1 translation hook are the only value-import
  cases; type-only imports stay legal going forward.

### Untracked working-tree items (not committed, assessed)
- ~28 `data/bible/raw/*/` USFM source dirs — build inputs, intentionally untracked
- `docs/bible/reports/eb-target-*.txt` — research notes, keep untracked
- `out/`, `scripts/bible/__pycache__/` — debris; `.gitignore` candidate (P4)
- `tsconfig.build.tsbuildinfo` — tracked but dirty on every build; `.gitignore` candidate (P4)

### Plan (Phases 1-2 findings, to be extended when subagent API recovers)
- P0 baseline green — [x] (1187/1187)
- P1 i18n parity — [x] 3a488ff
- P2 catalog audit — [x] 3a488ff
- P3 migration 034 — [x] 51a0299
- P4 .gitignore: `out/`, `__pycache__/`, `tsconfig.build.tsbuildinfo` — [x] (added `/out/` +
  `scripts/bible/__pycache__/`; `*.tsbuildinfo` already covered since 2026-09 root cleanup)
- P5 senior-rescue 6-dimension audit (dead-code / doc-drift / security /
  test-coverage / perf / ops) — workflow `wf_569d1fc2-8a3` re-lancé à froid
  (API subagents revenue), 5/6 agents complétés (dead-code + ops en cours).
  Findings consolidés :
  - **Security** : 7 findings, tous **Low / "no change needed"** (localStorage
    identity sans escalation, URL Supabase publique, RLS bien délégué au
    serveur, .env.local CRLF-tolérant, datasets cache sans size-check). ✅ aucun
    blocage.
  - **Doc-drift** :
    - P1 (High) `domains/ → services/` import (tracker.ts) → **FIXÉ cette session**
      (`WordFailure` domain-owned, service re-export).
    - P2 (High) 26 fichiers UI app/ + components/ qui importent directement
      `src/domains/` (BIBLE_BOOKS, ComparisonEngine, …) — hors périmètre
      immédiat, candidate pour un commit dédié (facade services par usage).
    - P3 (Medium) layout de domaines manquant (pas de `rules.ts`/`events.ts`
      partout, `strategy-recommendor.ts` typo + doublon `strategy-recommender.ts`
      en services, pas de `index.ts` dans streaks/telemetry/i18n).
    - P4 (Medium) 31 couleurs hex hardcodées dans `src/components/` (VerseCard,
      WordChip, TabNavigation, HeaderBar, ReferenceSearchInput, EmptyState,
      Text, Primitives) — violation règle 7 "Tokens uniquement".
    - P5 (Medium) features promises mais absentes/à demi-construites (F-002-F
      favori sans toggle UI ; F-004 WASM Rust mocké, pas de rust/ ; F-006-C
      bar chart 7 jours manquant).
    - P6 (Low) docs/14-folder-structure.md décrit encore le layout Expo obsolète.
  - **Test-coverage** : `domains/streaks/` et `domains/telemetry/` sans test
    direct (High), `fsrs/rating.ts` 4 fonctions non testées (Medium).
  - **Perf** : P1 (High) recherche plein-corpus à chaque keystroke sans
    debounce ; P2 (High) re-abonnement PowerSync qui fuit les old
    subscriptions ; P3 (Medium) sign-out ne dispose pas le singleton
    PowerSync (leak cross-user) ; P4 (Medium) 0 `React.memo` dans l'app ;
    P5-P9 (Medium/Low) O(n·m) highlight, timers qui re-rendent les chips,
    Zustand sans selectors (~30 call sites), expression morte dans
    `memorization-store.ts` (potentiellement dead code), `useSyncStatus`
    retourne un objet frais par appel.
  - **Ops** :
    - P1 (Medium) 4 fichiers `*.tsbuildinfo` encore trackés au HEAD
      (dont `tsconfig.tsbuildinfo` ~1 Mo) → **`git rm --cached` effectué cette
      session, deletions staged**.
    - P2 (Low) `.audit-tmp/` non ignoré → **ajouté à `.gitignore`**.
    - P3 (Low) pas de dupplication deps/devDeps.
    - P4 (Medium) CI/CD : `ci-secrets.example.env` dit "7 secrets" mais en
      liste 9 ; output `apk-artifact` (L248) nom erroné par rapport à l'artifact
      réellement uploadé (L322) → **corrigé cette session** ; 4 secrets
      `APPLE_*` manquants (documenté, iOS job no-op volontaire).
    - P5 (Low) migration 034 commitée + appliquée live (confirmée). À noter :
      30+ migrations CLI-générées sur l'instance partagée absentes de
      `supabase/migrations/` — à arbitrer (back-fill ou documenter).

### Fixed after audit (commits)
- **`02622d5`** — arch: route hooks through services for domain access
  (docs/29 Exception 4) + WordFailure domain-owned + 4 tsbuildinfo untracked
  + `.audit-tmp/` gitignored + CI apk-artifact output fix. 15 files,
  tsc 0, targeted vitest 25/25.
- **`dc3b9b3`** — fix(sync): `auth-store.signOut` dispose PowerSync
  (`syncService.dispose()` + `detachSyncCompletionHandlers()`) → leak
  cross-user résolu (audit P3-perf, High); `PowerSyncSyncService.startStream`
  now unsubscribes the prior subscription before re-subscribing
  (audit P2-perf, High). 2 files, tsc clean.
- **`2f1c8f4`** (or equivalent, dead-code commit) — delete 7 unreachable
  legacy components + unused `memorization-store.ts`:
  `bible/VerseCard`, `bible/WordChip`, `common/HeaderBar`,
  `common/TabNavigation`, `common/EmptyState`,
  `bible/ReferenceSearchInput`, `store/memorization-store`. No external
  consumers (verified by grep; only the two barrels re-exported them and
  no bare-barrel import exists in app/, src/ or tests/). Barrel exports
  updated. tsc clean after removal; targeted vitest (3 files, 32 tests)
  green. This also closes audit P4-doc-drift (31 hardcoded hex literals,
  2 of them off-palette vs the existing `src/theme/tokens.ts` status
  colors) — the honest fix is to delete the dead files rather than
  token-ify them.

### Still open (lower priority, tracked here for the next pass)
- **P2-doc-drift** (High): ~26 `app/` + `src/components/` value-imports from
  `src/domains/` remain (hooks are now Exception-4 clean). Several facades
  already exist to route through (`recall-comparison-service.ts`,
  `memorization-session-service.ts`, `i18n-service.ts`,
  `review-rating-service.ts`, `translation-comparison-service.ts`); the
  remaining `app/` pages import domain values directly and need to be
  routed through those existing services (do NOT create `useBibleBooks()`
  hooks — that would just relocate the violation).
- **P3-doc-drift** (Medium): add `index.ts` barrels to
  `domains/streaks/`, `domains/telemetry/`, `domains/i18n/`; rename
  `domains/memorization/strategy-recommendor.ts` (typo, port interface
  only — not a duplication); amend `docs/30-domain-rulebook.md` to accept
  the centralized `src/domains/events.ts` barrel instead of per-domain
  `events.ts`.
- **P5-doc-drift** (Medium): `docs/05-features.md` gaps (F-002-F favorite
  toggle UI missing; F-004 Rust WASM is mocked, `src/infrastructure/rust/`
  doesn't exist; F-006-C 7-day bar chart missing).
- **P6-doc-drift** (Low): `docs/14-folder-structure.md` still describes the
  obsolete Expo/Expo-RoR layout.
- **Test-coverage** (High): `domains/streaks/` and `domains/telemetry/` have
  no direct unit tests; `fsrs/rating.ts` 4 functions untested.
- **Perf P1** (High): `app/search/index.tsx` full-corpus filter+sort on every
  keystroke, no debounce. P4 (Medium): 0 `React.memo` in the app. P5
  (Medium): `ManuscriptView` O(n·m) `Array.includes`. P7 (Low): ~30
  Zustand whole-store call sites without selectors.
