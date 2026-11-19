# VersyFlow — Assignments des Agents IA

> Source: documentation specs docs/01-* à docs/20-* (TOUJOURS lire AVANT de coder)
> Chaque agent a un ownership exclusif de dossiers. Aucune collision possible.

---

## Les 6 Agents

### 1. Forge — Architecte Infrastructure & Build

**Dossiers propriétaires**: Tout ce qui CONFIGURE le projet
- Configuration files: package.json, tsconfig.json, .eslintrc.js, .prettierrc, app.json, babel.config.js, metro.config.js
- Infrastructure tooling: .github/workflows/, husky/, lint-staged.config.js
- Rust: rust/Cargo.toml, rust/src/, rust/pkg/ (output WASM)
- Tokens: src/tokens/index.ts
- Primitives UI initiales (3 fichiers): src/components/ui/ButtonPrimary.tsx, ButtonSecondary.tsx, Text.tsx

**Fichiers STRICTEMENT interdits**:
- app/** (ecrans excepte les 3 primitives ci-dessus)
- src/domains/** (lecture seule pour comprehension)
- src/services/**
- src/store/**
- src/hooks/**
- src/i18n/**
- data/bible/*.json
- docs/** (sauf 08-execution/)
- tests/**

**Entrees necessaires**: 14-folder-structure.md, 07-design-tokens.md, 13-fsrs-domain.md
**Sorties produites**: Projet initialisé, WASM compile, CI vert, builds production
**Debut**: Jour 1 | **Fin**: Jour 66 (Sprint 5)

---

### 2. Anvil — Architecte Domaine, Données & Tests

**Dossiers propriétaires**: Toute la logique métier et les tests
- src/domains/bible/** (entities, parser, translator, repository)
- src/domains/fsrs/** (engine.ts, entities.ts, fallback-engine.ts, calculator.ts)
- src/domains/memorization/** (entities, session, validator)
- src/domains/i18n/** (config.ts, directions.ts — structure uniquement, pas les fichiers .json)
- src/services/** (bible-service.ts, fsrs-service.ts, settings-service.ts, progress-service.ts)
- src/store/** (settings-store.ts, bible-store.ts, memorization-store.ts, review-store.ts)
- src/infrastructure/storage/** (mmkv-storage.ts, async-storage.ts, storage-types.ts)
- src/types/** (globals.d.ts, navigation.d.ts)
- src/utils/** (date-utils, string-utils, hash-utils, format-utils)
- tests/unit/**, tests/integration/**, tests/e2e/**
- tests/mocks/** (InMemoryStorage, MockFsrsEngine, etc.)

**Fichiers STRICTEMENT interdits**:
- app/** (aucun ecran)
- src/components/** (aucun composant UI)
- src/hooks/** (sauf hooks minimal pour stores)
- src/i18n/locales/*.json
- data/bible/*.json (lecture seule)
- rust/** (lecture seule)
- docs/**

**Entrees necessaires**: 10-data-model.md, 11-bible-domain.md, 13-fsrs-domain.md, 18-test-strategy.md
**Sorties produites**: Domaines implementes, services, stores, tests passant, coverage > 90%
**Debut**: Jour 1 | **Fin**: Jour 60 (Sprint 4)

---

### 3. Herald — Architecte UI & Navigation

**Dossiers propriétaires**: Tous les ecrans, composants UI, hooks, et animations
- app/** (tous les ecra ns Expo Router)
- src/components/ui/** (apres les 3 premiers de Forge)
- src/components/common/** (HeaderBar, TabNavigation, EmptyState, ToastNotification, SearchBar, StatCard, LoadingSpinner, Skeleton)
- src/components/bible/** (BookCard, ChapterGrid, VerseCard, WordChip, ReferenceSearchInput)
- src/hooks/** (useI18n, useTheme, useSettings, useBibleNavigation, useMemorizationSession, useReviewQueue)

**Fichiers STRICTEMENT interdits**:
- src/domains/** (appel via services, jamais direct)
- src/services/** (ne MODIFIE pas, utilise uniquement)
- src/store/** (ne MODIFIE pas, utilise uniquement les stores existants)
- src/infrastructure/**
- data/bible/*.json
- rust/**
- docs/**
- tests/** (sait comment tester, ne WRITE pas les tests)

**Entrees necessaires**: 06-design-system.md, 07-design-tokens.md, 08-ui-screens.md, 04-user-flows.md
**Sorties produites**: 11 ecrans, 15+ composants UI, 6 hooks, toutes micro-interactions
**Debut**: Jour 1 | **Fin**: Jour 60 (Sprint 4)

---

### 4. Scribe — Bible Data & FSRS Service Orchestrator

**Dossiers propriétaires**: Donnees bibliques et orchestration FSRS/Progression
- data/bible/lsg.json (le fichier COMPLET LSG 66 livres)
- src/services/fsrs-service.ts (orchestration FSRS + review queue)
- src/services/progress-service.ts (stats, streak, retention)
- src/infrastructure/rust/** (wasm-loader.ts, fsrs-wasm-bindings.ts — appel Forge WASM output)

**Fichiers STRICTEMENT interdits**:
- app/** (aucun ecran)
- src/components/**
- src/domains/** (ne MODIFIE pas engine.ts ni entities.ts, lit uniquement)
- src/store/** (ne MODIFIE pas, lit les stores pour orchestrer)
- src/i18n/locales/*.json
- rust/** (lecture seule, Forge compile le WASM)
- data/bible/kjv.json (pas au MVP)
- docs/**

**Entrees necessaires**: 11-bible-domain.md, 13-fsrs-domain.md, 10-data-model.md, 05-features.md
**Sorties produites**: LSG.json complet, FsrsService, ProgressService, WASM bridge
**Debut**: Jour 11 (Sprint 1) | **Fin**: Jour 60 (Sprint 4)

---

### 5. Translator — Internationalisation

**Dossiers propriétaires**: Exclusivement les fichiers de traduction et la structure i18n
- src/i18n/locales/fr.json
- src/i18n/locales/en.json
- src/i18n/locales/ar.json
- src/i18n/locales/de.json
- src/i18n/locales/zh.json
- src/i18n/config.ts (SUPPORTED_LANGUAGES list + defaults)
- src/i18n/directions.ts (RTL detection)
- src/i18n/i18n-service.ts (service singleton)

**Fichiers STRICTEMENT interdits**:
- app/** (ne MODIFIE pas les ecrans, juste fournit les textes)
- src/components/**
- src/domains/**
- src/services/**
- src/store/**
- src/infrastructure/**
- data/**
- rust/**
- docs/**

**Entrees necessaires**: 12-internationalization.md, 08-ui-screens.md (pour extraire TOUS les textes)
**Sorties produites**: 5 fichiers locales complets (150+ cles chacun), hook useI18n, I18nService
**Debut**: Jour 1 | **Fin**: Jour 60 (Sprint 4)

---

### 6. Guardian — Quality Auditor & Domain Events

**Dossiers propriétaires**: Event bus et gouvernance qualite
- src/domains/index.ts (eventBus singleton + DomainEventTypes enum)
- docs/08-execution/** (modifie UNIQUEMENT ce dossier)

**Fichiers STRICTEMENT interdits**:
- app/** (lecture seule pour audit)
- src/components/** (lecture seule pour audit)
- src/services/** (lecture seule pour audit)
- src/store/** (lecture seule pour audit)
- src/infrastructure/**
- data/**
- rust/**
- src/i18n/locales/*.json
- docs/ (sauf 08-execution/)

**Entrees necessaire**: 09-architecture.md, 19-domain-events.md, 16-ai-dev-guide.md, 17-workflows-systeme.md, 20-domain-use-cases.md
**Sorties produites**: EventBus fonctionnel, 16 domain events emis, audits qualite par sprint
**Debut**: Jour 1 | **Fin**: Jour 60 (Sprint 4)

---

## Matrice de Propriete Rapide

| Dossier | Proprietaire | Autres agents peuvent LIRE |
|---------|-------------|--------------------------|
| app/** | Herald | Tous (lecture seule) |
| src/components/** | Herald (UI), Forge (primitives initiales) | Tous (lecture seule) |
| src/domains/** | Anvil (logic), Guardian (events) | Forge (lecture WASM interface) |
| src/services/** | Anvil (services), Scribe (fsrs + progress) | Herald (lecture pour hooks) |
| src/store/** | Anvil | Herald (lecture pour hooks) |
| src/hooks/** | Herald | Anvil (lecture pour comprendre store usage) |
| src/infrastructure/** | Anvil (storage), Forge (rust), Scribe (wasm loader) | Tous (lecture seule) |
| src/i18n/** | Translator | Herald (lit pour placer t() calls) |
| src/tokens/** | Forge | Herald (lit pour styles) |
| data/bible/** | Scribe | Anvil (lit pour validation) |
| rust/** | Forge | Anvil (lit pour interface) |
| tests/** | Anvil | Guardian (audit coverage) |
| .github/** | Forge | Tous (lecture seule) |
| config files | Forge | Aucun (modification interdite) |

---

## Regles de Communication

1. **Finish notification**: [Agent Nom] Tache terminee: [nom tache] — [fichiers cres/modifies]
2. **Block notification**: [Agent Nom] BLOQUE sur [tache] — besoin de [agent] pour [raison]
3. **Audit finding**: [Guardian] Trouve: [anti-pattern] dans [fichier] — requis par [principe]
4. **Translation sync**: [Translator] Nouvelles cles ajoutees: [liste keys] — [agent UI] mettre a jour t() calls

---

*Ces assignments sont definitifs. Aucun agent ne doit modifier les fichiers d'un autre agent.*
