# VersyFlow — Domain Events

## Catalogue complet des événements métier pour la communication inter-domaine

---

## 1. Architecture Événementielle

### Principes

| Principe | Description |
|----------|-------------|
| **Evenements immutables** | Une fois émis, un événement ne peut pas être modifié |
| **Evenements asynchrones** | L'émission est `void` — l'auditeur reçoit une copie |
| **No coupling between producer and consumer** | Les domaines n'ont aucune connaissance de qui écoute |
| **Every event is serializable** | Format JSON-compatible pour logging et debugging |

### Interface de Base

```typescript
// src/domains/index.ts
export interface DomainEvent {
  /** Unique identifier for this event instance */
  id: string; // UUID v4
  
  /** Event type, format: "{domain}.{action}" */
  type: string;
  
  /** When the event occurred (Unix timestamp ms) */
  timestamp: number;
  
  /** Payload data — must be serializable to JSON */
  payload: Record<string, unknown>;
}

/**
 * Simple in-memory event bus for cross-domain communication.
 * In V1+, replace with a proper event store if needed.
 */
export class EventBus {
  private handlers = new Map<string, Set<(event: DomainEvent) => void>>();
  
  on(type: string, handler: (event: DomainEvent) => void): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
  }
  
  emit(event: DomainEvent): void {
    const handlers = this.handlers.get(event.type) ?? new Set();
    handlers.forEach(h => h(event));
  }
  
  off(type: string, handler: (event: DomainEvent) => void): void {
    const handlers = this.handlers.get(type);
    handlers?.delete(handler);
  }
}

export const eventBus = new EventBus();
```

---

## 2. Catalogue Complet des Domain Events

### 2.1 Bible Events

#### BEV-001: VerseSelected

Déclenché quand l'utilisateur sélectionne un verset dans l'explorateur Bible.

| Champ | Type | Description |
|-------|------|-------------|
| `bookId` | `string` | Code livre (ex: 'joh') |
| `chapterNumber` | `number` | Numéro du chapitre |
| `verseNumber` | `number` | Numéro du verset |
| `translationId` | `string` | Traduction active |
| `referenceDisplay` | `string` | Référence lisible ("Jean 3:16") |
| `wasSearchResult` | `boolean` | Vrai si sélectionné via recherche |

**Déclencheur**: `BibleExplorerScreen` → user taps verse card

**Conséquences**:
- Peut trigger analytics tracking
- Peut pré-charger les stats FSRS de ce verset

```typescript
const event: DomainEvent = {
  id: generateUUID(),
  type: 'bible.verse_selected',
  timestamp: Date.now(),
  payload: {
    bookId: 'joh',
    chapterNumber: 3,
    verseNumber: 16,
    translationId: 'lsg',
    referenceDisplay: 'Jean 3:16',
    wasSearchResult: false,
  },
};
eventBus.emit(event);
```

---

#### BEV-002: TranslationChanged

Déclenché quand l'utilisateur change de traduction biblique.

| Champ | Type | Description |
|-------|------|-------------|
| `fromTranslationId` | `string` | Ancienne traduction |
| `toTranslationId` | `string` | Nouvelle traduction |
| `changedByUser` | `boolean` | True si action explicite, false si défaut |

**Déclencheur**: Settings → changer traduction

**Conséquences**:
- Recharger tous les textes de versets affichés
- Re-parsing des références bookmarks avec nouvelle traduction
- Invalidations de cache UI

---

### 2.2 Memorization Events

#### MEM-001: MemorizationStarted

Déclenché au début d'une session de mémorisation.

| Champ | Type | Description |
|-------|------|-------------|
| `recordId` | `string` | ID du MemorizationRecord |
| `bookId` | `string` | Livre |
| `chapterNumber` | `number` | Chapitre |
| `verseNumber` | `number` | Verset |
| `translationId` | `string` | Traduction |

**Déclencheur**: User taps "Mémoriser ce verset"

**Conséquences**:
- Marquer le verset comme "en cours de mémorisation" (lock pendant session)
- Start timer pour session duration analytics

---

#### MEM-002: VerseMemorized

Déclenché quand un verset est marqué comme mémorisé.

| Champ | Type | Description |
|-------|------|-------------|
| `recordId` | `string` | ID du MemorizationRecord |
| `sessionDurationMs` | `number` | Durée totale de la session |
| `wordsRevealed` | `number` | Mots révélés |
| `totalWords` | `number` | Total mots dans le verset |
| `rating` | `'again' \| 'hard' \| 'good' \| 'easy'` | Auto-converted from user action |
| `newStability` | `number` | FSRS stability après calcul |
| `nextReviewAt` | `number` | Unix timestamp next review |

**Déclencheur**: User taps "J'ai mémorisé" en fin de session

**Conséquences**:
- Update MemorizationRecord status: `new` → `in-progress` ou `in-progress` → `mastered`
- Schedule next review via FSRS
- Emit ReviewScheduled event
- Update streak counter
- Trigger success animation
- Update home screen badge count

```typescript
const event: DomainEvent = {
  id: generateUUID(),
  type: 'memorization.verse_memorized',
  timestamp: Date.now(),
  payload: {
    recordId: 'abc123',
    sessionDurationMs: 45200,
    wordsRevealed: 18,
    totalWords: 18,
    rating: 'good',
    newStability: 3.2,
    nextReviewAt: Date.now() + 3 * 86400000,
  },
};
eventBus.emit(event);
```

---

#### MEM-003: SessionAbandoned

Déclenché quand une session de mémorisation est interrompue sans achèvement.

| Champ | Type | Description |
|-------|------|-------------|
| `recordId` | `string` | ID du MemorizationRecord |
| `elapsedMs` | `number` | Temps passé avant abandon |
| `wordsRevealed` | `number` | Mots révélés avant abandon |
| `totalWords` | `number` | Total mots |
| `abandonedByClose` | `boolean` | True si bouton close, false si navigation |

**Déclencheur**: User closes session or navigates away

**Conséquences**:
- Save partial progress (partial MemorizationRecord persisted)
- Analytics: measure abandonment rate

---

#### MEM-004: FavoriteToggled

Déclenché quand un verset est ajouté/retiré des favoris.

| Champ | Type | Description |
|-------|------|-------------|
| `recordId` | `string` | ID du MemorizationRecord |
| `favorite` | `boolean` | true = added, false = removed |

**Déclencheur**: User taps favorite heart on verse card

**Conséquences**:
- Toggle `MemorizationRecord.favorite` boolean
- Update any favorite list views

---

### 2.3 Review Events

#### REV-001: ReviewSessionStarted

Déclenché au début d'une session de révision FSRS.

| Champ | Type | Description |
|-------|------|-------------|
| `versesCount` | `number` | Nombre de versets dans la file |
| `overdueCount` | `number` | Versets en retard |
| `scheduledCount` | `number` | Versets à jour |

**Déclencheur**: User starts review session from queue

**Conséquences**:
- Analytics start
- Pause any background processes

---

#### REV-002: ReviewCompleted

Déclenché après chaque réponse individuelle dans une session de révision.

| Champ | Type | Description |
|-------|------|-------------|
| `recordId` | `string` | ID du MemorizationRecord |
| `rating` | `'again' \| 'hard' \| 'good' \| 'easy'` | Rating donné par l'utilisateur |
| `previousStability` | `number` | Stabilité avant révision |
| `newStability` | `number` | Stabilité après révision |
| `previousDifficulty` | `number` | Difficulté avant |
| `newDifficulty` | `number` | Difficulté après |
| `predictedInterval` | `number` | Interval prédit par FSRS |
| `timeSpentMs` | `number` | Temps passé sur ce verset |

**Déclencheur**: User selects rating (Again/Hard/Good/Easy)

**Conséquences**:
- Update MemorizationRecord.fsrsState
- Save ReviewLog entry
- Update review queue order
- Track per-verse retention metrics

---

#### REV-003: ReviewSessionFinished

Déclenché à la fin complète d'une session de révision.

| Champ | Type | Description |
|-------|------|-------------|
| `versesReviewed` | `number` | Versets traités |
| `ratingsDistribution` | `{again: n, hard: n, good: n, easy: n}` | Distribution des ratings |
| `totalTimeMs` | `number` | Durée totale session |
| `avgStabilityDelta` | `number` | Moyenne delta stabilité |

**Déclencheur**: User finishes all verses in queue

**Conséquences**:
- Update streak if day has reviews
- Update home screen badges
- Trigger celebration animation if all perfect ratings

---

### 2.4 Progression Events

#### PRG-001: StreakIncremented

Déclenché quotidiennement quand un streak est maintenu.

| Champ | Type | Description |
|-------|------|-------------|
| `streakCount` | `number` | Nouveau count de jours consécutifs |
| `isMilestone` | `boolean` | True si 7, 30, 100, etc. |

**Déclencheur**: Daily check at midnight (or when app opens after midnight)

**Conséquences**:
- Update UserSettings.streakCount
- Trigger milestone animation (confetti at 7, 30, 100)
- Update streak badge display

---

#### PRG-002: ProgressMilestoneReached

Déclenché quand un seuil global est atteint.

| Champ | Type | Description |
|-------|------|-------------|
| `milestoneType` | `'first_verse' \| 'ten_verses' \| 'fifty_verses' \| 'mastered_first'` | Type |
| `totalVerses` | `number` | Total versets mémorisés |
| `totalMastered` | `number` | Total versets maîtrisés |

**Déclencheur**: Count-based, triggered by ProgressService

**Conséquences**:
- Celebration animation
- Optional: save achievement (future feature)

---

### 2.5 Settings Events

#### SET-001: LanguageChanged

Déclenché quand la langue UI change.

| Champ | Type | Description |
|-------|------|-------------|
| `fromLanguage` | `string` | Ancienne langue code |
| `toLanguage` | `string` | Nouvelle langue code |
| `isRTL` | `boolean` | Direction RTL du nouveau langage |

**Déclencheur**: User changes language in settings

**Conséquences**:
- Re-render entire UI tree with new locale
- Apply I18nManager.forceRTL() if RTL
- Navigate back to home (some screens may not exist in new lang)

---

#### SET-002: ProgressReset

Déclenché quand l'utilisateur réinitialise toute sa progression.

| Champ | Type | Description |
|-------|------|-------------|
| `reason` | `'user_initiated'` | Toujours 'user_initiated' (pas d'auto-reset) |
| `versesDeleted` | `number` | Nombre de records supprimés |
| `reviewsDeleted` | `number` | Nombre de logs supprimés |

**Déclencheur**: Settings → Reset Progress → confirm

**Conséquences**:
- Delete ALL memorization records and review logs
- Reset streak to 0
- Log for analytics (quality signal: high reset rate = bad UX)

---

### 2.6 Error Events

#### ERR-001: FsrsEngineFailure

Déclenché quand le moteur FSRS échoue.

| Champ | Type | Description |
|-------|------|-------------|
| `engineType` | `'wasm'` | Type du moteur défaillant |
| `error` | `string` | Message d'erreur |
| `attemptNumber` | `number` | Essai numéro (retry count) |
| `fallbackActivated` | `boolean` | SM-2 JS activé |

**Déclencheur**: WASM load fails

**Conséquences**:
- Log error for telemetry
- Switch to FallbackEngine automatically
- Show toast "Moteur de révision désactivé. Algorithme simplifié."

---

## 3. Event Type Registry

Enum centralisé pour éviter les typos dans les event types:

```typescript
// src/domains/index.ts
export const DomainEventTypes = {
  // Bible
  VERSE_SELECTED: 'bible.verse_selected',
  TRANSLATION_CHANGED: 'bible.translation_changed',
  
  // Memorization
  MEMORIZATION_STARTED: 'memorization.started',
  VERSE_MEMORIZED: 'memorization.verse_memorized',
  SESSION_ABANDONED: 'memorization.session_abandoned',
  FAVORITE_TOGGLED: 'memorization.favorite_toggled',
  
  // Review
  REVIEW_SESSION_STARTED: 'review.session_started',
  REVIEW_COMPLETED: 'review.completed',
  REVIEW_SESSION_FINISHED: 'review.session_finished',
  
  // Progress
  STREAK_INCREMENTED: 'progress.streak_incremented',
  PROGRESS_MILESTONE_REACHED: 'progress.milestone_reached',
  
  // Settings
  LANGUAGE_CHANGED: 'settings.language_changed',
  PROGRESS_RESET: 'settings.progress_reset',
  
  // Errors
  FSRS_ENGINE_FAILURE: 'error.fsrs_engine_failure',
} as const;
```

Utilisation:
```typescript
import { eventBus, DomainEventTypes } from '@/domains';

eventBus.emit({
  id: generateUUID(),
  type: DomainEventTypes.VERSE_MEMORIZED,
  timestamp: Date.now(),
  payload: { recordId: 'xxx', ... },
});
```

---

## 4. Event Processing Examples

### Example: Complete flow from selection to memorization to review

```
[User selects Jean 3:16]
  → eventBus.emit(VERSE_SELECTED)
  
[User starts memorization]
  → eventBus.emit(MEMORIZATION_STARTED)
  
[User completes memorization with GOOD]
  → eventBus.emit(VERSE_MEMORIZED, { newStability: 3.2, nextReviewAt: T+3d })
  → (internal: scheduleReview(recordId, T+3d))
  → (internal: updateStreak())
  
[Day +3: user opens app]
  → HomeScreen checks "due verses" → shows badge "1 à réviser"
  
[User starts review]
  → eventBus.emit(REVIEW_SESSION_STARTED, { versesCount: 1 })
  
[User rates "Good"]
  → eventBus.emit(REVIEW_COMPLETED, { newStability: 5.5, ... })
  
[Review finishes]
  → eventBus.emit(REVIEW_SESSION_FINISHED, { versesReviewed: 1, ... })
```

---

## 5. Event Logging & Telemetry

Chaque event est automatiquement sérialisé et loggé pour debugging:

```typescript
// Dans eventBus.emit():
emit(event: DomainEvent): void {
  // 1. Notify listeners
  const handlers = this.handlers.get(event.type);
  handlers?.forEach(h => h(event));
  
  // 2. Log for debugging (only in development)
  if (__DEV__) {
    console.log(`[EVENT] ${event.type}`, JSON.stringify(event.payload, null, 2));
  }
  
  // 3. Telemetry (future: send to analytics service)
  telemetry.track(event.type, event.payload);
}
```

---

*Document approuvé. Ces events alimentent les services de progression et le dashboard statistique.*
