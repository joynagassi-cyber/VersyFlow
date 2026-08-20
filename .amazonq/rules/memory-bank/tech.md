# VersyFlow — Technology Stack

## Core Languages & Runtimes

| Technology | Version | Role |
|---|---|---|
| TypeScript | 5.6.2 | Primary language (strict mode) |
| React | 18.3.1 | UI framework |
| React Native | 0.76.0 | Mobile runtime |
| Rust | >= 1.75 | FSRS engine (compiled to WASM) |
| Node.js | >= 18.x | Dev tooling |

## Framework & Platform

| Package | Version | Role |
|---|---|---|
| Expo | ~54.0.0 | Build platform & native modules |
| Expo Router | ~5.0.0 | File-based navigation |
| expo-localization | ~15.0.2 | Device locale detection |
| expo-haptics | ~14.0.1 | Haptic feedback |
| expo-font | ~13.0.0 | Custom fonts |
| expo-constants | ~17.0.8 | App constants |

## State Management & Data

| Package | Version | Role |
|---|---|---|
| Zustand | ^5.0.0 | Global state management |
| Zod | ^3.22.0 | Runtime schema validation |
| @insforge/sdk | 1.5.1 | Backend/auth/cloud sync |

## Internationalization

| Package | Version | Role |
|---|---|---|
| i18next | ^24.0.0 | i18n framework |
| react-i18next | ^15.0.0 | React bindings |
| expo-localization | ~15.0.2 | Locale detection |

## UI & Performance

| Package | Version | Role |
|---|---|---|
| react-native-reanimated | ~3.3.0 | Animations |
| react-native-safe-area-context | ^5.8.0 | Safe area handling |
| @shopify/flash-list | ^1.7.1 | High-performance lists |

## Development Tools

| Tool | Version | Role |
|---|---|---|
| ESLint | ^8.56.0 | Linting |
| @typescript-eslint | ^7.0.0 | TypeScript ESLint rules |
| Prettier | ^3.2.5 | Code formatting |
| Husky | ^9.0.6 | Git hooks |
| lint-staged | ^15.2.0 | Pre-commit linting |
| Jest | ^29.7.0 | Unit testing |
| jest-expo | ^54.0.0 | Expo Jest preset |
| Detox | (detox.json) | E2E testing |

## TypeScript Configuration

- **Strict mode**: `strict: true`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
- **Module resolution**: `bundler`
- **Target**: `es2020`
- **Path aliases**:
  - `@/*` → `src/*`
  - `@/components/*` → `src/components/*`
  - `@/domains/*` → `src/domains/*`
  - `@/services/*` → `src/services/*`
  - `@/store/*` → `src/store/*`
  - `@/tokens` → `src/tokens/index`
  - `@/i18n` → `src/i18n/index`
  - `@/hooks/*` → `src/hooks/*`
  - `@/utils/*` → `src/utils/*`
  - `@/types/*` → `src/types/*`

## Development Commands

```bash
# Start dev server
npm start                   # expo start

# Platform builds
npm run android             # expo run:android
npm run ios                 # expo run:ios

# Code quality
npm run typecheck           # tsc --noEmit
npm run lint                # eslint . --ext .ts,.tsx

# Testing
npm test                    # jest
npm run test:watch          # jest --watch
npm run test:coverage       # jest --coverage (70% threshold)

# Workflow management
npm run workflow            # node scripts/workflow.js
npm run sprint              # sprint management
npm run task                # task management
npm run monitor             # project monitoring
npm run release             # release workflow
```

## Test Configuration

- **Environment**: Node (not jsdom)
- **Coverage threshold**: 70% branches/functions/lines/statements
- **Coverage scope**: `src/**/*.{ts,tsx}` (excludes locale files)
- **Module alias**: `@/` → `src/` in tests
- **Transform**: babel-jest with `@babel/preset-typescript`

## Build & Infrastructure

- **Android**: Gradle build in `android/` with release keystore in `keystore/`
- **iOS**: Expo managed workflow
- **Database**: SQLite migrations in `migrations/` (3 migration files)
- **WASM**: Rust compiled in `rust/fsrs-wasm/`
- **CI/CD**: GitHub Actions in `.github/workflows/`
- **Backend**: InsForge SDK for auth + cloud sync
