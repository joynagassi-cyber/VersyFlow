# VersyFlow — Comparison Engine Specification

> Moteur de comparaison réponse utilisateur vs texte attendu
> Position: `src/domains/memorization/comparison-engine.ts`
> Document: docs/22-comparison-engine-spec.md

---

## 1. Objectif

Comparer la réponse saisie par l'utilisateur avec le verset biblique attendu et produire un **diagnostic structuré** exploitable par:
- L'UI pour montrer les mots corrects/incorrects
- Le moteur FSRS pour ajuster la difficulté
- Le user pour comprendre ses erreurs

---

## 2. Types de Comparaison

| Type | Description | Impact sur la note |
|------|-------------|-------------------|
| Parfait | Tous les mots, tous les ordres | EASY/GOOD |
| Transposition | Mots corrects mais ordre incorrect | GOOD/HARD |
| Omission | Certains mots manquants | HARD |
| Addition | Mots supplémentaires | HARD |
| Substitution | Mots changés | HARD |
| Faux | Peu ou pas de mots corrects | AGAIN |

---

## 3. Algorithme Principal

### Étape 1: Normalisation
```typescript
normalize(text: string): string {
  return text.toLowerCase()
    .trim()
    .replace(/[.,;:'!?]/g, '')   // Remove punctuation
    .replace(/\s+/g, ' ');        // Normalize whitespace
}
```

### Étape 2: Tokenisation
```typescript
splitIntoWords(normalizedText: string): string[] {
  return normalizedText.split(' ').filter(w => w.length > 0);
}
```

### Étape 3: Alignement (Smith-Waterman simplifié)
Calculer la distance d'édition entre les séquences de mots:
- **Substitution**: mot remplacé par un autre
- **Insertion**: mot ajouté
- **Suppression**: mot manquant
- **Transposition**: deux mots échangés (coût 0.5)

### Étape 4: Calcul du Score
```typescript
similarityScore(expected: string[], provided: string[]): number {
  const matches = countMatches(expected, provided);
  return matches / expected.length; // 0 to 1
}
```

### Étape 5: Diagnostic Détaillé
Pour chaque mot attendu:
- ✅ Correct si `expected[i] === provided[i]`
- ❌ Manquant si absent de `provided`
- ➕ Ajouté si présent dans `provided` mais pas dans `expected`
- 🔄 Substitué si différent mais similaire (edit distance ≤ 1)

---

## 4. Sortie Structurée

```typescript
interface VerificationResult {
  // Global
  score: number;                  // 0-1 (similarity)
  wordCount: number;              // Total words in verse
  
  // Word-level analysis
  correctWords: string[];         // Words correctly recalled
  missingWords: string[];         // Words that should be there but aren't
  extraWords: string[];           // Extra words the user added
  substitutedWords: Array<{      // Words changed
    position: number;
    expected: string;
    got: string;
  }>;
  
  // Structural analysis
  transpositions: Array<{        // Swapped word pairs
    first: number;
    second: number;
  }>;
  
  // Portion analysis
  strongPortions: Array<{       // Consecutive correct segments
    start: number;
    end: number;
    length: number;
    accuracy: number;           // 0-1 within this portion
  }>;
  
  fragilePortions: Array<{      // Consecutive incorrect segments
    start: number;
    end: number;
    length: number;
    accuracy: number;
  }>;
  
  // Error classification
  errorType: 'PERFECT' | 'GOOD' | 'HARD' | 'AGAIN';
  primaryError: 'omission' | 'substitution' | 'addition' | 'transposition' | 'none';
}
```

---

## 5. Règles de Classification

| Score | Error Type | Primary Error | Action |
|-------|-----------|---------------|--------|
| ≥ 0.95 | PERFECT | none | EASY |
| ≥ 0.80 | GOOD | omission | GOOD |
| ≥ 0.60 | HARD | substitution | HARD |
| < 0.60 | AGAIN | transposition | AGAIN |

---

## 6. Implémentation

```typescript
export class ComparisonEngine {
  compare(userInput: string, expectedVerse: string): VerificationResult {
    const normalizedExpected = this.normalize(expectedVerse);
    const normalizedInput = this.normalize(userInput);
    
    const expectedWords = this.splitIntoWords(normalizedExpected);
    const providedWords = this.splitIntoWords(normalizedInput);
    
    // Alignment
    const alignment = this.alignWords(expectedWords, providedWords);
    
    // Calculate metrics
    const correct = alignment.correct;
    const score = correct.length / expectedWords.length;
    
    // Classify errors
    const result: VerificationResult = {
      score,
      wordCount: expectedWords.length,
      correctWords: correct.map(c => c.word),
      missingWords: alignment.missing.map(m => m.expected),
      extraWords: alignment.extra.map(e => e.got),
      substitutedWords: alignment.substituted.map(s => ({
        position: s.position,
        expected: s.expected,
        got: s.got,
      })),
      transpositions: alignment.transpositions,
      strongPortions: this.analyzePortions(alignment, 'strong'),
      fragilePortions: this.analyzePortions(alignment, 'fragile'),
      errorType: this.classifyScore(score),
      primaryError: this.primaryErrorType(alignment),
    };
    
    return result;
  }
  
  private normalize(text: string): string {
    return text.toLowerCase().trim()
      .replace(/[.,;:'!?]/g, '')
      .replace(/\s+/g, ' ');
  }
  
  private splitIntoWords(text: string): string[] {
    return text.split(' ').filter(w => w.length > 0);
  }
  
  private alignWords(expected: string[], provided: string[]) {
    // Simplified alignment using edit distance
    // Returns matched, missing, extra, substituted, transpositions
    const alignment = {};
    // ... implementation
    return alignment;
  }
  
  private classifyScore(score: number): string {
    if (score >= 0.95) return 'PERFECT';
    if (score >= 0.80) return 'GOOD';
    if (score >= 0.60) return 'HARD';
    return 'AGAIN';
  }
  
  private primaryErrorType(alignment): string {
    // Return most common error type
  }
  
  private analyzePortions(alignment, type: 'strong' | 'fragile'): Array<{start, end, length, accuracy}> {
    // Group consecutive correct/incorrect positions into portions
  }
}
```

---

## 7. Intégration avec FSRS

Le `VerificationResult` alimente directement le FSRS engine:
- `score` détermine le `Rating` initial
- `primaryError` influence le calcul de `difficulty`
- `fragilePortions` identifie les mots qui doivent être renforcés dans les sessions futures

---

## 8. Tests Essentiels

```typescript
// Test 1: Match parfait
compare("Au commencement Dieu créa...", "Au commencement Dieu créa...") → { score: 1.0, errorType: 'PERFECT' }

// Test 2: Omission simple
compare("Au commencement Dieu créa...", "Au commencement Dieu créé") → { score: 0.95, errorType: 'GOOD' }

// Test 3: Transposition
compare("Au commencement Dieu créa les cieux", "Au commencement Dieu créa les cieux et la terre") → score modérée

// Test 4: Plusieurs substitutions
compare("Jean 3:16", "Jean trois seize") → { score: low, primaryError: 'substitution' }
```

---

*Ce moteur est testable en isolation, sans UI, sans dépendance externe.*
