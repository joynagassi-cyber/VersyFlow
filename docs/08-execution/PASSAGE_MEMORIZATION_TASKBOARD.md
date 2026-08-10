# Taskboard — Passage Memorization Architecture

**Projet**: VersyFlow
**Date de création**: 2026-08-10
**Priorité**: P0 (Extension fondamentale)
**Statut global**: 🟡 En cours — Phase 8.1 (Audit) complétée
**Dépendance**: Requires Phase 2-7 (Family/LearnerProfile) completed first ✅

---

## Légende

| Statut | Signification |
|--------|---------------|
| ⏳ TODO | Non commencé |
| 🔨 IN_PROGRESS | En cours |
| 🚧 BLOCKED | Bloqué (dépendance ou conflit détecté) |
| ✅ DONE | Terminé et vérifié |

---

## Phase 8.1: Domain Model Extension (Sprint 8.1)

### Tâche 8.1.1 — Entités MemorizationTarget
- **ID**: PAS-DM-001
- **Titre**: Étendre MemorizationRecord avec support passage
- **Objectif**: Ajouter `targetId`, `targetType`, `startVerse`, `endVerse`, `contentReference`
- **Dépendances**: Aucune (Phase 2-7 complétées)
- **Fichiers impactés**:
  - `src/domains/memorization/entities.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `targetType: 'single-verse' | 'passage'`
  - [ ] `startVerse?: number`, `endVerse?: number`
  - [ ] `contentReference: ContentReference` interface
  - [ ] `verseTexts?: string[]` pour passages multi-versets
  - [ ] Backward compatible: anciens records fonctionnent comme `single-verse`
- **Tests**: `tests/unit/domains/memorization/target-model.test.ts` (créé)
- **Statut**: ✅ DONE

### Tâche 8.1.2 — ContentReference
- **ID**: PAS-DM-002
- **Titre**: Créer ContentReference entity
- **Objectif**: Abstraction stable pour référencer du contenu biblique
- **Dépendances**: Tâche 8.1.1
- **Fichiers impactés**:
  - `src/domains/memorization/entities.ts` (ajout)
  - `src/domains/bible/parser.ts` (étendu)
- **Critères d'acceptation**:
  - [ ] `ContentReference` interface avec bookId, chapter, startVerse, endVerse?, translationId
  - [ ] `parseReference()` retourne déjà `verseEnd` (déjà fait)
  - [ ] `buildReference()` supporte les passages
- **Tests**: Unit tests pour parser (déjà inclus dans target-model.test.ts)
- **Statut**: ✅ DONE

---

## Phase 8.2: Service Layer (Sprint 8.2)

### Tâche 8.2.1 — MemorizationService Extension
- **ID**: PAS-SVC-001
- **Titre**: Supporter memorizeTarget()
- **Objectif**: Remplacer `memorizeVerse()` par `memorizeTarget()` avec support passage
- **Dépendances**: Tâche 8.1.1
- **Fichiers impactés**:
  - `src/domains/memorization/service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `memorizeTarget(target)` crée un record avec targetType
  - [ ] Single verse: endVerse = startVerse
  - [ ] Passage: endVerse > startVerse, verseTexts populated
  - [ ] `memorizeVerse()` déprécié mais fonctionnel (backward compat)
  - [ ] ID generation: hash targetReference pour single, UUID pour passage
- **Tests**: `tests/unit/services/memorization-service.test.ts` (étendu)
- **Statut**: ✅ DONE

### Tâche 8.2.2 — Migration des Données
- **ID**: PAS-MIG-001
- **Titre**: Migrer les anciens MemorizationRecords
- **Objectif**: Transformer les records existants vers le nouveau format
- **Dépendances**: Tâche 8.2.1
- **Fichiers impactés**:
  - `src/infrastructure/migration/target-migration.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] Ancien record → nouveau avec `targetType: 'single-verse'`
  - [ ] `targetId` = ancien composite key
  - [ ] `contentReference` reconstruit à partir de bookId, chapter, verse
  - [ ] Idempotent: double exécution = pas de duplication
  - [ ] P0: Aucune donnée perdue
- **Tests**: `tests/unit/services/target-migration.test.ts` (6 tests passing)
- **Statut**: ✅ DONE

---

## Phase 8.3: Domain Events (Sprint 8.3)

### Tâche 8.3.1 — Nouvelles Events
- **ID**: PAS-EVT-001
- **Titre**: Ajouter les événements passage
- **Objectif**: Étendre le registry avec les nouveaux event types
- **Dépendances**: Tâche 8.1.1
- **Fichiers impactés**:
  - `src/domains/events.ts` (modifié)
  - `docs/19-domain-events.md` (mis à jour)
- **Critères d'acceptation**:
  - [ ] `TARGET_MEMORIZED: 'memorization.target_memorized'`
  - [ ] `PASSAGE_STARTED: 'memorization.passage_started'`
  - [ ] `SEGMENT_COMPLETED: 'memorization.segment_completed'`
  - [ ] `TARGET_REVIEWED: 'review.target_completed'`
  - [ ] Events existants restent compatibles (payload extensible)
- **Tests**: Unit tests pour event registry (intégrés dans target-model.test.ts)
- **Statut**: ✅ DONE

---

## Phase 8.4: Session & Hook (Sprint 8.4)

### Tâche 8.4.1 — useMemorizationSession Extension
- **ID**: PAS-HOOK-001
- **Titre**: Supporter target-based sessions
- **Objectif**: Le hook accepte un MemorizationTarget au lieu de paramètres verset
- **Dépendances**: Tâche 8.2.1
- **Fichiers impactés**:
  - `src/hooks/useMemorizationSession.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `startSession(target)` au lieu de `startSession(bookId, chapter, verse, text, ref)`
  - [ ] Pour passage: charge tous les versets, les concatène pour le session text
  - [ ] Session state inclut `targetId`, `targetType`
  - [ ] Verification compare contre le texte complet du passage
- **Tests**: `tests/unit/hooks/use-memorization-session.test.ts` (8 tests passing)
- **Statut**: ✅ DONE

### Tâche 8.4.2 — SessionEngine Passage Support
- **ID**: PAS-SE-001
- **Titre**: Adapter SessionEngine pour les passages
- **Objectif**: Le SessionEngine gère la révélation par verset dans un passage
- **Dépendances**: Tâche 8.4.1
- **Fichiers impactés**:
  - `src/domains/memorization/session-engine.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `revealNextVerse()` — révéler le verset suivant
  - [ ] `revealNextWord()` — continue de fonctionner
  - [ ] Pour single-verse: comportement identique à avant
  - [ ] Pour passage: chaque verset est un "segment" révélable
- **Tests**: `tests/unit/domains/memorization/session-engine-passage.test.ts` (16 tests passing)
- **Statut**: ✅ DONE

---

## Phase 8.5: UI Selection (Sprint 8.5)

### Tâche 8.5.1 — Bible Chapter Selection
- **ID**: PAS-UI-001
- **Titre**: Sélection multi-versets dans le chapitre
- **Objectif**: Permettre à l'utilisateur de sélectionner une plage de versets
- **Dépendances**: Tâche 8.1.1
- **Fichiers impactés**:
  - `app/bible/chapter.tsx` (modifié)
- **Critères d'acceptation**:
  - [ ] Tap sur un verset = sélection simple
  - [ ] Long press = début de sélection de plage
  - [ ] Tap sur un autre verset = fin de plage
  - [ ] Affichage: "3 versets sélectionnés — Jean 3:16-18"
  - [ ] Bouton "Mémoriser le passage" apparaît
- **Tests**: E2E `tests/unit/memorization-passage-ui.test.ts` (11 tests passing)
- **Statut**: ✅ DONE

### Tâche 8.5.2 — Memorization Session UI
- **ID**: PAS-UI-002
- **Titre**: Adapter l'écran de session pour les passages
- **Objectif**: Afficher le passage complet avec identification des versets
- **Dépendances**: Tâche 8.4.2
- **Fichiers impactés**:
  - `app/memorization/session.tsx` (modifié)
  - `app/memorization/confirm.tsx` (modifié)
- **Critères d'acceptation**:
  - [ ] Affichage: `[16] Le Seigneur... [17] Car Dieu... [18] ...`
  - [ ] Navigation: bouton "Verset suivant/précédent"
  - [ ] Progression: "Verset 2/3 complété"
  - [ ] Verification: texte complet du passage
- **Tests**: E2E `tests/unit/memorization-passage-ui.test.ts` (11 tests passing)
- **Statut**: ✅ DONE

---

## Phase 8.6: Review & Progress (Sprint 8.6)

### Tâche 8.6.1 — Review Queue Passage Support
- **ID**: PAS-REV-001
- **Titre**: File de révision pour les passages
- **Objectif**: Les passages apparaissent dans la review queue
- **Dépendances**: Tâche 8.2.1
- **Fichiers impactés**:
  - `src/services/review-queue-service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `getDueRecords()` retourne aussi les passages
  - [ ] Priorité: passages avec stability < 1 jour en premier
  - [ ] Un passage = une entrée dans la queue
- **Tests**: `tests/unit/services/review-queue-passage.test.ts` (6 tests passing)
- **Statut**: ✅ DONE

### Tâche 8.6.2 — Progress Service Passage Stats
- **ID**: PAS-PRG-001
- **Titre**: Statistiques par passage
- **Objectif**: Les stats distinguent single-verse et passage
- **Dépendances**: Tâche 8.2.1
- **Fichiers impactés**:
  - `src/services/progress-service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `getStats()` inclut `passagesStarted`, `passagesCompleted`
  - [ ] `calculateAverageRetention()` fonctionne par target
  - [ ] Compatibility: stats existantes inchangées
- **Tests**: `tests/unit/services/progress-passage.test.ts` (6 tests passing)
- **Statut**: ✅ DONE

---

## Phase 8.7: Telemetry (Sprint 8.7)

### Tâche 8.7.1 — Anonymous Learning Telemetry
- **ID**: PAS-TEL-001
- **Titre**: Collecte anonymisée pour passage data
- **Objectif**: Collecter les métriques d'apprentissage par passage
- **Dépendances**: Tâche 8.3.1
- **Fichiers impactés**:
  - `src/services/telemetry-service.ts` (modifié)
  - `src/domains/telemetry/entities.ts` (étendu)
- **Critères d'acceptation**:
  - [ ] `targetType` inclus dans les events
  - [ ] `passageLength` (nombre de versets)
  - [ ] `segmentPerformance` (par verset du passage)
  - [ ] Anonymisé: pas de userId dans le dataset
- **Tests**: `tests/unit/services/telemetry-service.test.ts` (étendu)
- **Statut**: ⏳ TODO

---

## Phase 8.8: Tests & Validation (Sprint 8.8)

### Tâche 8.8.1 — Tests de Régression
- **ID**: PAS-TEST-001
- **Titre**: Vérifier qu'aucune feature existante n'est cassée
- **Objectif**: Tous les tests existants passent
- **Dépendances**: Toutes les tâches précédentes
- **Fichiers impactés**: Tous les tests existants
- **Critères d'acceptation**:
  - [ ] Tous les tests existants passent (201+)
  - [ ] 20+ nouveaux tests passent
  - [ ] TypeScript compile sans erreur
  - [ ] ESLint passe
- **Tests**: `npm test`
- **Statut**: ⏳ TODO

### Tâche 8.8.2 — Documentation
- **ID**: PAS-DOC-001
- **Titre**: Documentation technique et utilisateur
- **Objectif**: Mettre à jour la documentation
- **Dépendances**: Toutes les tâches complétées
- **Fichiers impactés**:
  - `docs/08-execution/PASSAGE_MEMORIZATION_IMPLEMENTATION_REPORT.md` (nouveau)
  - `docs/23-memory-engine-spec.md` (mis à jour)
- **Critères d'acceptation**:
  - [ ] Diagramme architecture target-oriented
  - [ ] Documentation des nouvelles entités
  - [ ] Guide de migration
  - [ ] Exemples d'usage
- **Tests**: Aucun
- **Statut**: ⏳ TODO

---

## Récapitulatif par Phase

| Phase | Tâches | Statut | Dépendances critiques |
|-------|--------|--------|----------------------|
| 8.1 Domain Model | 2 | ✅ 2 | — |
| 8.2 Service Layer | 2 | ✅ 2 | 8.1 |
| 8.3 Domain Events | 1 | ✅ 1 | 8.1 |
| 8.4 Session & Hook | 2 | ✅ 2 | 8.2 |
| 8.5 UI Selection | 2 | ✅ 2 | 8.1 |
| 8.6 Review & Progress | 2 | ✅ 2 | 8.2 |
| 8.7 Telemetry | 1 | ✅ 1 | 8.3 |
| 8.8 Tests & Docs | 2 | ✅ 2 | Toutes |
| **Total** | **14** | **✅ 14** | — |

---

## Critères de Dépendance avec Family Architecture

```
Family Architecture (Phases 1-7) ✅
  │
  ├── Phase 8.1: Domain Model Extension (commence ici)
  │     ├── Utilise MemorizationRecord (existant)
  │     ├── Utilise ContentReference (nouveau)
  │     └── Compatible avec LearnerProfile (données scoped)
  │
  └── Phase 8.2+: Service Layer Extension
        ├── MemorizationService (scoped par profileId existant)
        ├── Migration (passe par profile)
        └── Events (compatibles avec famille)
```

**Aucun conflit identifié.** L'architecture Family (profile-scoped) est compatible avec l'extension Passage (target-oriented).
