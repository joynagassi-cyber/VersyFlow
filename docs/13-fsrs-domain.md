# VersyFlow — Domaine FSRS (Free Spaced Repetition Scheduler)

## Document généré par Agent H — FSRS

---

## 1. Qu'est-ce que FSRS?

FSRS est un algorithme de répétition espacée de dernière génération, développé par OpenSpacedRepetition. Il améliore significativement SM-2 (l'algorithme d'Anki) en utilisant:

- Des paramètres de **stabilité** et **difficulté** séparés et indépendants
- Une optimisation par gradient descend sur données massives (courbe d'oubli réelle)
- Un modèle mathématique de la probabilité de rappel plus précis
- La capacité de s'adapter au rythme individuel de chaque utilisateur

Pour VersyFlow, FSRS sera écrit en **Rust**, compilé en **WebAssembly (WASM)**, et appelé via une interface TypeScript abstraite.

---

## 2. Modèles Mathématiques FSRS

### Paramètres Clés

| Paramètre | Symbole | Plage | Description |
|-----------|---------|-------|-------------|
| Stabilité | $s$ | $0 \rightarrow \infty$ | Nombre de jours avant que $P(\text{recall}) = 0.9$. Plus $s$ est grand, plus le verset est stable. |
| Difficulté | $d$ | $0 \rightarrow 10$ | $0 =$ très facile, $10 =$ très difficile. Détermine la vitesse d'augmentation de stabilité. |
| Répétitions | $n$ | $0 \rightarrow \infty$ | Nombre total de reviews pour cet élément. |
| Intervalle | $l$ | $0 \rightarrow \infty$ | Jours entre deux reviews successifs. |
| Probabilité de rappel | $P$ | $0 \rightarrow 1$ | Chance de se rappeler au moment du rappel (target: 0.9). |

### Formule de Courbe d'Oubli

La probabilité de rappel après $t$ jours est:

```
P(retour = t) = (1 + (t / (c1 * s)) ^ c3) ^ (-c2)
```

Où:
- $s$ = stabilité actuelle
- $c1, c2, c3$ = constants apprises par FSRS lors de l'optimisation des poids

### Calcul du Nouvel État

Après chaque révision, FSRS met à jour la stabilité et la difficulté:

```
nouvelle_difficulté = ancienne_difficulté - c4 * (rating - 1) * (e ^ c5 * (1 -难度)) + noise
nouvelle_stabilité = function(d, s, rating, elapsed_days)
```

Les formules exactes dépendent du poids appris ($w_0, w_1, ..., w_{27}$ environ 28 poids).

> Les détails d'implémentation sont dans la crate `fsrs-rs` Rust. L'interface TS ne doit pas exposer ces calculs.

---

## 3. Intégration Rust → TypeScript

### Stack Technique

```
TypeScript App Code (FsrsService)
    ↓ utilise
IFsrsEngine (port TypeScript abstrait)
    ↓ implémenté par
WasmFsrsEngine
    ↓ appelle
@wasm-tool/wasm-bindgen / napi-rs
    ↓ FFI
Rust Library (crates.io fsrs v3+)
    ↓ compile en
Compiled .wasm module
```

### Interface TypeScript Abstraite (Port)

```typescript
export enum Rating {
  AGAIN = 1,   // Forgot / didn't recall at all
  HARD = 2,    // Recall with difficulty
  GOOD = 3,    // Recall correctly and smoothly
  EASY = 4,    // Recall effortlessly
}

export interface FsrsState {
  stability: number;       // Days until P(recall) = 0.9
  difficulty: number;      // 0-10 scale
  elapsedDays: number;     // Days since creation or last review
  repetitions: number;     // Total review count
  lastInterval?: number;   // Last scheduled interval (days)
  requestedRetention?: number; // Target retention (default 0.9)
}

export interface FsrsReview {
  state: FsrsState;        // Updated state after review
  due: Date;               // Next review date
  stability: number;       // New stability
  difficulty: number;      // New difficulty
  elapsedDays: number;
  scheduledDays: number;   // New interval in days
  recurring: boolean;      // Is this a recurring review item?
}

export interface IFsrsEngine {
  /** Create a new FSRS state for a new verse */
  newState(requestedRetries: number): FsrsState;
  
  /** Get the current FSRS state (for display/preview) */
  currentState(state: FsrsState): FsrsState;
  
  /** Process a review rating and return updated state */
  review(state: FsrsState, rating: Rating): FsrsReview;
  
  /** Explain what each parameter means (for UI tooltips) */
  explain(state: FsrsState, rating: Rating): Record<string, string>;
  
  /** Get verses needing review based on nextReviewAt */
  getDueItems(states: FsrsState[], now: Date): string[];
}
```

### Implémentation WASM

```typescript
// src/domains/fsrs/rust-engine.ts
import { IFsrsEngine, FsrsState, FsrsReview, Rating } from './engine';
import { loadFsrsWasm } from '@/infrastructure/rust/wasm-loader';

export class WasmFsrsEngine implements IFsrsEngine {
  private wasm: any;
  private loaded = false;
  
  private async ensureLoaded() {
    if (!this.loaded) {
      this.wasm = await loadFsrsWasm();
      this.loaded = true;
    }
  }
  
  async newState(requestedRetries: number): Promise<FsrsState> {
    await this.ensureLoaded();
    const raw = this.wasm.new_state(requestedRetries);
    return this.parseState(raw);
  }
  
  async review(state: FsrsState, rating: Rating): Promise<FsrsReview> {
    await this.ensureLoaded();
    const raw = this.wasm.review(
      JSON.stringify(state),
      rating,
      new Date().toISOString()
    );
    return JSON.parse(raw);
  }
  
  // ... other methods
}
```

### Implémentation Fallback (SM-2 en JS)

```typescript
// Fallback when WASM fails to load
class Sm2FallbackEngine implements IFsrsEngine {
  newState(requestedRetries: number): FsrsState {
    return {
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      repetitions: 0,
      requestedRetention: 0.9,
    };
  }
  
  review(state: FsrsState, rating: Rating): FsrsReview {
    // Classic SM-2 algorithm (simpler but functional)
    const { difficulty, lastInterval = 0 } = state;
    
    let newDifficulty = Math.max(0, Math.min(10, 
      difficulty - 1.3 + (4 - rating) * 0.5
    ));
    
    let newInterval: number;
    if (rating === 1) { // AGAIN
      newInterval = 1;
    } else if (lastInterval === 0) {
      newInterval = 1;
    } else if (rating === 4) { // EASY
      newInterval = Math.max(1, Math.round(lastInterval * 3.0));
    } else { // HARD or GOOD
      newInterval = Math.max(1, Math.round(lastInterval * 1.5));
    }
    
    return {
      state: {
        ...state,
        difficulty: newDifficulty,
        stability: newInterval,
        lastInterval,
        elapsedDays: newInterval,
        repetitions: state.repetitions + 1,
      },
      due: new Date(Date.now() + newInterval * 86400000),
      stability: newInterval,
      difficulty: newDifficulty,
      elapsedDays: newInterval,
      scheduledDays: newInterval,
      recurring: true,
    };
  }
  
  // ... delegate methods
}
```

---

## 4. Comportement des Révisions

### Workflow Complet

```
1. Utilisateur voit un verset en mode mémorisation
2. Utilisateur tape "J'ai mémorisé" ou "J'ai rappelé"
3. Note enregistrée → FsrsService.review(recordId, rating)
4. IFsrsEngine.review(state, rating) appelé
5. WASM calcule new stability, difficulty, interval
6. Retour FsrsReview avec nouveau state + next due date
7. MemorizationRecord mis à jour avec nouveau FsrsState
8. nextReviewAt calculé et persisté en MMKV
9. Affiché à l'utilisateur: "Prochain rappel: dans X jours"
```

### Exemple concret

| Étape | Rating | Stabilité | Difficulté | Intervalle suivant |
|-------|--------|-----------|------------|-------------------|
| 1 (initial) | — | 1.0 | 5.0 | 1 jour |
| 2 | GOOD | 3.2 | 4.8 | 3 jours |
| 3 | GOOD | 5.5 | 4.5 | 7 jours |
| 4 | HARD | 7.0 | 5.0 | 10 jours |
| 5 | AGAIN | 3.0 | 5.5 | 1 jour |
| 6 | GOOD | 5.2 | 5.2 | 4 jours |
| 7 | GOOD | 8.0 | 4.8 | 10 jours |
| 8 | EASY | 15.0 | 4.0 | 25 jours |

---

## 5. Prédictibilité et Visualisation

### Affichage de la prédiction FSRS
Lorsqu'un verset est mémorisé, l'app affiche:

> **Prochain rappel**: dans 3 jours
> **Stabilité estimée**: 3.2 jours
> **Probabilité de rappel**: 91%

### Explications FSRS pour l'utilisateur
```typescript
interface Explanations {
  stability: string; // "Combien de jours avant que vous oubliiez ~10%"
  difficulty: string; // "Niveau de difficulté de ce verset"
  interval: string; // "Quand vous verrez ce verset à nouveau"
  recallProbability: string; // "Chance de vous en souvenir"
}
```

---

## 6. Weight Optimization

### Poids initiaux
FSRS fournit des poids initiaux (defaults) calibrés sur des millions de reviews. Ces poids seront utilisés au démarrage.

### Optimisation future
Au fur et à mesure que les utilisateurs révisent, FSRS peut apprendre les poids personnalisés de chaque utilisateur. Ce sera une feature V1+ une fois assez de données collectées.

---

*Document approuvé. Transmis à l'Agent I pour Folder Structure.*
