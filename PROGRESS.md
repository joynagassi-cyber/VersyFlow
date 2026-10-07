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
| tests (`npx vitest run`) | ✅ **1187/1187 passed (110 files)** — re-confirmé **2×** (run sous
  charge 14:35 + run calme final 14:44, ~4 min 21 s). Note : la ligne
  `Errors: 1 error` du rapport vitest est un artefact de la
  `window.close()` teardown du worker PowerSync — 0 test échoué. |
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
- **`815f9c2`-equivalent (this commit)** — **dead-code round 2** : after
  `7ded187` deleted 7 legacy components + `memorization-store.ts`, the
  re-launched 6-dimension audit (workflow `wf_569d1fc2-8a3`, 25 agents)
  confirmed two more dead trees via adversarial verify agents
  (`isReal: true`, journal at `subagents/workflows/wf_569d1fc2-8a3/journal.jsonl`):

  **Baril `src/components/index.ts` (entier mort)** — 0 importeur n'importe pas
  `from '@/components'` (ni `'src/components/index'` ni relatif) dans
  `app/` + `src/` + `cypress/` + `tests/`. Sa seule raison d'être était de
  re-exporter 4 composants qui sont eux-mêmes morts :
  - `ui/ButtonPrimary.tsx` — 0 importeur non-baril
  - `ui/ButtonSecondary.tsx` — 0 importeur non-baril
  - `ui/Text.tsx` — 0 importeur non-baril (ne sert que de petit wrapper sur
    `Primitives` sans client vivant)
  - `common/StatCard.tsx` — 0 importeur non-baril ; le `shared/index.tsx`
    définit son **propre** `StatCard` interne (`Primitives/Card` à la ligne
    288), donc ce n'est PAS le même composant
  - L'e2e `tests/e2e/theme-ui-flow.test.ts` (ligne 145–170) qui prétend
    « protéger » ces composants est un stub `const componentExists = true`
    sans import ni rendu réel — il ne protège rien, donc la suppression
    ne casse pas le test (re-run 18/18 green confirmé).

  **Arbre `src/components/shared/index.tsx` (entier mort, caveat du verify
  agent exploité)** — le verify avait signalé que `shared/index.tsx` lui
    même avait 0 importeurs. Confirmé par grep : aucun import littéral
    `components/shared` / `components/shared/` nulle part dans
    `app/` + `src/` + `cypress/` + `tests/`. Ses 11 exports
    (`ScreenWrapper`, `HeaderBar`, `PrimaryButton`, `SecondaryButton`,
    `IconButton`, `SectionTitle`, `Card`, `StatCard`, `EmptyState`,
    `LoadingState` + `IonIcon` re-export) ne sont consommés que par
    l'e2e stub `theme-ui-flow.test.ts` (mesures `const componentExists =
    true`), qui n'importe rien de réel. Le `app/` réel a ses propres
    écrans qui utilisent `FullScreenPage.tsx` + `Primitives` directement,
    jamais `shared/index.tsx`.

  **2 composants `common/` orphelins (non détectés par le round 1,
  confirmés par grep)** — `common/ContextSwitcher.tsx` +
  `common/LearnerSwitcher.tsx` : 0 importeur `from '...ContextSwitcher'`
  / `LearnerSwitcher` dans `app/`+`src/`+`cypress/`+`tests/` (uniquement
  référencés par des **commentaires** de l'e2e i18n
  `tests/unit/i18n/i18next-initialization.test.ts` lignes 195/237, qui
  spot-checke des clés i18next sans import réel des composants). Morts.

  Fichiers supprimés (8 au total) :
  - `src/components/index.ts` (baril)
  - `src/components/ui/Text.tsx`
  - `src/components/ui/ButtonPrimary.tsx`
  - `src/components/ui/ButtonSecondary.tsx`
  - `src/components/common/StatCard.tsx`
  - `src/components/common/ContextSwitcher.tsx`
  - `src/components/common/LearnerSwitcher.tsx`
  - `src/components/shared/index.tsx` (arbre entier)

  **Vérifications** : `tsc --noEmit` → 0 erreur. Vitest ciblé
  (`theme-ui-flow` + `i18next-initialization` + `semantic/import`) →
  80/80 green (le seul « Errors: 1 error » du rapport vitest est le
  `window.close()` teardown du worker PowerSync déjà tracé, non un test
  qui échoue — 0 test échoué, exit 0). La suite full (hors
  `semantic/import.test.ts` qui fait déjà 98 s) est en cours de
  re-confirmation en fond (task `bh4x2hia8`).

  **Note de sécurité** : le grep a confirmé qu'aucun de ces 8 fichiers
  n'a d'importeur vivant dans `app/` ni `src/` (hors baril mort lui-même
  et hors self-reference). `Primitives.tsx` (dont `shared/index.tsx`
  dépendait en lecture) est **indépendant** — il reste importé par
  `ThemeProvider.tsx`, `tokens.ts`, `useSessionSafety.ts` + 5 autres
  composants live — donc rien de vivant n'a été cassé. `SyncStatusIndicator.tsx`
  (le dernier survivant de `common/`) reste en place et est importé par
  `app/(tabs)/_layout.tsx`.
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

### Fixed after audit (commits)
- **dead-code round 2 commit (`36c4fc1`)** — 8 additional unreachable
  component files deleted (barrel `src/components/index.ts`, entire
  `shared/index.tsx` tree, `ui/Text`/`ui/ButtonPrimary`/`ui/ButtonSecondary`/
  `common/StatCard` + orphan `common/ContextSwitcher`/`common/LearnerSwitcher`),
  all confirmed `isReal: true` by the re-launched 6-dim audit's verify
  agents (journal `wf_569d1fc2-8a3`). tsc 0, targeted vitest 80/80, prod
  build PASS (6m20s).
- **`bible-text-service-stats.test.ts` — 2 tests hit the 5000 ms Vitest
  timeout** — root cause was NOT a network fetch (that fallback is already
  caught-and-swallowed by the service), but `freshService()` (a full
  `vi.resetModules()` + re-import of the service module, which re-runs the
  57-dataset `dataset-catalog.json` filter) occasionally taking >5 s on a
  heavily loaded machine. Fix: (a) stub `globalThis.fetch` to reject
  immediately so no real network I/O can ever sneak in; (b) rewire the
  "reads a fresh" test to use `KNOWN_ID` (`ar-nav`, a real catalogued
  dataset) + a valid `seedDatasetCache` so the stats-cache read path is
  actually exercised in dev mode (the original used an uncatalogued
  `ghost-seeded` id, which `preferRemoteSource()` short-circuits before
  ever reaching the stats-cache lookup — so that test was silently
  untesting what it claimed to test); (c) raise those 3 tests' per-test
  timeout to 15 s (the default 5 s was below the cold-cache re-import
  floor observed: ~5.4 s on a calm machine). Verified: 11/11 green in
  isolation (file total ~8.4 s, vs. prior flaky ~49–98 s under load).

### Still open (lower priority, tracked here for the next pass)
- **P2-doc-drift — DONE**: all ~26 `app/` + `src/components/` value-imports
  routed through service facades (commit `9bda773`). 0 value-imports of
  `@/domains/` remaining in `app/` + `src/components/` (16 type-only stay
  legal per docs/29 §6 Exception 4). `470ca25` deduped a stale
  `RATING_AGAIN` redeclaration introduced by that commit.
- **P3-doc-drift — DONE** (commit `a5baf41`):
  - `index.ts` barrels added to `src/domains/streaks/`,
    `src/domains/telemetry/`, `src/domains/i18n/` (all 3 previously
    missing — `bible`, `family`, `fsrs`, `memorization`, `progress`,
    `semantic-memory`, `learner-profile`, `family-invitation` already had
    their own `index.ts`, confirmed by `ls`).
  - `src/domains/memorization/strategy-recommendor.ts` → renamed
    `strategy-recommender-port.ts` (typo in the port-interface filename;
    the concrete `src/services/strategy-recommender.ts` keeps its correct
    spelling, so the pair now reads `strategy-recommender` (service) /
    `strategy-recommender-port` (domain port) with no visual collision).
    2 import sites updated (`src/services/review-queue-service.ts`,
    `src/services/strategy-recommender.ts`) + `src/domains/memorization/
    index.ts` re-export + `tests/unit/services/strategy-recommender.test.ts`.
    tsc 0, 59/59 targeted tests green.
- **P5-doc-drift — PARTIALLY DONE** (commit `d118d68`):
  - `docs/05-features.md` F-002-F "Versets favoris" now explicitly
    annotated as **defined but toggle UI absent** — the `FAVORITE_TOGGLED`
    domain event is declared in `src/domains/events.ts` but no UI component
    ever emits it; `MemorizationRecord.favorite` is never read back. The
    doc now names `VerseActionBar` as the place to implement the toggle
    and `app/collections/` as the filter surface.
  - F-006-C "Graphique hebdomadaire" closed: `app/analytics/dashboard.tsx`
    already renders a weekly-trend card (`thisWeek`/`lastWeek`/
    `changePercentage`, `stats.weeklyTrend`) — the audit's "bar chart 7
    jours manquant" was a false positive.
  - F-004 "Rust WASM" — **WON** (commit `5a455f3`): real Rust/WASM FSRS
    pipeline wired into the Vite bundle. `rust/fsrs-wasm/` rewritten
    against the actual `fsrs` 6.6 crate API, compiled with `wasm-pack`
    (devDependency, real `.wasm` checked into `src/infrastructure/wasm/`),
    `src/domains/fsrs/wasm-engine.ts` is now a real bridge (lazy `init()`,
    no more mock), `isWasmAvailable()` reflects the artifact's actual
    presence. `TsFsrsEngine` remains the default engine in
    `fsrs-factory.ts`; `WasmFsrsEngine` is now loadable on demand.
    `docs/05-features.md` F-004-C updated accordingly. Test rewritten to
    mock the WASM module deterministically (bridge-layer coverage without
    needing a real WebAssembly runtime in jsdom).
- **P6-doc-drift — DONE** (commit `d118d68`): `docs/14-folder-structure.md`
  §1 arborescence fully rewritten to match the real Vite/Capacitor layout
  (React Router v6, `data/bible/*.json`, `rust/fsrs-wasm/`, `powersync/`,
  `supabase/migrations/`, `scripts/`, `tests/` Vitest, `.github/
  workflows/ci-cd.yml`). Old section described an obsolete Expo Router /
  Metro / Detox / 5-locale layout. A ⚠️ banner at the top of §2 makes the
  2026-10-07 update explicit so no one reads the pre-update tree as SSoT.
- **Test-coverage — PARTIALLY DONE**:
  - `src/domains/streaks/` (port-only, no testable rule) — covered by
    `tests/unit/services/streak-service.test.ts` (17 tests) and the new
    `tests/unit/services/streak-coordinator.test.ts` (6 tests, added in
    `a5baf41`, exercises `startStreakCoordinator` wiring +
    fire-and-forget semantics + disposer).
  - `src/domains/telemetry/` — `redact()` covered by `tests/unit/domains/
    telemetry/redaction.test.ts` (3 tests: nested stripping, passthrough,
    deep nesting). Port `ITelemetry` has no standalone test; concrete
    `TelemetryService` is covered by `tests/unit/services/telemetry-
    service.test.ts`. No standalone `ITelemetry` test needed (interface
    files have no logic).
  - `src/domains/fsrs/rating.ts` — covered by `tests/unit/review-
    rating.test.ts` (44 tests, all 4 functions + the button-list
    invariant). The "4 functions untested" claim in the original audit
    was stale — the file was already wired to `tests/unit/review-rating.
    test.ts` (which imports from `@/domains/fsrs` barrel, not the path
    directly).
- **Perf P1 — DONE** (commit `c8d936e`): `app/search/index.tsx` now
  debounces the full-corpus filter (250 ms), precomputes lowercased
  `refLower`/`bookLower`/`textLower` once at index-build time, and
  drops the O(n log n) sort for a two-way reference-prefix partition.
- **Perf P4 — DONE** (commit `5b4884d`): `React.memo` added to the 4
  pure-leaf UI primitives that re-render most often inside lists
  (`Chip`, `ListItem`, `ProgressRing`, `RatingBar`) so a parent's
  re-render no longer cascades to every row/chip/ring.
- **Perf P5 — DONE** (commit `5b4884d`): `ManuscriptView` now builds a
  `Set` from `useHighlightStore().keys` once per render instead of
  calling `Array.includes` O(n·m) per verse.
- **Perf P7 — DONE** (commit `667eebf`): all ~33 whole-store Zustand
  destructuring call sites (`useXStore()` across `app/`,
  `src/components/navigation/`, `src/hooks/`) rewritten to one
  per-field selector call, so each component only re-renders when a
  field it actually reads changes. No `useXStore()` (no-arg whole-store)
  call sites remain.
