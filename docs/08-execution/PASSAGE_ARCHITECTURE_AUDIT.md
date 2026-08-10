# Audit Architectural — Passage Memorization Architecture

**Date**: 2026-08-10
**Statut**: Complet
**Objet**: Analyser l'impact de l'extension de la mémorisation verset → passage sur l'architecture VersyFlow

---

## 1. État Actuel

### 1.1 Modèle de Mémorisation Actuel

```
MemorizationRecord
├── id: string           // bookId:chapter:verse:translationId (composite key)
├── bookId: string
├── chapterNumber: number
├── verseNumber: number  // UNIQUE verse only
├── translationId: string
├── bibleVerseReference: string  // Cached display ref
├── bibleVerseText: string     // Cached verse text (source of truth is Bible DB)
├── status: 'new' | 'in-progress' | 'mastered'
├── fsrsState: FsrsState
├── nextReviewAt: number | null
├── reviewCount: number
└── totalReviewMinutes: number
```

**Problème central**: `verseNumber` est un `number` unique. Un passage (ex: Jean 3:16-18) ne peut pas être représenté.

### 1.2 Parseur de Références (Déjà Compatible!)

```typescript
// src/domains/bible/parser.ts
export interface ParsedReference {
  bookId: string;
  chapter: number;
  verse?: number;       // Single verse
  verseEnd?: number;    // Range end (ALREADY SUPPORTED!)
}
```

**Bonne nouvelle**: Le parser supporte déjà `Jean 3:16-18` → `{ verse: 16, verseEnd: 18 }`.

### 1.3 SessionEngine (Flexible)

```typescript
constructor(verseText: string, initialStrategy?: ExerciseStrategy)
```

**Observation**: Le SessionEngine prend du texte arbitraire et le split en mots. Il fonctionne déjà pour les passages — il n'a pas besoin de changer pour supporter les passages.

### 1.4 ComparisonEngine (Flexible)

```typescript
compare(userInput: string, expectedVerse: string): VerificationResult
```

**Observation**: Compare du texte mot par mot. Fonctionne pour les passages aussi.

### 1.5 Domain Events (À enrichir)

```typescript
// Actuel
VERSE_MEMORIZED: 'memorization.verse_memorized'
RECORD_REVIEWED: 'review.completed'

// Besoin d'ajouter
TARGET_MEMORIZED: 'memorization.target_memorized'  // avec targetType
TARGET_REVIEWED: 'review.target_completed'
```

---

## 2. Dépendances au Modèle Verse-Only

| Fichier | Dépendance | Severity |
|---------|-----------|----------|
| `MemorizationRecord.id` | Composite key `bookId:chapter:verse:translationId` | 🔴 HIGH |
| `MemorizationService.memorizeVerse()` | Paramètres verset unique | 🔴 HIGH |
| `MemorizationService.getMemorizedRecord()` | Recherche par bookId+chapter+verse | 🔴 HIGH |
| `useMemorizationSession.startSession()` | Paramètres (bookId, chapter, verse) | 🟡 MEDIUM |
| `ReviewQueueService` | Filtrage par `nextReviewAt` existant | 🟢 LOW |
| `ProgressService` | Stats globales existantes | 🟢 LOW |

### Champs à ajouter à MemorizationRecord

```typescript
// Nouvelles propriétés
targetId: string;              // UUID ou hash unique du passage
targetType: 'single-verse' | 'passage';
startVerse?: number;           // Pour passage: verset début
endVerse?: number;             // Pour passage: verset fin
contentReference: ContentReference;  // Référence structurée
verseTexts?: string[];         // Textes de chaque verset (pour passage)
```

---

## 3. Fichiers à Modifier

### Domain Layer

| Fichier | Changement |
|---------|-----------|
| `src/domains/memorization/entities.ts` | Ajouter `targetId`, `targetType`, `startVerse`, `endVerse`, `contentReference` |
| `src/domains/memorization/service.ts` | `memorizeVerse()` → `memorizeTarget()` avec support passage |
| `src/domains/events.ts` | Ajouter `TARGET_MEMORIZED`, `PASSAGE_STARTED`, `SEGMENT_COMPLETED` |

### Services Layer

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useMemorizationSession.ts` | `startSession()` accepte `MemorizationTarget` |
| `src/services/review-queue-service.ts` | Filtrer par `targetId` au lieu de `verseId` |
| `src/services/progress-service.ts` | Stats par target (déjà compatible) |

### UI Layer

| Fichier | Changement |
|---------|-----------|
| `app/bible/chapter.tsx` | Ajouter sélection multiple de versets |
| `app/memorization/session.tsx` | Afficher passage complet |
| `app/memorization/confirm.tsx` | Résumé du passage |

### Non Modifiés (Stables)

- `src/domains/fsrs/` — Moteur FSRS inchangé
- `src/domains/memorization/comparison-engine.ts` — Compare texte, fonctionne pour passages
- `src/domains/memorization/session-engine.ts` — Accepte texte arbitraire
- `src/capabilities/memory/strategies/` — Stratégies mot-level, déjà compatibles
- `src/store/` — Stores non modifiés (les données sont dans le service)

---

## 4. Risques

| Risque | Severity | Mitigation |
|--------|----------|------------|
| **Breaking change sur id** | 🔴 CRITICAL | backward compat: anciens IDs → `SingleVerseTarget` |
| **FSRS par verset vs passage** | 🟡 MEDIUM | FSRS reste par record — un passage = 1 record avec sous-unités |
| **Review queue order** | 🟡 MEDIUM | Maintenir `nextReviewAt` existant |
| **Session state** | 🟢 LOW | SessionEngine gère déjà texte arbitraire |
| **Comparaison texte long** | 🟢 LOW | ComparisonEngine scale linéaire |

---

## 5. Migration

### Stratégie: Feature Flag + Dual Read

```typescript
// Pendant migration, lire les deux formats
async getMemorizedRecord(bookId, chapter, verse, translationId) {
  // Ancien format
  const legacyId = `${bookId}:${chapter}:${verse}:${translationId}`;
  const legacy = await storage.get('versyflow:record:' + legacyId);
  if (legacy) return legacy;

  // Nouveau format
  const targetId = generateTargetId(bookId, chapter, verse);
  return await storage.get('versyflow:target:' + targetId);
}
```

### Migration des données existantes

```
Ancien MemorizationRecord (verse-only)
  ↓
Nouveau MemorizationRecord
  targetId = legacy id (hash book:ch:v:trans)
  targetType = 'single-verse'
  startVerse = verseNumber
  endVerse = verseNumber
  contentReference = { bookId, chapter, startVerse, endVerse }
```

La migration est **idempotente** et **backward-compatible**.

---

## 6. Éléments Déjà Compatibles

| Élément | Statut | Note |
|---------|--------|------|
| `parseReference()` | ✅ | Supporte déjà `Jean 3:16-18` |
| `SessionEngine` | ✅ | Prend texte arbitraire |
| `ComparisonEngine` | ✅ | Compare texte mot par mot |
| `FSRS Engine` | ✅ | State par record, pas par verset |
| `EventBus` | ✅ | Payload extensible |
| `IStorage` | ✅ | Key-value, pas de schéma |
| `Memory Strategies` | ✅ | Work at word level |
| `BibleRepository` | ✅ | `getChapterVerses()` existe |

---

## 7. Éléments à Modifier

### Priorité P0 (Blocker)

1. **MemorizationRecord** — Ajouter `targetType`, `startVerse`, `endVerse`
2. **MemorizationService** — `memorizeVerse()` → `memorizeTarget()`
3. **Migration** — Script de migration des données existantes

### Priorité P1 (Important)

4. **useMemorizationSession** — Accepter `MemorizationTarget`
5. **Domain Events** — Ajouter `TARGET_MEMORIZED`

### Priorité P2 (Nice to Have)

6. **Bible Chapter UI** — Sélection multi-versets
7. **Review Queue** — Prioriser les passages fragiles
8. **Progress Service** — Stats par passage

---

## 8. Éléments à NE PAS Modifier

- FSRS Engine (`src/domains/fsrs/`)
- ComparisonEngine (`src/domains/memorization/comparison-engine.ts`)
- SessionEngine (`src/domains/memorization/session-engine.ts`)
- Memory Strategies (`src/capabilities/memory/strategies/`)
- Bible Repository (`src/domains/bible/repository.ts`)
- Theme System
- Navigation
- Auth
- Profile/Family (déjà implémenté)

---

## 9. Nouvelles Entités à Créer

```typescript
// src/domains/memorization/entities.ts (étendu)

export type MemorizationTargetType = 'single-verse' | 'passage';

export interface ContentReference {
  bookId: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;  // undefined pour single-verse
  translationId: string;
}

export interface MemorizationTarget {
  id: string;              // targetId (hash or UUID)
  type: MemorizationTargetType;
  reference: ContentReference;
  displayReference: string;  // "Jean 3:16" or "Jean 3:16-18"
  createdAt: number;
}

// MemorizationRecord étendu
export interface MemorizationRecord {
  // ...existing fields...
  targetId: string;
  targetType: MemorizationTargetType;
  startVerse?: number;
  endVerse?: number;
  contentReference: ContentReference;
  verseTexts?: string[];  // For passages: text of each verse
}
```

---

## 10. Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| Fichiers à modifier | ~8 |
| Nouveaux fichiers | ~3 |
| Tests existants à adapter | 0 (aucun changement de signature critique) |
| Nouveaux tests | ~20 |
| Risque majeur | Breaking change sur MemorizationRecord.id |
| Temps estimé | 1 sprint (5 jours) |

**Conclusion**: L'architecture actuelle est **largement compatible** avec l'extension passage. Les moteurs (Session, Comparison, FSRS) sont déjà flexibles. Le travail principal est:
1. Étendre `MemorizationRecord` avec les champs passage
2. Migrer les données existantes
3. Adapter le service et le hook
