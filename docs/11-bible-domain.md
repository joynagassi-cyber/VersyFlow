# VersyFlow — Domaine Biblique

## Document généré par Agent F — Domaine Biblique

---

## 1. Définition du Domaine

Le domaine Bible gère toute la logique liée aux Écritures: livres, chapitres, versets, traductions, références, et leur agnosticisme par rapport aux langues. C'est un **domaine en lecture seule** — les données bibliques sont descriptives, jamais modifiées par l'application.

### Responsabilités
- Charger et parser les fichiers de traduction biblique
- Résoudre les références ("Jean 3:16" → bookId + chapter + verse)
- Fournir les textes de versets par traduction
- Gérer le registry des traductions disponibles
- Maintenir l'agnosticisme linguistique

---

## 2. Agnosticisme Linguistique

### Principe fondamental
La langue de l'interface ET la traduction biblique sont deux dimensions **orthogonales** et indépendantes.

### Matrice de combinaisons possibles

| Langue UI | Traduction | Résultat |
|-----------|-----------|----------|
| Français (FR) | LSG | Interface en français, versets en français LSG |
| Français (FR) | KJV | Interface en français, versets en anglais KJV |
| Anglais (EN) | LSG | Interface en anglais, versets en français LSG |
| Arabe (AR) | LSG | Interface en arabe (RTL), versets en français LSG |
| Chinois (ZH) | NIV | Interface en chinois, versets en anglais NIV |

### Conséquences architecturales
- `userSettings.uiLanguage` ≠ `userSettings.bibleTranslation`
- Chaque traduction a ses propres noms de livres traduits dans toutes les langues UI supportées
- La recherche par référence doit être **translation-aware** (les noms de livres varient selon la langue UI)
- Les fichiers de traduction contiennent les noms de livres **déjà traduits** pour chaque langue UI

---

## 3. Entités de Domaine

### BibleBook (Domain Entity)
```typescript
interface BibleBook {
  id: string; // Standard code: 'gen', 'exo', 'psa', 'joh'...
  name: Record<string, string>; // { fr: 'Genèse', en: 'Genesis', ar: 'التكوين' }
  testament: 'old' | 'new';
  chapterCount: number;
  orderIndex: number; // 1-66 global ordering
}
```

### BibleChapter (Domain Entity)
```typescript
interface BibleChapter {
  bookId: string;
  number: number;
  verseCount: number;
}
```

### BibleVerse (Domain Entity)
```typescript
interface BibleVerse {
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  text: string; // Full verse text in the selected translation's language
  reference: string; // Generated display reference: "Jean 3:16"
  translationId: string; // Which translation this verse belongs to
}
```
**Génération de référence**: `reference = buildReference(bookId, chapterNumber, verseNumber, uiLanguage)`

### BibleTranslation (Domain Entity)
```typescript
interface BibleTranslation {
  id: string; // Unique ID: 'lsg', 'kjv', 'niv', 'nasb'...
  name: string; // Display name
  year: number; // Publication year
  language: string; // Source language of translation ('fr', 'en'...)
  style: 'classique' | 'moderne' | 'paraphrase';
  books: BibleBook[];
  isPublicDomain: boolean;
}
```

---

## 4. Standard des 66 Livres

### Ancien Testament (39 livres)

| Code | Français | Anglais | Arabes | Chapitres |
|------|----------|---------|--------|-----------|
| gen | Genèse | Genesis | التكوين | 50 |
| exo | Exode | Exodus | الخروج | 40 |
| lev | Lévitique | Leviticus | لاويين | 27 |
| psa | Psaumes | Psalms | مزامير | 150 |
| prov | Proverbes | Proverbs | أمثال | 31 |
| isa | Ésaïe | Isaiah | أشعياء | 66 |
| dan | Daniel | Daniel | دانيال | 12 |
| etc. | ... | ... | ... | ... |

### Nouveau Testament (27 livres)

| Code | Français | Anglais | Arabes | Chapitres |
|------|----------|---------|--------|-----------|
| mat | Matthieu | Matthew | متى | 28 |
| mar | Marc | Mark | مرقس | 16 |
| luk | Luc | Luke | لوقا | 24 |
| joh | Jean | John | يوحنا | 21 |
| rom | Romains | Romans | روم | 16 |
| rev | Apocalypse | Revelation | سفر الرؤيا | 22 |
| etc. | ... | ... | ... | ... |

---

## 5. Résolution de Références

### Parser de référence biblique
```typescript
interface ParsedReference {
  bookId: string;
  chapter: number;
  verse?: number;
  verseEnd?: number; // For ranges: "Jean 3:16-18"
}

// Regex-based parser supporting common formats
class ReferenceParser {
  // Supported formats:
  // "Jean 3:16" → { bookId: 'joh', chapter: 3, verse: 16 }
  // "Jn 3:16" → same (abbreviation mapping)
  // "Johanes 3:16" → same (full name variant)
  // "Jean 3:16-18" → { bookId: 'joh', chapter: 3, verse: 16, verseEnd: 18 }
  // "3:16" → contextual (requires current book context)
  
  parse(refString: string, contextBookId?: string): ParsedReference | null
  
  // Book name → standard code mapping
  bookNameToCode(name: string, uiLanguage: string): string | null
  
  // Code → localized name
  bookCodeToName(code: string, uiLanguage: string): string
}
```

### Mapping d'abréviations
Pour chaque langue UI, maintenir un mapping de tous les noms/abréviations vers le code standard:

```json
{
  "joh": {
    "fr": ["Jean", "Jn", "Saint Jean", "Évangile selon Jean"],
    "en": ["John", "Jn", "St John"],
    "ar": ["يوحنا", "إنجيل يوحنا"]
  }
}
```

---

## 6. Translation Registration System

### Mécanisme d'enregistrement automatique
Les traductions bibliques s'enregistrent automatiquement sans code change:

```typescript
class TranslationRegistry {
  private translations = new Map<string, BibleTranslation>();
  
  // Called automatically when data/bible/*.json files are loaded
  register(translation: BibleTranslation): void {
    this.translations.set(translation.id, translation);
  }
  
  getAll(): BibleTranslation[] {
    return [...this.translations.values()];
  }
  
  getById(id: string): BibleTranslation | undefined {
    return this.translations.get(id);
  }
  
  // Get books with localized names for a given UI language
  getBooksForUiLanguage(translationId: string, uiLanguage: string): BibleBook[] {
    const t = this.translations.get(translationId);
    if (!t) throw new Error(`Translation ${translationId} not found`);
    
    return t.books.map(book => ({
      ...book,
      name: book.name[uiLanguage] || book.name['en'] || book.name['fr'],
    }));
  }
}

// Singleton registry — auto-populated at startup from data/bible/*.json
export const translationRegistry = new TranslationRegistry();
```

### Implication
- Ajouter une nouvelle traduction = placer un fichier JSON dans `data/bible/`
- Aucun code à modifier
- La traduction apparaît automatiquement dans le picker au runtime

---

## 7. Gestion des Traductions

### Défaut: LSG (Louis Segond 1910)
Justification:
- Traduction la plus utilisée en francophonie
- Domaine public — pas de restriction de licence
- Style poétique mais accessible
- Base pour la communauté francophone chrétienne

### Format de données standardisé
Tout fichier de traduction biblique DOIT respecter le schéma défini dans `docs/10-data-model.md`. Validation Zod au chargement.

### Extensions futures
- Support BX format (standard Bible eXchange) si besoin d'interopérabilité
- Support multiversion (plusieurs traductions chargées simultanément pour comparaison)
- Support audio verses (fichier audio par verset, futur)

---

*Document approuvé. Transmis à l'Agent G pour Internationalisation.*
