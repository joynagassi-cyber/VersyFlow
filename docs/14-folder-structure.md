# VersyFlow — Structure du Projet (Folder Structure)

## Document généré par Agent I — Delivery / DevEx

---

## 1. Arborescence Complète

```
versyflow/
│
├── app/                              # Expo Router (file-based routing)
│   ├── (tabs)/                       # Tab navigator screens
│   │   ├── _layout.tsx               # Tab layout shell
│   │   ├── index.tsx                 # Home tab
│   │   ├── explore.tsx               # Bible explorer tab
│   │   ├── progress.tsx              # Progress tab
│   │   └── settings.tsx              # Settings tab
│   ├── _layout.tsx                   # Root layout (i18n, theme provider)
│   ├── +not-found.tsx                # 404 fallback
│   ├── onboarding/
│   │   ├── _layout.tsx               # Full-screen modal layout
│   │   ├── welcome.tsx
│   │   ├── language-select.tsx
│   │   └── translation-select.tsx
│   ├── memorization/
│   │   ├── session.tsx               # MemorizationSessionScreen
│   │   └── confirm.tsx               # MemorizationConfirmScreen
│   └── review/
│       ├── queue.tsx                 # ReviewQueueScreen
│       ├── session.tsx               # ReviewSessionScreen
│       └── summary.tsx               # ReviewSummaryScreen
│
├── src/
│   ├── components/                   # UI components (presentation ONLY)
│   │   ├── ui/                       # Base primitives
│   │   │   ├── ButtonPrimary.tsx
│   │   │   ├── ButtonSecondary.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── ScrollView.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx          # Loading shimmer
│   │   ├── common/                   # Shared compound components
│   │   │   ├── HeaderBar.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ToastNotification.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── bible/                    # Bible-specific UI
│   │       ├── BookCard.tsx
│   │       ├── ChapterGrid.tsx
│   │       ├── VerseCard.tsx
│   │       ├── WordChip.tsx
│   │       └── ReferenceSearchInput.tsx
│   │
│   ├── domains/                      # Domain layer (pure business logic)
│   │   ├── bible/                    # Bible domain
│   │   │   ├── entities.ts           # BibleBook, BibleChapter, BibleVerse
│   │   │   ├── parser.ts             # ReferenceResolver
│   │   │   ├── translator.ts         # TranslationRegistry
│   │   │   ├── repository.ts         # IBibleRepository interface
│   │   │   └── index.ts
│   │   ├── fsrs/                     # FSRS domain
│   │   │   ├── entities.ts           # FsrsState, Rating enum
│   │   │   ├── engine.ts             # IFsrsEngine interface
│   │   │   ├── rust-engine.ts        # WasmFsrsEngine impl
│   │   │   ├── fallback-engine.ts    # SM2FallbackEngine impl
│   │   │   ├── calculator.ts         # Pure math helpers
│   │   │   └── index.ts
│   │   ├── i18n/                     # Internationalization domain
│   │   │   ├── locales/              # Language files
│   │   │   │   ├── fr.json
│   │   │   │   ├── en.json
│   │   │   │   ├── ar.json
│   │   │   │   ├── de.json
│   │   │   │   └── zh.json
│   │   │   ├── config.ts             # Supported languages, defaults
│   │   │   ├── directions.ts         # RTL/LTR detection
│   │   │   ├── hooks.ts              # useI18n hook
│   │   │   ├── i18n-service.ts       # I18nService class
│   │   │   └── index.ts
│   │   ├── memorization/             # Memorization domain
│   │   │   ├── entities.ts           # MemorizationRecord
│   │   │   ├── session.ts            # Session management logic
│   │   │   ├── validator.ts          # Answer validation
│   │   │   └── index.ts
│   │   └── index.ts                  # Domain barrel
│   │
│   ├── services/                     # Application layer (orchestration)
│   │   ├── bible-service.ts          # Orchestrate Bible domain + storage
│   │   ├── fsrs-service.ts           # Orchestrate FSRS domain + records
│   │   ├── settings-service.ts       # User settings persistence
│   │   ├── progress-service.ts       # Aggregated statistics
│   │   └── index.ts
│   │
│   ├── store/                        # State management (Zustand)
│   │   ├── settings-store.ts         # User settings state
│   │   ├── bible-store.ts            # Bible navigation state
│   │   ├── memorization-store.ts     # Current session state
│   │   ├── review-store.ts           # Review queue state
│   │   └── index.ts
│   │
│   ├── hooks/                        # Custom React hooks (UI glue only)
│   │   ├── useI18n.ts
│   │   ├── useTheme.ts
│   │   ├── useSettings.ts
│   │   ├── useBibleNavigation.ts
│   │   ├── useMemorizationSession.ts
│   │   └── useReviewQueue.ts
│   │
│   ├── infrastructure/               # Infrastructure layer
│   │   ├── storage/                  # Storage adapters
│   │   │   ├── mmkv-storage.ts       # MMKV implementation
│   │   │   ├── async-storage.ts      # AsyncStorage fallback
│   │   │   └── storage-types.ts      # IStorage interface
│   │   ├── rust/                     # Rust integration
│   │   │   ├── wasm-loader.ts        # WASM module loader
│   │   │   └── fsrs-wasm-bindings.ts # WebAssembly bindings
│   │   └── logging/
│   │       └── logger.ts
│   │
│   ├── utils/                        # Pure utility functions
│   │   ├── date-utils.ts
│   │   ├── string-utils.ts
│   │   ├── hash-utils.ts
│   │   └── format-utils.ts
│   │
│   ├── types/                        # Global TypeScript types
│   │   ├── globals.d.ts
│   │   └── navigation.d.ts
│   │
│   └── index.ts                      # Barrel exports
│
├── rust/                             # Rust source code (FSRS engine)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs                    # Main library entry, #[wasm_bindgen]
│   │   ├── fsrs_adapter.rs           # WASM-exposed FSRS functions
│   │   └── utils.rs                  # Rust utilities
│   └── pkg/                          # Compiled WASM output (.gitignored)
│
├── data/                             # Static data files
│   ├── bible/
│   │   ├── lsg.json                  # Louis Segond 1910 (MVP default)
│   │   └── .gitkeep
│   └── .gitkeep
│
├── tests/                            # Test files
│   ├── unit/                         # Unit tests (matching src/ structure)
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests (Detox)
│
├── assets/                           # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   └── onboarding/
│   └── fonts/
│
├── docs/                             # Complete project documentation
│   ├── 01-vision-produit.md
│   ├── 02-principes-produit.md
│   ├── 03-prd.md
│   ├── 04-user-flows.md
│   ├── 05-features.md
│   ├── 06-design-system.md
│   ├── 07-design-tokens.md
│   ├── 08-ui-screens.md
│   ├── 09-architecture.md
│   ├── 10-data-model.md
│   ├── 11-bible-domain.md
│   ├── 12-internationalization.md
│   ├── 13-fsrs-domain.md
│   ├── 14-folder-structure.md
│   ├── 15-implementation-plan.md
│   ├── 16-ai-dev-guide.md
│   └── 17-workflows-systeme.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── .eslintrc.js
├── .prettierrc
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
├── metro.config.js
├── README.md
└── .gitignore
```

---

## 2. Règles de Structuration

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
