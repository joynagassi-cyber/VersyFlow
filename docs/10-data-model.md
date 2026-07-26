# VersyFlow — Modèle de Données

## Document généré par Agent E — Architecture

---

## 1. Entités Principales

### Entity: UserSettings
```typescript
interface UserSettings {
  id: 'primary'; // Singleton - une seule instance
  uiLanguage: string; // ISO 639-1: 'fr', 'en', 'ar', 'de', 'zh'
  bibleTranslation: string; // Translation ID: 'lsg', 'kjv', 'niv'...
  theme: 'light' | 'dark' | 'auto';
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
  onboardingCompleted: boolean;
  versionLastSeen: number; // App version last used
}
```
**Stockage**: `versyflow:settings` (MMKV singleton)

### Entity: BibleBook
```typescript
interface BibleBook {
  id: string; // Short code: 'gen', 'exo', 'psa', 'joh'...
  name: Record<string, string>; // Localized per UI language
  testament: 'old' | 'new';
  chapterCount: number;
  orderIndex: number; // 1-66 global ordering
}
```
**Stockage**: `versyflow:bible:{translationId}` (static JSON loaded to memory)

### Entity: BibleVerse
```typescript
interface BibleVerse {
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  text: string; // Full verse in selected translation
  reference: string; // Display ref: 'Jean 3:16'
  translationId: string; // Links to active translation
}
```

### Entity: MemorizationRecord
```typescript
interface MemorizationRecord {
  id: string; // Hash of bookId:chapter:verse:translationId for uniqueness
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  translationId: string;
  bibleVerseReference: string; // Cached display reference
  bibleVerseText: string; // Cached verse text
  status: 'new' | 'in-progress' | 'mastered';
  fsrsState: FsrsState; // Embedded FSRS state
  favorite: boolean;
  tags: string[]; // Future: thematic tags
  createdAt: number; // Unix timestamp
  lastReviewedAt: number | null;
  nextReviewAt: number | null;
  reviewCount: number;
  totalReviewMinutes: number;
}
```
**Stockage**: `versyflow:user:memorized:{recordId}` (MMKV)

### Entity: FsrsState (embedded in MemorizationRecord)
```typescript
interface FsrsState {
  stability: number; // Days until P(recall) = 0.9
  difficulty: number; // 0-10 scale
  recallProbability: number; // Current S at last review time
  lastInterval: number; // Days since last review (0 = new)
  nextInterval: number; // Predicted days until next review
  elapsedDays: number; // Days since creation
  repetitions: number; // Total review count
  requestedRetention: number; // Target retention (default 0.9)
}
```

### Entity: ReviewLog
```typescript
interface ReviewLog {
  id: string; // UUID v4
  memorizationRecordId: string; // FK → MemorizationRecord.id
  answeredAt: number; // Unix timestamp
  rating: 'again' | 'hard' | 'good' | 'easy';
  actualInterval: number | null; // If already reviewed before
  predictedInterval: number; // What FSRS predicted
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
}
```
**Stockage**: `versyflow:user:review:{logId}` (MMKV, append-only, max 1000 entries per record)

---

## 2. Relations entre Entités

```
UserSettings (singleton)
    │
    ├─ HAS_ONE → MemorizationRecord[] (user's memorized verses)
    │
BibleBook ───HAS_MANY──→ ChapterInfo[]
    │
    └── BibleVerse[] (via bookId + translationId)
    
MemorizationRecord
    │
    ├─ BELONGS_TO → BibleVerse (reference via bookId:chapter:verse:translationId)
    ├─ CONTAINS → FsrsState (embedded, not separate document)
    └─ HAS_MANY → ReviewLog[] (revision history)
    
ReviewLog
    │
    └─ BELONGS_TO → MemorizationRecord
```

---

## 3. Schéma de Stockage MMKV

### Layout des clés
```
versyflow:settings                                → JSON UserSettings
versyflow:bible:lsg                               → JSON BibleBook[] (full translation data)
versyflow:bible:kjv                               → JSON BibleBook[] (future translations)
versyflow:user:memorized:{recordHash}             → JSON MemorizationRecord
versyflow:user:review:{uuid}                      → JSON ReviewLog
versyflow:cache:nextReviewAt                      → Unix timestamp (quick access)
versyflow:app:version                             → string (current app version, e.g., "0.1.0")
versyflow:app:onboarding_completed                → boolean
versyflow:app:wasm_available                      → boolean (FSRS WASM health flag)
```

### Keys pattern rules
- Préfixe `versyflow:` pour isolation namespace
- Collections: `versyflow:bible:{id}` ou `versyflow:user:{entity}:{id}`
- Cache: `versyflow:cache:{key}` pour données temporaires
- App metadata: `versyflow:app:{key}`

---

## 4. Base de données Biblique (Format Fichier)

### Structure JSON d'une traduction
```json
{
  "id": "lsg",
  "name": "Louis Segond (1910)",
  "year": 1910,
  "language": "fr",
  "style": "classique",
  "publicDomain": true,
  "books": [
    {
      "id": "gen",
      "name": { "fr": "Genèse", "en": "Genesis" },
      "testament": "old",
      "chapterCount": 50,
      "chapters": [
        {
          "number": 1,
          "verses": [
            {
              "number": 1,
              "text": "Au commencement Dieu créa les cieux et la terre."
            },
            {
              "number": 2,
              "text": "Et la terre était sans forme et vide..."
            }
          ]
        }
      ]
    }
  ]
}
```

### Vérification de schéma
```typescript
// Zod validation at load time
import { z } from 'zod';

const BibleTranslationSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  language: z.string(),
  books: z.array(z.object({
    id: z.string(),
    name: z.record(z.string()),
    testament: z.enum(['old', 'new']),
    chapterCount: z.number(),
    chapters: z.array(z.object({
      number: z.number(),
      verses: z.array(z.object({
        number: z.number(),
        text: z.string(),
      })),
    })),
  })),
});
```

---

## 5. Index et Recherche

### Index de recherche biblique
Pour permettre la recherche par référence rapide ("Jean 3:16"):

```typescript
// In-memory index built from BibleBook[]
interface BibleSearchIndex {
  // bookName → bookId mapping (with abbreviations)
  booksByAlias: Record<string, string>;
  // "joh 3:16" → BibleVerse
  byReference: Map<string, BibleVerse>;
  // Free text word → set of verse references
  byWord: Map<string, Set<string>>;
}
```

### Mémorisation records indexes
```typescript
// Quick access indexes in Zustand store
interface MemorizationIndexes {
  // status → recordId[]
  byStatus: Record<'new' | 'in-progress' | 'mastered', string[]>;
  // nextReviewAt <= now → recordId[] (for review queue)
  dueForReview: string[];
  // favorite → boolean
  favorites: string[];
}
```

---

## 6. Taille Estimée des Données

| Données | Taille estimée | Notes |
|---------|---------------|-------|
| LSG Bible JSON | ~2-5 MB (compressed) | ~31,102 versets |
| Settings utilisateur | <1 KB | Singleton |
| Un MemorizationRecord | ~500 bytes | Avec FSRS state |
| Un ReviewLog | ~400 bytes | Append-only |
| 100 versets mémorisés | ~50 KB | State + 5 reviews each |
| 500 versets mémorisés | ~250 KB | State + 10 reviews each |

→ Le stockage utilisateur reste minimal même avec des centaines de versets mémorisés.

---

*Document approuvé. Transmis à l'Agent F pour Bible Domain détaillé.*
