# VersyFlow — Bible Data Specification

> Canonical format for all Bible translations (MVP: LSG, future: KJV, NIV, etc.)
> This is the STRUCTURE spec — NOT the data itself. Data lives in `data/bible/*.json`.

---

## 1. Structure Canonique des Traductions

### Fichier unique par traduction
```
data/bible/{translation-id}.json
```

Chaque fichier contient TOUTES les données d'une traduction biblique complète (66 livres).

---

## 2. Schéma JSON Complet

```json
{
  "id": "lsg",                    // Unique translation identifier
  "name": "Louis Segond (1910)",  // Human-readable name
  "year": 1910,                   // Publication year
  "language": "fr",              // Source language code (ISO 639-1)
  "style": "classique",          // 'classique' | 'moderne' | 'paraphrase'
  "publicDomain": true,           // Licensing status
  "author": "Louis Segond",      // Translator name
  "books": [...]                 // Array of all 66 books
}
```

### Structure d'un Livre

```json
{
  "id": "gen",                  // Standard short code
  "name": {                     // Localized per UI language
    "fr": "Genèse",
    "en": "Genesis",
    "ar": "التكوين",
    "de": "Genesis",
    "zh": "创世记"
  },
  "testament": "old",          // 'old' | 'new'
  "chapterCount": 50            // Total chapters
}
```

### Structure d'un Chapitre

```json
{
  "number": 1,                 // Chapter number
  "verses": [                  // Array of verses
    {
      "number": 1,             // Verse number
      "text": "Au commencement..."  // Full verse text
    },
    ...
  ]
}
```

### Structure Complète d'un Verset

```json
{
  "number": 1,
  "text": "Au commencement Dieu créa les cieux et la terre."
}
```

> **Note**: Pas de metadata par verset au MVP. Les chapitres/versets sont numérotés séquentiellement (1-based).

---

## 3. Validation du Schéma

```typescript
// Using Zod for runtime validation
import { z } from 'zod';

const BibleVerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
});

const BibleChapterSchema = z.object({
  number: z.number().int().positive(),
  verses: z.array(BibleVerseSchema).nonempty(),
});

const BibleBookSchema = z.object({
  id: z.string().min(2).max(8),
  name: z.record(z.string()),
  testament: z.enum(['old', 'new']),
  chapterCount: z.number().int().positive(),
  chapters: z.array(BibleChapterSchema).nonempty(),
});

const BibleTranslationSchema = z.object({
  id: z.string().min(2).max(10),
  name: z.string().min(1),
  year: z.number().int().positive(),
  language: z.string().length(2),
  style: z.enum(['classique', 'moderne', 'paraphrase']),
  publicDomain: z.boolean(),
  author: z.string().min(1),
  books: z.array(BibleBookSchema).nonempty(),
});
```

---

## 4. Indexation Biblique

### Code Standard par Livre
| Code | Français | Anglais | Arabes |
|------|----------|---------|--------|
| gen | Genèse | Genesis | التكوين |
| exo | Exode | Exodus | الخروج |
| psa | Psaumes | Psalms | مزامير |
| joh | Jean | John | يوحنا |
| mat | Matthieu | Matthew | متى |
| rev | Apocalypse | Revelation | سفر الرؤيا |

### Résolution d'Alias
```typescript
interface BookAliasMap {
  [code: string]: string[];
}

// Exemple pour Jean:
const johnAliases: BookAliasMap['joh'] = ['jean', 'john', 'jn', 'joh'];

// Lookup est case-insensitive, accepte toutes les variations
resolveBookId('Jean') → 'joh'
resolveBookId('joh') → 'joh'
resolveBookId('Jn') → 'joh'
resolveBookId('JOHN') → 'joh'  // Case insensitive
```

---

## 5. Parsing de Références

### Formats Supportés
| Format | Exemple | Résultat |
|--------|---------|----------|
| Book Chapter:Verse | `Jean 3:16` | `{ bookId: 'joh', chapter: 3, verse: 16 }` |
| Abbreviation | `Jn 3:16` | `{ bookId: 'joh', chapter: 3, verse: 16 }` |
| Full Name | `Genèse 1:1` | `{ bookId: 'gen', chapter: 1, verse: 1 }` |
| Range | `Jean 3:16-18` | `{ bookId: 'joh', chapter: 3, verse: 16, verseEnd: 18 }` |
| Chapter only | `Psaume 23` | `{ bookId: 'psa', chapter: 23 }` |

### Regex Parser
```typescript
const rangePattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+):(\d+)\s*-\s*(\d+)$/i;
const singlePattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+):(\d+)$/i;
const chapterOnlyPattern = /^([a-zÀ-ÿ\s-]+)\s+(\d+)$/i;
```

---

## 6. Ajouter une Nouvelle Traduction

Processus **zero code change**:

1. Créer `data/bible/kjv.json` avec le schéma ci-dessus
2. Le TranslationRegistry scanne automatiquement `data/bible/*.json`
3. Nouvelle traduction apparaît dans le picker

**Contrainte**: Le fichier doit contenir exactement 66 livres, tous les chapitres, tous les versets, validés par Zod.

---

## 7. Contraintes de Performance

| Métrique | Valeur |
|----------|--------|
| Taille JSON LSG compressée | ~2-5 MB |
| Temps de parse JSON | < 50ms |
| Mémoire après parse | ~10-15 MB (in-memory index) |
| Temps recherche référence | < 5ms |

---

*Ce schéma est figé. Toute modification nécessite un audit d'impact sur tous les consumers.*
