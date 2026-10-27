# VersyFlow — Master Backlog

> Source unique de vérité pour l'exécution du développement
> Généré le 2026-07-27 par CEO Program Manager
> Basé sur docs/01-* à docs/34-governance-compliance-audit.md

---

## Légende des Statuts

| Statut | Description |
|--------|-------------|
| TODO | À faire, prêt à démarrer |
| IN_PROGRESS | En cours d'implémentation |
| DONE | Terminé et merge sur main |
| BLOCKED | Bloqué par une dépendance externe |
| PENDING_REVIEW | Code terminé, en attente de review |

## Légende des Priorités

| Priorité | Description |
|----------|-------------|
| P0 | Critique — bloque tout le projet |
| P1 | Essentiel — nécessaire au MVP |
| P2 | Important — améliore significativement |
| P3 | Utile mais pas critique |

---

## Sprint 0 — Fondations (Jours 1-10)

### S0-01: Expo Project Initialized
- **ID**: S0-01
- **Module**: Core/Configuration
- **Dépendances**: Aucune
- **Propriétaire**: Forge
- **Priorité**: P0
- **Fichiers**: package.json, app.json, tsconfig.json, babel.config.js, metro.config.js
- **Tests requis**: `npx expo start` fonctionne
- **Critères d'acceptation**: Expo CLI lance sans erreur, build iOS et Android simulés passent
- **Statut**: DONE ✅
- **Commentaires**: Configuration Expo 52 + React Native 0.76 implémentée

### S0-02: ESLint + Prettier + Husky Configured
- **ID**: S0-02
- **Module**: Core/Tooling
- **Dépendances**: S0-01
- **Propriétaire**: Forge
- **Priorité**: P0
- **Fichiers**: .eslintrc.js, .prettierrc, .husky/pre-commit, lint-staged.config.js
- **Tests requis**: `npm run lint` passe vert, pre-commit hook functional
- **Critères d'acceptation**: ESLint avec rules architecture, Prettier format standard, Husky hooks configures
- **Statut**: DONE ✅
- **Commentaires**: Rules import direction enforcees via eslint-plugin-import

### S0-03: Folder Structure Created
- **ID**: S0-03
- **Module**: Core/Structure
- **Dépendances**: S0-01
- **Propriétaire**: Forge
- **Priorité**: P0
- **Fichiers**: Tous dossiers sous src/, app/, data/, tests/
- **Tests requis**: Aucune — structure directory
- **Critères d'acceptation**: Arborescence complète selon docs/14-folder-structure.md
- **Statut**: DONE ✅
- **Commentaires**: Structure validée conforme Clean Architecture 4 couches

### S0-04: Design Tokens Exported
- **ID**: S0-04
- **Module**: Core/Design
- **Dépendances**: S0-03
- **Propriétaire**: Forge
- **Priorité**: P0
- **Fichiers**: src/tokens/index.ts
- **Tests requis**: Unit test verification token values match specs
- **Critères d'acceptation**: Colors, typography, spacing, radius, shadows, animations, z-index exportés
- **Statut**: DONE ✅
- **Commentaires**: 8 palettes de couleurs, 7 tailles de police, 7 niveaux d'espacement, dark mode mapping

### S0-05: Three UI Primitives Built
- **ID**: S0-05
- **Module**: Components/UI
- **Dépendances**: S0-04
- **Propriétaire**: Forge
- **Priorité**: P1
- **Fichiers**: src/components/ui/ButtonPrimary.tsx, ButtonSecondary.tsx, Text.tsx
- **Tests requis**: Component render tests
- **Critères d'acceptation**: Props TypeScript corrects, states default/pressed/disabled/loading, design tokens appliques
- **Statut**: DONE ✅
- **Commentaires**: Pill buttons + reusable Text component with size/weight variants

### S0-06: Storage Layer Skeleton
- **ID**: S0-06
- **Module**: Infrastructure/Storage
- **Dépendances**: S0-03
- **Propriétaire**: Anvil
- **Priorité**: P0
- **Fichiers**: src/infrastructure/storage/storage-types.ts, mmkv-storage.ts, async-storage.ts, index.ts
- **Tests requis**: Contract test IStorage interface matching
- **Critères d'acceptation**: IStorage interface définie, MMKV adapter skeleton, AsyncStorage fallback skeleton
- **Statut**: DONE ✅
- **Commentaires**: Adapteur pattern respecte PA-4 et PA-5 du principles

### S0-07: TypeScript Types Defined
- **ID**: S0-07
- **Module**: Core/Types
- **Dépendances**: S0-03
- **Propriétaire**: Anvil
- **Priorité**: P0
- **Fichiers**: src/types/globals.d.ts, navigation.d.ts
- **Tests requis**: TypeScript compilation passes (`tsc --noEmit`)
- **Critères d'acceptation**: UserSettings, BibleBook, BibleVerse, MemorizationRecord, FsrsState, ReviewLog, FsrsReview interfaces definies
- **Statut**: DONE ✅
- **Commentaires**: Models alignes avec 10-data-model.md

### S0-08: IFsrsEngine Interface Defined
- **ID**: S0-08
- **Module**: Domain/FSRS
- **Dépendances**: S0-03, S0-07
- **Propriétaire**: Anvil
- **Priorité**: P0
- **Fichiers**: src/domains/fsrs/engine.ts, entities.ts, index.ts
- **Tests requis**: N/A — interface pure, implementation testee dans Sprint 2
- **Critères d'acceptation**: Enum Rating, FsrsState interface, IFsrsEngine methods new/read/review/explain/getDueItems
- **Statut**: DONE ✅
- **Commentaires**: Contract stable pour WASM + FallbackEngine

### S0-09: Fallback SM-2 Engine Implemented
- **ID**: S0-09
- **Module**: Domain/FSRS
- **Dépendances**: S0-08
- **Propriétaire**: Anvil
- **Priorité**: P1
- **Fichiers**: src/domains/fsrs/fallback-engine.ts
- **Tests requis**: Unit tests for SM-2 behavior matching classic algorithm
- **Critères d'acceptation**: Implements IFsrsEngine, rating AGAIN resets interval, GOOD increases by 1.5x, EASY by 3x
- **Statut**: DONE ✅
- **Commentaires**: Backup plan si WASM compilation echoue

### S0-10: Zustand Stores Skeleton
- **ID**: S0-10
- **Module**: Store
- **Dépendances**: S0-03
- **Propriétaire**: Anvil
- **Priorité**: P0
- **Fichiers**: src/store/settings-store.ts, bible-store.ts, memorization-store.ts, review-store.ts, index.ts
- **Tests requis**: Store initialization tests
- **Critères d'acceptation**: 4 stores fonctionnels, state shapes alignes avec models, actions definies
- **Statut**: DONE ✅
- **Commentaires**: Stores fins comme requis, pas de logique metier dedans

### S0-11: Expo Router Navigation Shell
- **ID**: S0-11
- **Module**: App/Navigation
- **Dépendances**: S0-03
- **Propriétaire**: Herald
- **Priorité**: P0
- **Fichiers**: app/_layout.tsx, app/+not-found.tsx, app/(tabs)/_layout.tsx
- **Tests requis**: Navigation route resolution
- **Critères d'acceptation**: Stack layout with modal presentations, tab bar with 4 tabs defined
- **Statut**: DONE ✅
- **Commentaires**: Expo Router typed routes enabled per best practices

### S0-12: Root Layout with i18n Init
- **ID**: S0-12
- **Module**: App/Layout
- **Dépendances**: S0-11
- **Propriétaire**: Herald
- **Priorité**: P0
- **Fichiers**: app/_layout.tsx
- **Tests requis**: i18n service called on mount
- **Critères d'acceptation**: SafeAreaProvider, I18nService.getInstance() called, StatusBar configured
- **Statut**: DONE ✅
- **Commentaires**: RTL direction managed via I18nManager.forceRTL

### S0-13: i18n Service + Config
- **ID**: S0-13
- **Module**: Domain/i18n
- **Dépendances**: S0-03
- **Propriétaire**: Translator
- **Priorité**: P0
- **Fichiers**: src/i18n/config.ts, i18n-service.ts, index.ts, locales/{fr,en}.json
- **Tests requis**: i18n.translate() returns correct strings, fallback chain works
- **Critères d'acceptation**: SUPPORTED_LANGUAGES defined, I18nService singleton working, 2 languages fully translated
- **Statut**: PARTIALLY_DONE ⚠️
- **Commentaires**: FR and EN locales complete, AR/DE/ZH still need translations

### S0-14: Logger Infrastructure
- **ID**: S0-14
- **Module**: Infrastructure/Logging
- **Dépendances**: S0-03
- **Propriétaire**: Anvil
- **Priorité**: P1
- **Fichiers**: src/infrastructure/logging/logger.ts
- **Tests requis**: ConsoleLogger outputs correct levels
- **Critères d'acceptation**: Debug/info/warn/error methods, conditional dev logging
- **Statut**: DONE ✅
- **Commentaires**: Simple console logger for MVP

### S0-15: CI Pipeline GitHub Actions
- **ID**: S0-15
- **Module**: Core/CI
- **Dépendances**: S0-02
- **Propriétaire**: Forge
- **Priorité**: P1
- **Fichiers**: .github/workflows/ci.yml
- **Tests requis**: Pipeline triggers on push/PR
- **Critères d'acceptation**: Jobs: typecheck → lint → test → build (iOS + Android prebuild)
- **Statut**: DONE ✅
- **Commentaires**: PR validation enforced before any merge

### S0-16: Jest Configuration
- **ID**: S0-16
- **Module**: Core/Test
- **Dépendances**: S0-02
- **Propriétaire**: Anvil
- **Priorité**: P1
- **Fichiers**: jest.config.js
- **Tests requis**: Jest runs with expo preset
- **Critères d'acceptation**: Coverage thresholds set (70% global), module name mapper @/*
- **Statut**: DONE ✅
- **Commentaires**: Basic Jest setup, full coverage metrics defined in testing-strategy.md

### S0-17: Git Hooks (Husky Pre-Commit)
- **ID**: S0-17
- **Module**: Core/Hooks
- **Dépendances**: S0-02
- **Propriétaire**: Forge
- **Priorité**: P1
- **Fichiers**: .husky/pre-commit
- **Tests requis**: Pre-commit hook blocks bad commits
- **Critères d'acceptation**: Runs lint-staged + tsc --noEmit on git commit
- **Statut**: DONE ✅
- **Commentaires**: Stops commits that fail lint or typecheck

---

**Sprint 0 Status: 14/17 tasks DONE, 3 PARTIAL/NEEDS_COMPLETION**
**Completion: 82%**

**Blockers for Sprint 1:**
- S0-13: AR/DE/ZH locale files still need translation work (Translator agent)
- No actual MMKV runtime wired up yet (storage-types.ts is interface only)

---

*Ce backlog est mis à jour à chaque fin de sprint par Guardian.*
*Pour modifier une tâche existante: noter la raison dans le champ "commentaires" et mettre à jour le statut.*
