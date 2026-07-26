# VersyFlow — Decision Log

> Document généré par le CEO Multi-Agent
> Chaque décision architecturale ou produit majeure est enregistrée ici.
> Pour modifier une décision existante: marquer comme OBSOLETE avec date et raison.

---

## Décisions Enregistrées

### DEC-001: Stack Technique
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de specs V1)
**Contexte**: Choix technologique pour le MVP
**Décision**: React Native + Expo + TypeScript + Rust (FSRS) + MMKV + Zustand + Reanimated
**Justification**:
- Expo: OTA updates, ecosystem mature, community support
- TypeScript: strict mode for type safety
- Rust WASM: FSRS needs precision SM-2 can't provide
- MMKV: fastest JS storage for React Native
- Zustand: lightweight state management
- Reanimated: smooth animations at 60fps
**Alternatives rejetees**:
- Flutter → rejeté: team knowns React Native, Expo ecosystem superior
- Redux → rejeté: Zustand is lighter and sufficient for MVP scope
- SQLite → rejected: MMKV sufficient for MVP data volume (~250KB for 500 verses)
**Statut**: ACTIVE

### DEC-002: Default Bible Translation = LSG (Louis Segond 1910)
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de Vision + PRD)
**Contexte**: Quelle traduction biblique au MVP?
**Décision**: LSG uniquement au MVP
**Justification**: Most widely used French translation, public domain, poetic yet accessible
**Alternatives rejetees**:
- KJV → English only, not French MVP audience
- NIV → Copyright restrictions
- Darby → Too theological for general audience
**Statut**: ACTIVE

### DEC-003: Architecture Clean avec 4 couches
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de 09-architecture.md)
**Contexte**: Structure du codebase
**Décision**: UI → Services → Domains → Infrastructure (dépendances unidirectionnelles)
**Justification**: Separation of concerns, testability, extensibility without refactor
**Alternatives rejetees**:
- MVC → tight coupling between view and model
- MVVM → extra layer unnecessary for MVP complexity
- Feature-based folder structure → harder to enforce dependency rules
**Statut**: ACTIVE

### DEC-004: FSRS via WASM avec fallback SM-2 JS
**Date**: Sprint 2 Jour 1
**Décidé par**: CEO (sur base de 13-fsrs-domain.md)
**Contexte**: Comment intégrer l'algorithme FSRS Rust dans React Native
**Décision**: Compiler en WASM + loader asynchrone + fallback SM-2 JS si échec
**Justification**:
- WASM: FSRS math requires precision and performance only Rust provides
- Fallback SM-2: ensures app works even if WASM fails (offline-first principle)
- Async loading: doesn't block UI startup
**Alternatives rejetees**:
- Pure JavaScript FSRS → too slow, less accurate, no access to optimized fsrs-rs crate
- React Native native module → adds complexity to build process, harder to maintain
- Web worker → not available in React Native
**Statut**: ACTIVE

### DEC-005: 5 Langues UI au MVP (FR, EN, AR, DE, ZH)
**Date**: Sprint 1 Jour 1
**Décidé par**: CEO (sur base de 12-internationalization.md)
**Contexte**: Combien de langues pour le MVP?
**Décision**: 5 langues: FR, EN, AR, DE, ZH
**Justification**: Covers major Christian populations (Francophone, Anglophone, Arabophone, Germanophone, Sino-phone). Arabic provides RTL testing.
**Alternatives rejetees**:
- 3 langues (FR, EN, AR) → insufficient international coverage
- 10+ langues → too much translation work delays MVP
**Statut**: ACTIVE

### DEC-006: Stockage local UNIQUE (MMKV), pas de cloud sync au MVP
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de 09-architecture.md section Offline-First)
**Contexte**: Sync vs offline-only
**Décision**: 100% local storage, no network dependency
**Justification**: Offline-first is a core principle. Cloud sync adds complexity, backend cost, privacy concerns. Can be added post-MVP.
**Statut**: ACTIVE

### DEC-007: 6 Agents avec ownership exclusif de dossiers
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO
**Contexte**: Organisation du développement multi-agent
**Décision**: 6 agents (Forge, Anvil, Herald, Scribe, Translator, Guardian) avec chaque fichier attribué à UN seul agent
**Justification**: Eliminate git conflicts entirely. Each agent has a clear scope. Reading is free, writing is exclusive.
**Alternatives rejetees**:
- 3 agents généralistes → plus de conflits Git, moins de parallelisation
- 10+ agents spécialisés → overhead de coordination trop élevé
**Statut**: ACTIVE

---

## Format pour Nouvelles Décisions

Lorsqu'une nouvelle décision doit être prise durant le développement:

```
DEC-XXX: [Titre court]
Date: [jour sprint]
Décidé par: [Agent/Ceo/Humain]
Contexte: [Pourquoi cette décision est nécessaire]
Décision: [Quoi]
Justification: [Pourquoi ce choix]
Alternatives rejetées: [Ce qui aurait pu être fait sinon]
Statut: ACTIVE | OBSOLETE (remplacée par DEC-XXX le JJ/MM/AAAA)
```

---

*Ce document est maintenu par Guardian. Toute décision modifiant l'architecture, le scope MVP, ou les principes product nécessite une entrée ici.*
