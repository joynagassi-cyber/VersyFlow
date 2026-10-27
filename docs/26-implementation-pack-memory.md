# VersyFlow — Implementation Pack: Memory System

> Guide d'implémentation pour les agents IA
> Ce document indique EXACTEMENT quoi coder, dans quel ordre, et comment intégrer avec le reste du système

---

## 1. Fichiers à Créer

| Fichier | Agent Responsable | Dépendances |
|---------|------------------|-------------|
| `src/domains/memorization/comparison-engine.ts` | Anvil | `entities.ts` (déjà créé) |
| `src/domains/memorization/memory-strategies.ts` | Scribe | `session-engine.ts`, `comparison-engine.ts` |
| `src/domains/memorization/progression-engine.ts` | Scribe | Tous les above + FSRS |
| `tests/unit/comparison-engine.test.ts` | Anvil | N/A |
| `tests/integration/session-flow.test.ts` | Anvil | `memorization-service.ts` |

---

## 2. Ordre d'Implémentation

### Étape 1: Comparison Engine (`src/domains/memorization/comparison-engine.ts`)

**Responsable**: Anvil
**Dépendances**: AUCUNE — peut être implémenté immédiatement
**Livrables**:
```typescript
export class ComparisonEngine {
  compare(userInput: string, expectedVerse: string): VerificationResult { ... }
}
```
**Tests essentiels**:
- Match parfait (score = 1.0)
- Omission simple (score > 0.8)
- Transposition (score ~0.6-0.8)
- Fausses réponses (score < 0.5)

---

### Étape 2: Session Engine Enhancement (`src/domains/memorization/session-engine.ts`)

**Responsable**: Anvil
**Dépendances**: `comparison-engine.ts` doit exister
**Modifications requises**:
```typescript
// Ajouter à la classe SessionEngine existante:
getVerificationResult(userInput: string): VerificationResult {
  const engine = new ComparisonEngine();
  return engine.compare(userInput, this.state.verseText);
}

getProgress(): number {
  // Déjà implémenté
}

endSession(complete: boolean, verification?: VerificationResult): { rating: Rating; progress: number } {
  // Améliorer: utiliser verification si fournie
}
```

---

### Étape 3: Memory Strategies (`src/domains/memorization/memory-strategies.ts`)

**Responsable**: Scribe
**Dépendances**: `session-engine.ts` + `comparison-engine.ts`
**Livrables**:
```typescript
export interface IMemorizationStrategy {
  name: string;
  difficultyLevel: number; // 1-5
  
  // Préparer la session
  setup(sessionState: SessionState): SessionState;
  
  // Générer l'étape suivante
  nextStep(currentState: SessionState): StepOutput;
  
  // Évaluer la réponse
  evaluate(input: string, expected: string): VerificationResult;
  
  // Déterminer si l'utilisateur est prêt à passer à la stratégie suivante
  shouldAdvance(state: SessionState, verification: VerificationResult): boolean;
}

export class ProgressiveMaskingStrategy implements IMemorizationStrategy {
  // MVP implementation already partially in session-engine
}

export class ActiveRecallStrategy implements IMemorizationStrategy {
  // Full recall without hints
}

// Factory pattern pour selection strategy
export function selectStrategy(
  stability: number,
  reviewCount: number,
  lastRating: Rating
): IMemorizationStrategy {
  // Implement selection logic from MEMORY_ENGINE_SPEC.md
}
```

---

### Étape 4: Progression Engine (`src/domains/memorization/progression-engine.ts`)

**Responsable**: Scribe
**Dépendances**: Tous les above
**Livrables**:
```typescript
export class ProgressionEngine {
  calculateMasteryLevel(record: MemorizationRecord): MasteryLevel;
  isMastered(record: MemorizationRecord): boolean;
  
  getWeeklyTrend(records: MemorizationRecord[]): WeeklyTrend;
  detectStreakBreak(lastActiveDay: Date): boolean;
  
  getMostForgottenWords(record: MemorizationRecord): string[];
  getFragilePortions(record: MemorizationRecord): Array<{start: number; end: number}>;
}
```

---

## 3. Intégration FSRS

### Hook d'Intégration
```typescript
// Dans MemorizationService.memorizeVerse()
async memorizeVerse(params, verificationResult?: VerificationResult): Promise<Result> {
  // 1. Start session
  // 2. User interacts (reveal words, type answer, etc.)
  // 3. VERIFY with ComparisonEngine
  const verification = new ComparisonEngine().compare(userInput, params.verseText);
  
  // 4. Map verification to FSRS Rating
  let rating: Rating;
  if (verification.score >= 0.95) rating = Rating.EASY;
  else if (verification.score >= 0.80) rating = Rating.GOOD;
  else if (verification.score >= 0.60) rating = Rating.HARD;
  else rating = Rating.AGAIN;
  
  // 5. Pass rating to FSRS for interval calculation
  const fsrsReview = await this.fsrsEngine.review(record.fsrsState, rating);
  
  // 6. Persist updated record
  // 7. Emit VERSE_MEMORIZED event with verification details
}
```

### Données de Verification Stockées
```typescript
interface VerificationHistoryEntry {
  timestamp: number;
  score: number;
  primaryError: 'omission' | 'substitution' | 'transposition' | 'none';
  fragilePortions: Array<{start: number; end: number}>;
}
```

Ces données alimentent le **Memory Fingerprint** (mots toujours oubliés) et la **détection de patterns**.

---

## 4. Events de Domaine à Émettre

| Event | Payload | Quand |
|-------|---------|-------|
| `VERSE_MEMORIZED` | `{recordId, rating, stability, verification: {score, fragilePortions}}` | Fin de session mémorisation |
| `REVIEW_COMPLETED` | `{recordId, rating, stabilityBefore, stabilityAfter, verification}` | Chaque révision FSRS |
| `STREAK_INCREMENTED` | `{streakCount, isMilestone}` | Quotidien, si activité |
| `PROGRESSION_MILESTONE_REACHED` | `{milestoneType, totalVerses}` | Seuil atteint (10, 50 versets...) |

---

## 5. Fichiers Interdits

Aucun agent ne doit:
- Modifier les fichiers de specs doc (docs/21-* à docs/25-*)
- Ajouter des dépendances npm supplémentaires
-coder en dur une traduction biblique
- Mélanger UI logique dans les composants

---

## 6. Points de Contrôle

Avant de passer au module suivant:
1. [ ] Typecheck passe vert
2. [ ] Lint passe vert
3. [ ] Tests unitaires passent
4. [ ] L'intégration avec FSRS fonctionne (mock engine)
5. [ ] Event bus émet correctement

---

*Ce pack doit être lu ENTIÈREMENT par tout agent avant de commencer l'implémentation.*
