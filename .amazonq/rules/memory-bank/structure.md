# VersyFlow — Project Structure

## Root Layout

```
VersyFlow/
├── app/                    # Expo Router screens (file-based routing)
├── src/                    # All application source code
├── rust/fsrs-wasm/         # Rust FSRS engine compiled to WASM
├── data/bible/             # Static Bible data (LSG JSON)
├── migrations/             # SQLite migration SQL files
├── tests/                  # Unit, integration, e2e tests
├── docs/                   # Full project documentation (30+ files)
├── scripts/                # Dev/migration/workflow scripts
├── assets/                 # Icons, splash screens
└── design-artifacts/       # UX/design specs and briefs
```

## App Directory (Expo Router)

```
app/
├── (tabs)/                 # Bottom tab navigator screens
├── onboarding/             # First-launch flow
├── bible/                  # Bible navigation screens
├── memorization/           # Active memorization session
├── review/                 # FSRS review queue
├── progress/               # Stats and progress views
├── family/                 # Family group management
├── settings/               # App settings
├── profile/                # User profile
├── search/                 # Verse search
├── collections/            # Verse collections/playlists
├── achievements/           # Gamification
├── ai-coach/               # AI coaching feature
├── analytics/              # Detailed analytics
├── _layout.tsx             # Root layout with providers
├── boot.tsx                # App initialization
└── index.tsx               # Entry redirect
```

## Source Directory

```
src/
├── domains/                # Domain layer (pure business logic)
│   ├── bible/              # Bible entities, repository interface, parser, schema
│   ├── fsrs/               # FSRS engine, entities, WASM adapter, fallback
│   ├── memorization/       # Session engine, comparison engine, entities
│   ├── i18n/               # i18n service, config
│   ├── family/             # Family entities, permissions, service
│   ├── family-invitation/  # Invitation flow domain
│   ├── learner-profile/    # User profile domain
│   ├── progress/           # Progress tracking entities
│   ├── telemetry/          # Analytics/telemetry entities
│   └── events.ts           # Domain events definitions
│
├── services/               # Application services (orchestration layer)
│   ├── bible-service.ts    # Bible data access
│   ├── fsrs-factory.ts     # FSRS engine factory (WASM vs fallback)
│   ├── i18n-service.ts     # i18n initialization
│   ├── review-queue-service.ts  # Due review scheduling
│   ├── progress-service.ts # Progress persistence
│   ├── fatigue-detector.ts # Session fatigue detection
│   ├── strategy-recommender.ts  # Recall strategy selection
│   ├── telemetry-service.ts     # Event tracking
│   └── word-failure-tracker.ts  # Per-word error tracking
│
├── store/                  # Zustand global state stores
│   ├── bible-store.ts      # Bible navigation state
│   ├── memorization-store.ts    # Active session state
│   ├── review-store.ts     # Review queue state
│   ├── settings-store.ts   # App settings
│   ├── profile-store.ts    # User profile state
│   ├── family-store.ts     # Family group state
│   ├── auth-store.ts       # Authentication state
│   └── context-store.ts    # App-wide context
│
├── components/             # Reusable UI components (view only, no business logic)
│   ├── bible/              # Bible-specific components
│   ├── common/             # Generic shared components
│   ├── ui/                 # Design system primitives
│   ├── auth/               # Auth-related components
│   ├── navigation/         # Navigation components
│   └── shared/             # Cross-feature shared components
│
├── hooks/                  # Custom React hooks
│   ├── useMemorizationSession.ts
│   ├── useActiveProfile.ts
│   ├── useI18n.ts
│   └── useSessionSafety.ts
│
├── infrastructure/         # Technical infrastructure
│   ├── storage/            # AsyncStorage / SQLite adapters
│   ├── migration/          # DB migration runner
│   └── logging/            # Logging utilities
│
├── theme/                  # Design system
│   ├── tokens.ts           # Design tokens (colors, spacing, typography)
│   ├── ThemeProvider.tsx   # React context provider
│   └── useTheme.ts         # Theme hook
│
├── auth/                   # Authentication (InsForge SDK)
├── sync/                   # Cloud sync services
├── capabilities/           # Feature capability modules (AI, analytics, comparison, memory)
├── i18n/                   # i18next setup + locale files
├── types/                  # Shared TypeScript types
└── utils/                  # Pure utility functions
```

## Architectural Patterns

### Clean Architecture Layers
```
Screens (app/) → Hooks → Store → Services → Domains → Infrastructure
```
- **Domains**: Pure TypeScript, no React, no I/O — entities + repository interfaces
- **Services**: Orchestrate domain logic, call infrastructure
- **Store**: Zustand slices, connect services to UI
- **Components**: View-only, receive props, emit events — no direct service calls
- **Screens**: Compose components, use hooks/store

### Key Relationships
- `fsrs/engine.ts` defines the interface; `wasm-engine.ts` and `fallback-engine.ts` implement it
- `fsrs-factory.ts` selects WASM or fallback at runtime
- `memorization/session-engine.ts` orchestrates FSRS + comparison + strategy
- `bible/repository.ts` interface implemented by `services/bible-service.ts`
- All stores use Zustand with persist middleware for offline-first state

### Domain Events
- `src/domains/events.ts` defines typed domain events
- Services emit events; capabilities/analytics subscribe

### Routing
- Expo Router v5 with file-based routing
- `(tabs)/` for bottom navigation
- Deep linking supported via Expo Router conventions
