# VersyFlow — Structure du Projet (Folder Structure)

## Document généré par Agent I — Delivery / DevEx

---

## 1. Arborescence Complète

```
versyflow/
│
├── app/                              # Écrans (React Router v6 + Ionic — pas de file-based routing)
│   ├── _layout.tsx                   # Root layout (i18n, ThemeProvider, gate sur store hydration)
│   ├── +not-found.tsx                # 404 fallback
│   ├── splash.tsx                    # Splash screen native
│   ├── notifications.tsx
│   ├── (tabs)/                       # Tab navigator
│   │   ├── _layout.tsx               # Tab shell
│   │   ├── auth/                     # Frictionless identify (email + name)
│   │   ├── index.tsx                 # Home tab
│   │   ├── explore.tsx               # Bible explorer tab
│   │   ├── progress.tsx              # Progress tab
│   │   └── settings.tsx              # Settings tab
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── language-select.tsx
│   │   ├── translation-select.tsx
│   │   ├── session-config.tsx
│   │   ├── fsrs-introduction.tsx
│   │   └── reminder-config.tsx
│   ├── memorization/
│   │   ├── session.tsx               # MemorizationSessionScreen (workspace)
│   │   ├── confirm.tsx
│   │   ├── workspace.tsx
│   │   └── flashcard.tsx
│   ├── review/
│   │   ├── queue.tsx
│   │   ├── session.tsx
│   │   ├── summary.tsx
│   │   ├── calendar.tsx
│   │   └── History.tsx
│   ├── bible/
│   │   ├── explorer.tsx
│   │   ├── book.tsx
│   │   └── chapter.tsx
│   ├── search/                       # Plein-corpus (debounced)
│   │   └── index.tsx
│   ├── comparison/                   # Comparaison multi-traductions
│   │   ├── index.tsx
│   │   └── translation.tsx
│   ├── semantic/                     # Vues sémantiques (5 tabs)
│   ├── achievements/
│   ├── analytics/                    # Dashboard + courbes rétention
│   │   └── dashboard.tsx
│   ├── collections/
│   ├── family/
│   ├── mastery/
│   ├── memory/
│   ├── profile/
│   └── settings/                     # Sous-écrans settings
│       ├── navigation.tsx
│       ├── languages.tsx
│       ├── data.tsx
│       └── available-translations.tsx
│
├── src/
│   ├── components/                   # UI components (presentation ONLY)
│   │   ├── ui/                       # Primitives de base (button, card, dialog, input, EmptyState, Primitives.tsx)
│   │   ├── common/                   # SyncStatusIndicator
│   │   ├── layout/                   # FullScreenPage
│   │   ├── navigation/               # BottomTabs, HamburgerMenu, QuickDock
│   │   ├── bible/                    # ManuscriptView, VerseActionBar
│   │   ├── memorization/             # ModeCards, ModeMask, ModeReveal, ModeWrite, ModeSwitcher, TranslationMenu
│   │   ├── profile/                  # ProfileAvatar
│   │   ├── semantic/                 # VerseSemanticTags
│   │   ├── brand/                    # AppIcon, Logo
│   │   ├── shared/                   # (tree mort, à supprimer)
│   │   ├── ThemeManager.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── domains/                      # Domain layer (pure business logic, no I/O)
│   │   ├── bible/                    # entities, parser, registry, repository, repository-local, canon-maps, schema, document
│   │   ├── fsrs/                     # engine (IFsrsEngine + Rating), entities, fallback-engine, rating, ts-fsrs-engine, wasm-engine
│   │   ├── memorization/             # entities, service, session-engine, comparison-engine, tracker, fatigue-detector, strategy-recommender-port, storage-adapter
│   │   ├── streaks/                  # repository (IStreakRepository) + index.ts
│   │   ├── telemetry/                # entities, it-telemetry + index.ts
│   │   ├── i18n/                     # config + index.ts
│   │   ├── progress/                 # mastery calculation
│   │   ├── semantic-memory/          # semantic nodes / graph
│   │   ├── family/ family-invitation/ learner-profile/
│   │   ├── events.ts                 # eventBus + DomainEventTypes (partagé)
│   │   └── index.ts                  # Domain barrel
│   │
│   ├── services/                     # Application layer (orchestration + composition root)
│   │   ├── events-service.ts         # Re-export eventBus/DomainEventTypes pour la UI
│   │   ├── i18n-service.ts           # Re-export SUPPORTED_LANGUAGES/isRTL
│   │   ├── memorization-session-service.ts   # composition root: createWorkspaceEngine, BIBLE_BOOKS_LIST, Rating, RATING_*
│   │   ├── review-rating-service.ts  # re-export Rating/ReviewRatingButton
│   │   ├── translation-preference-service.ts # re-export DEFAULT_BIBLE_TRANSLATIONS
│   │   ├── recall-comparison-service.ts      # getComparisonEngine()
│   │   ├── progress-service.ts       # StreakService orchestrator
│   │   ├── streak-service.ts, streak-coordinator.ts, streak-wiring.ts
│   │   ├── powersync-memorization-service.ts
│   │   ├── semantic-query-service.ts
│   │   ├── (bible-service, fsrs-factory, milestone, notification, sync-completion, qr-generator, …)
│   │
│   ├── store/                        # Zustand v5 (un store par domaine)
│   │   ├── settings-store, auth-store, bible-store, profile-store, family-store, review-store, sync-store, appearance-store, ui-store, highlight-store, context-store, profile-sync-store, family-sync-store
│   │   └── index.ts
│   │
│   ├── hooks/                        # Custom React hooks (UI glue only)
│   │   ├── useI18n, useIonicNavigation, useMemorizationSession, useMemorizationWorkspace,
│   │   ├── useBibleData, useTranslationPreference, useSemanticTags, useSemanticViews,
│   │   ├── useSessionSafety, useSyncStatus, useActiveProfile, useLearnerProfile,
│   │   ├── useFamilyService, useFamilyInvitation, useProfileSyncBridge, useFamilySyncBridge
│   │
│   ├── capabilities/                 # High-level features composant les stores
│   │   ├── analytics/ (store + hooks), comparison/, memory/
│   │   └── index.ts
│   │
│   ├── infrastructure/               # Infrastructure layer (I/O)
│   │   ├── storage/                  # mmkv, capacitor, async-storage, local-storage, storage-types
│   │   ├── sync/                     # PowerSync (powersync-database, powersync-schema, supabase-power-sync-connector, memorization-mapper, family-mapper, …)
│   │   ├── repository/               # PowerSync repositories
│   │   ├── bible/                    # Bible text sources (dataset loader)
│   │   ├── semantic/                 # Semantic memory adapter
│   │   ├── migration/
│   │   ├── logging/
│   │   └── telemetry/                # ITelemetryUploadPort + NoOp adapter
│   │
│   ├── auth/                         # SupabaseAuth (email + name, aucune validation)
│   │
│   ├── lib/                          # platform.ts (shared helpers), utils.ts
│   │
│   └── i18n/                         # i18next + 45 locales (`.ts`)
│       ├── config.ts, i18next-init.ts, index.ts
│       └── locales/                  # am, ar, bn, de, dz, en, es, fa, fil, fr, ha, he, hi, id, ig, it, ja, km, ko, ku, lo, ml, ms, my, ne, nl, pl, ps, pt, ru, sd, si, so, st, sw, ta, te, th, tr, tw, ur, vi, yo, zh, zh-Hant
│
├── rust/
│   └── fsrs-wasm/                    # FSRS engine (Rust → WASM) — fallback SM-2 JS en prod
│       ├── Cargo.toml, Cargo.lock
│       ├── src/
│       └── pkg/                      # Compiled .wasm (généré)
│
├── data/
│   └── bible/
│       ├── *.json                    # 35 datasets multi-traductions (ar-nav, asv, lsg, …)
│       └── raw/                      # USFM sources bruts (build inputs, gitignored)
│
├── powersync/                        # PowerSync Cloud service definition
│   ├── cli.yaml, service.yaml, sync-config.yaml
│   └── relay.sql, schema.json
│
├── supabase/                         # Backend (Postgres + RLS + storage)
│   ├── config.toml, MIGRATION_GUIDE.md
│   └── migrations/                   # 0000–00xx_*.sql (SSoT des tables Aurora)
│
├── scripts/                          # Outils de build (bible, i18n, powersync-wire, semantic:build)
│
├── tests/                            # Vitest (pas Jest, plus de Detox)
│   ├── unit/, integration/, e2e/, sync/, semantic/, auth/, api/, fixtures/
│   ├── setup.ts, jest-polyfill.ts, global-jest-globals.d.ts
│   └── test-summary.md
│
├── assets/                           # Images + polices (@fontsource, bundle offline)
│
├── docs/                             # Documentation complète
│   ├── 01-vision-produit.md  … 33-quality-gates.md
│   ├── 28-constitution.md, 29-architecture-rulebook.md, 30-domain-rulebook.md, 31-ui-rulebook.md, 32-ai-agent-rulebook.md
│   └── MEMO.md                       # Index + guide de lecture par agent
│
├── .github/workflows/ci-cd.yml       # Pipeline CI/CD (gates → build-web → APK + .ipa signés)
│
├── .eslintrc.js, .prettierrc
├── ionic.config.json, components.json, tailwind.config.js, postcss.config.js, vite.config.js
├── tsconfig.json, tsconfig.app.json, tsconfig.build.json, tsconfig.node.json, tsconfig.test.json, tsconfig.scripts.json, tsconfig.eslint.json
├── package.json, package-lock.json
└── README.md
```

---

## 2. Règles de Structuration

> ⚠️ **Mise à jour 2026-10-07** : la section 1 (arborescence) décrit le
> layout **réel** du projet (Vite/React 18 empaqueté dans Capacitor WebView,
> React Router v6, `data/bible/` 35 datasets, `rust/fsrs-wasm/`,
> `powersync/`, `supabase/migrations/`). L'ancienne version décrivait un
> layout Expo Router obsolète — ne pas s'y référer.

### Règle de DIRECTIONNELLE des dépendances

```
UI Layer (app/, src/components/)
    ↓ imports from
Hooks (src/hooks/)
    ↓ imports from
Services (src/services/)
    ↓ imports from
Domains (src/domains/)
    ↓ calls ports that are implemented by
Infrastructure (src/infrastructure/)
```

**Interdits formels:**
- ❌ `domains` importe depuis `services` ou `components`
- ❌ `components` importe depuis `services`, `domains`, ou `infrastructure`
- ❌ `services` importe depuis `components`

### Règle de LOCALISATION

| Type de fichier | Où le créer |
|-----------------|-------------|
| Écran (route) | `app/[feature]/[name].tsx` |
| Composant UI pur | `src/components/[category]/[Name].tsx` |
| Hook React | `src/hooks/use[Name].ts` |
| Service métier | `src/services/[name]-service.ts` |
| Entité domaine | `src/domains/[domain]/entities.ts` |
| Interface domaine | `src/domains/[domain]/repository.ts` ou `engine.ts` |
| Infrastructure | `src/infrastructure/[type]/[name].ts` |
| Utility pure | `src/utils/[name]-utils.ts` |
| Fichier données | `data/[type]/[name].json` |
| Code Rust | `rust/src/[name].rs` |

---

## 3. Conventions de Code

### Nommage
- **Composants**: PascalCase (`MemorizationSessionScreen`)
- **Hooks**: camelCase avec préfixe `use` (`useMemorizationSession`)
- **Services**: camelCase avec suffixe `Service` (`BibleService`)
- **Entités**: PascalCase (`MemorizationRecord`)
- **Interfaces**: préfixe `I` (`IFsrsEngine`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_RETENTION`)
- **Variables/functions**: camelCase
- **Fichiers**: camelCase pour `.ts/.tsx`, PascalCase pour composants `.tsx` uniquement si nommée dans le fichier

### TypeScript Strict Mode
- `noImplicitAny: true`
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

---

*Document approuvé. Transmis à l'Agent I pour Implementation Plan.*
