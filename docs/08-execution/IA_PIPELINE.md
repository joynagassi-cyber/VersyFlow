# VersyFlow — IA Pipeline (End-to-End Development Pipeline)

> Document généré par le CEO Multi-Agent
> Ce document décrit le pipeline industriel complet: de la documentation à la release, en passant par chaque étape de développement multi-agent.

---

## Vue d'ensemble du Pipeline

```
Documentation (specs figees docs/01-20)
    ↓
Architecture (scaffold + config)
    ↓
Fondations (tokens, storage, types, interfaces)
    ↓
Domaine (bible, fsrs, memorization)
    ↓
UI (ecrans, composants, navigation)
    ↓
Intégration (services orchestrent domaines)
    ↓
Tests (unit, integration, e2e)
    ↓
QA (audit, polish, performance)
    ↓
Release (builds, stores, beta testing)
```

Pour chaque étape: entrées, sorties, agents impliques, critères de validation.

---

## Étape 1: Documentation (Entrée du pipeline)

**Entrées**: Documentation specs existante (docs/01-* à docs/20-*)
**Sorties**: Aucune (documentation est l'INPUT du pipeline, pas une sortie)
**Agents**: TOUS (lisent les specs avant toute action)
**Critères de validation**:
- [ ] Tous les 20 docs lus par chaque agent avant de commencer
- [ ] Aucun doute sur le scope MVP
- [ ] Aucune question non résolue bloquant le démarrage

---

## Étape 2: Architecture (Sprint 0 — Forge + Anvil)

**Entrées**: docs/14-folder-structure.md, docs/09-architecture.md
**Sorties**:
- Projet Expo initialisé (package.json, tsconfig.json, etc.)
- Structure dossiers complète
- Configuration linting/formatting
- CI pipeline configuré

**Agents**: Forge (principal), Anvil (types + interfaces)
**Critères de validation**:
- [ ] `npx expo start` fonctionne
- [ ] `npm run typecheck` passe
- [ ] `npm run lint` passe
- [ ] Build iOS/Android funcionanl
- [ ] Rust Cargo.toml compile

---

## Étape 3: Fondations (Sprint 0-1 — Forge + Anvil)

**Entrées**: Architecture implémentée
**Sorties**:
- Design tokens exportés (colors, typography, spacing, animations)
- 3 composants primitives (ButtonPrimary, ButtonSecondary, Text)
- MMKV storage adapter
- IFsrsEngine interface
- Rust WASM compilé ou FallbackEngine JS

**Agents**: Forge (tokens, primitives, WASM), Anvil (storage, interfaces, types)
**Critères de validation**:
- [ ] Tokens utilisés dans au moins 3 composants
- [ ] MMKV read/write fonctionne
- [ ] IFsrsEngine interface compile sans erreurs

---

## Étape 4: Domaine (Sprint 1-2 — Anvil + Scribe)

**Entrées**: Fondations prêtes (types, interfaces, storage)
**Sorties**:
- BibleDomain: parser, translator, registry (lectures uniquement)
- FsrsDomain: engine abstraction, fallback engine
- MemorizationDomain: session logic, validator
- LSG.json complet (66 livres, 31102 versets)
- FsrsService + ProgressService

**Agents**: Anvil (domaines + services), Scribe (LSG.json, FsrsService)
**Critères de validation**:
- [ ] Reference parser résout "Jean 3:16", "Jn 3:16", "GENESE 1:1"
- [ ] Translation registry load LSG.json avec Zod validation
- [ ] FsrsService correctly calls IFsrsEngine
- [ ] MemorizationRecord persisté en MMKV

---

## Étape 5: UI (Sprint 1-4 — Herald)

**Entrées**: Domaines implémentés + Design System specs
**Sorties**:
- 11 écrans implémentés
- 15+ composants UI
- 6 hooks custom
- Toutes micro-interactions
- Navigation Expo Router complète

**Agents**: Herald (principal), Translator (fournit les textes via i18n)
**Critères de validation**:
- [ ] Tous les écrans de 08-ui-screens.md implémentés
- [ ] Navigation entre écrans fonctionne
- [ ] Textes traduits via t() (zéro hardcoded)
- [ ] Animations micro-interactions conformes à 06-design-system.md

---

## Étape 6: Intégration (Sprint 2-3 — Anvil + Scribe + Herald)

**Entrées**: Domaines + UI indépendants
**Sorties**:
- Ecrans connectés aux services via hooks
- FSRS intégré dans mémorisation et révision
- Domain events émis correctement
- Stores Zustand alimentés par services

**Agents**: Herald (connecte UI aux hooks), Anvil (services + stores), Scribe (FsrsService wiring)
**Critères de validation**:
- [ ] Flow onboarding → home → bible nav fonctionne complet
- [ ] Flow memorization → FSRS calcul → persistence fonctionne
- [ ] Flow review → rating → FSRS update → log fonctionne
- [ ] Domain events émis aux bons moments (Guardian vérifie)

---

## Étape 7: Tests (Sprint 4 — Anvil + Guardian)

**Entrées**: Fonctionnalités complètes (Sprint 3 terminé)
**Sorties**:
- Unit tests >90% coverage domains
- Integration tests >70% coverage services
- E2E Detox tests (10 scenarios)
- Coverage report

**Agents**: Anvil (écrit les tests), Guardian (audit la couverture)
**Critères de validation**:
- [ ] Tous les tests passent
- [ ] Coverage atteint les seuils minimums
- [ ] MockFsrsEngine aligné sur SM-2 behavior

---

## Étape 8: QA (Sprint 4 — Guardian + Herald)

**Entrées**: Tests passing
**Sorties**:
- Rapport d'audit architecture
- Rapport de performance (<200ms tous écrans)
- Checklist QA passée

**Agents**: Guardian (audit), Herald (polish basé sur audit)
**Critères de validation**:
- [ ] Zero anti-pattern détecté
- [ ] Tous les écrans <200ms
- [ ] RTL arabe testé et fonctionnel
- [ ] 100% textes ont clés i18n

---

## Étape 9: Release (Sprint 5 — Forge + Herald)

**Entrées**: QA passed
**Sorties**:
- APK production build (<50MB)
- IPA production build
- Beta distribué TestFlight + Play Console
- Screenshots + descriptions stores
- Privacy policy

**Agents**: Forge (builds), Herald (screenshots)
**Critères de validation**:
- [ ] APK < 50MB
- [ ] IPA passe TestFlight
- [ ] Zero crash internal testing
- [ ] Tous E2E tests passent sur production builds

---

## Dépendances entre Étapes du Pipeline

```
Docs ──→ ──→ Archi ──→ Fondations ──→ Domaine ──→ UI ──→ Intégration ──→ Tests ──→ QA ──→ Release
```

Aucune étape ne peut commencer tant que l'étape précédente N'A PAS passé ses critères de validation.

Exception: UI (Herald) peut commencer dès que les fondations tokens/primitives sont prêtes, même si les domaines ne sont pas complets. Herald utilise des données mockées pendant cette période.

---

*Ce pipeline définit l'ordre industriel de développement. Aucun saut d'étape n'est autorisé.*
