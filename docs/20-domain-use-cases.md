# VersyFlow — Domain Use Cases

## Cas d'usage métier formels pour guider le développement et les agents IA

Chaque use case définit un comportement métier autonome avec préconditions, règles de validation, postconditions et erreurs. Ces documents servent de référence pour les développeurs IA qui doivent implémenter ou modifier une fonctionnalité.

---

## 1. UC-MEM-001: Memoriser un Verset

### Objectif
Permettre à l'utilisateur de mémoriser activement un verset biblique et enregistrer son premier état FSRS.

### Préconditions
1. L'utilisateur a complété l'onboarding (langue UI + traduction sélectionnées)
2. La traduction biblique est chargée en mémoire (LSG.json parsé)
3. Le verset cible existe dans la traduction active
4. Le moteur FSRS est disponible (WASM chargé OU fallback SM-2 actif)

### Postconditions
1. Un `MemorizationRecord` créé avec status `'in-progress'`
2. Un premier `FsrsState` calculé par FSRS (stabilité ~1 jour, difficulté ~5)
3. `nextReviewAt` programmé dans 1 jour
4. La progression persistée dans MMKV (`versyflow:user:memorized:{id}`)
5. L'événement `VERSE_MEMORIZED` émis

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | Un même verset (bookId:chapter:verse:translationId) ne peut avoir qu'un seul record actif |
| RB-2 | Si verset déjà memorisé, on met à jour au lieu de créer (increment reviewCount) |
| RB-3 | FSRS calcule le premier intervalle basé sur le rating de l'utilisateur |
| RB-4 | Le mot "maîtrisé" est atteint quand stability > 30 jours ET reviewCount >= 5 |
| RB-5 | La session ne peut pas dépasser 5 minutes (après, reset partiel) |
| RB-6 | Les mots du verset sont cachés de gauche à droite, pas aléatoirement |

### Séquence détaillée

```
1. User selects verse in BibleExplorerScreen
2. System loads full verse text from translation data
3. User taps "Mémoriser ce verset"
4. System checks if MemorizationRecord exists for this verse
   ├─ Does NOT exist → create new with status 'new'
   └─ EXISTS → load existing, reset to 'in-progress'
5. System starts memorization session:
   a. Display full verse for 10 seconds (preview phase)
   b. Progressively hide words left-to-right
   c. Each word becomes a clickable WordChip (hidden state)
   d. User taps each hidden word to reveal it
6. When all words revealed OR user taps "J'ai mémorisé":
   a. System calls fsrsEngine.review(state, Rating.GOOD)
   b. New FsrsState calculated
   c. MemorizationRecord updated with new state
   d. nextReviewAt = now() + scheduledDays days
7. System persists MemorizationRecord to MMKV
8. System emits VERSE_MEMORIZED event
9. System navigates to Confirmation screen
```

### Erreurs possibles

| Erreur | Cause | Recovery |
|--------|-------|----------|
| Verse not found | Translation file corrupt or incomplete | Reset to LSG default, log error |
| FSRS engine unavailable | WASM failed to load | Auto-switch to FallbackEngine, show toast |
| Storage write failed | MMKV corruption | Retry once, then prompt user to backup |
| Session timeout (> 5 min) | User left app too long | Reset preview, start fresh or abandon |

---

## 2. UC-REV-001: Réviser un Verset (FSRS)

### Objectif
Présenter un verset à l'utilisateur au moment optimal prédit par FSRS et mettre à jour son état de mémorisation.

### Préconditions
1. `MemorizationRecord.nextReviewAt <= maintenant` (verset due)
2. Le moteur FSRS est opérationnel
3. Le texte du verset est en mémoire (cached from translation data)

### Postconditions
1. `MemorizationRecord.fsrsState` mis à jour (nouvelle stabilité, difficulté)
2. `MemorizationRecord.nextReviewAt` recalculé
3. Un `ReviewLog` entry ajouté
4. L'événement `REVIEW_COMPLETED` émis

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | Les versets are ordered by urgency: overdue first, then due today, then upcoming |
| RB-2 | The rating "Again" resets the interval to 1 day regardless of current stability |
| RB-3 | The rating "Easy" gives maximum interval boost (×3.0 in SM-2, calculated by FSRS) |
| RB-4 | Self-rating is honest — no verification, trust the user |
| RB-5 | If user does not respond within 30 seconds, auto-reveal and count as "Forgot" |
| RB-6 | Each review is logged with before/after FSRS values |

### Séquence détaillée

```
1. System queries: SELECT * FROM MemorizationRecords WHERE nextReviewAt <= NOW()
2. Results sorted by: overdue DESC, nextReviewAt ASC
3. For each due verse:
   a. Display verse with partial masking (based on current stability)
      - High stability (>7 days): mask 80% of words
      - Medium stability (1-7 days): mask 50% of words
      - Low stability (<1 day): mask 30% of words
   b. Wait for user tap → reveal verse
   c. Wait up to 30 seconds for user rating
   d. If no rating in 30s → auto-rate as "Again"
   e. User taps: Again / Hard / Good / Easy
   f. fsrsService.review(recordId, rating) called
   g. New FsrsState applied to MemorizationRecord
   h. nextReviewAt updated
   i. ReviewLog entry saved
4. After queue exhausted: show session summary
```

### Calcul de masking progressif basé sur la stabilité

| Stabilité | Mots masqués | Rationale |
|-----------|-------------|-----------|
| < 1 jour | 20% des mots (les plus difficiles identifiés) | Presque oublié, besoin d'aide |
| 1-3 jours | 40% des mots | Rétention moyenne |
| 3-7 jours | 60% des mots | Bonne rétention |
| 7-30 jours | 80% des mots | Forte rétention |
| > 30 jours | 90% des mots | Maîtrise élevée, challenge max |

---

## 3. UC-BIB-001: Résoudre une Référence Biblique

### Objectif
Transformer une chaîne de référence lisible ("Jean 3:16", "Jn 3:16", "Genèse 1:1") en un objet `{bookId, chapter, verse}` résolu contre la traduction active.

### Préconditions
1. La traduction biblique est chargée (`bibleStore.translations` populated)
2. Le parser est configuré avec les alias de livres dans la langue UI courante

### Postconditions
1. Object `ParsedReference { bookId, chapter, verse? }` retourné
2. En cas d'échec, `null` retourné avec log d'erreur

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | The lookup is case-insensitive: "jean 3:16" = "Jean 3:16" |
| RB-2 | Book name resolution uses the CURRENT UI language's alias map |
| RB-3 | Abbreviations are resolved before full names (shorter match first) |
| RB-4 | If chapter is out of range → null (invalid reference) |
| RB-5 | If verse is out of range → adjust to last valid verse (graceful) |
| RB-6 | Range references ("Jean 3:16-18") resolve to first verse + verseEnd |

### Exemples de résolution

```typescript
// Input → Output
resolve("Jean 3:16")        → { bookId: 'joh', chapter: 3, verse: 16 }
resolve("Jn 3:16")          → { bookId: 'joh', chapter: 3, verse: 16 }
resolve("GENESE 1:1")       → { bookId: 'gen', chapter: 1, verse: 1 }
resolve("Psaume 23")        → { bookId: 'psa', chapter: 23, verse: undefined }
resolve("Jean 3:16-18")     → { bookId: 'joh', chapter: 3, verse: 16, verseEnd: 18 }
resolve("Rev 22:99")        → { bookId: 'rev', chapter: 22, verse: 21 } // capped at 21
resolve("XXXX 1:1")         → null // unknown book
resolve("Jean 99:1")        → null // chapter out of range
```

---

## 4. UC-SET-001: Changer la Langue de l'Interface

### Objectif
Permettre à l'utilisateur de changer la langue de l'interface sans redémarrage de l'app.

### Préconditions
1. L'utilisateur est sur l'écran Settings
2. La nouvelle langue existe dans les fichiers locales

### Postconditions
1. `UserSettings.uiLanguage` mise à jour et persistée dans MMKV
2. Tous les textes de l'UI re-rendus dans la nouvelle langue
3. Direction RTL/LTR appliquée si nécessaire
4. L'événement `LANGUAGE_CHANGED` est émis

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | The change is immediate and live — no restart required |
| RB-2 | I18nManager.forceRTL() is called synchronously if direction changes |
| RB-3 | The Bible translation is NOT affected (orthogonal systems) |
| RB-4 | If the new locale file is missing keys → fallback to English → French → key itself |
| RB-5 | Existing MemorizationRecords keep their BibleVerseText (no re-fetch needed) |

### Séquence

```
1. User navigates to Settings > Language
2. User selects new language (e.g., "Deutsch")
3. I18nService.setLanguage('de') called
4. Locale file loaded: src/i18n/locales/de.json
5. All t('...') calls return German strings
6. Re-render entire app tree with new layout direction if needed
7. Persist settings.uiLanguage = 'de' to MMKV
8. Emit LANGUAGE_CHANGED event
```

---

## 5. UC-PRO-001: Calculer la Streak Quotidienne

### Objectif
Maintenir et incrémenter un compteur de jours consécutifs d'activité de mémorisation.

### Préconditions
1. Au moins un `MemorizationRecord` existe (verset mémorisé ou révisé aujourd'hui)
2. La date du jour est connue (timezone locale de l'utilisateur)

### Postconditions
1. `UserSettings.currentStreak` mis à jour
2. Si le streak est breaké (gap > 1 jour), reset à 0 puis increment à 1
3. L'événement `STREAK_INCREMENTED` est émis si le count change

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | A "day" is defined as midnight-to-midnight in the user's local timezone |
| RB-2 | Any activity (memorize OR review) on a day counts toward the streak |
| RB-3 | If today already has activity, do NOT increment (already counted) |
| RB-4 | If yesterday had activity AND today has new activity → streak++ |
| RB-5 | If yesterday had NO activity AND today has activity → streak = 1 (reset) |
| RB-6 | If the user missed 2+ consecutive days → streak = 0 (broken) |

### Algorithme

```typescript
function calculateStreak(settings: UserSettings, todayActivities: Activity[]): number {
  const lastActiveDay = getLastActiveDay(settings);
  const today = normalizeDate(new Date());
  const lastActiveDate = normalizeDate(lastActiveDay);
  
  if (todayActivities.length === 0) {
    return settings.currentStreak; // No change
  }
  
  const daysSinceLastActivity = diffDays(today, lastActiveDate);
  
  if (daysSinceLastActivity === 1) {
    // Consecutive day — increment
    return settings.currentStreak + 1;
  } else if (daysSinceLastActivity === 0) {
    // Same day, already counted
    return settings.currentStreak;
  } else {
    // Gap detected — reset
    return 1; // Start new streak
  }
}
```

---

## 6. UC-FSR-001: Predire l'Interval Optimal (FSRS)

### Objectif
Calculer le prochain intervalle de révision optimal basé sur la stabilité, la difficulté, et le rating utilisateur via l'algorithme FSRS Rust.

### Préconditions
1. `FsrsState` actuel disponible pour le verset
2. L'utilisateur a fourni un rating (Again/Hard/Good/Easy)
3. Le moteur FSRS est opérationnel (WASM ou fallback)

### Postconditions
1. Nouvelle FsrsState retournée avec updated stability, difficulty, elapsedDays
2. Next interval calculé et retourné
3. Recall probability estimée

### Règles Métier

| Règle | Description |
|-------|-------------|
| RB-1 | FSRS calculations are deterministic — same input always produces same output |
| RB-2 | Stability is expressed in DAYS, not absolute time |
| RB-3 | Difficulty is clamped between 0 and 10 |
| RB-4 | The requestedRetention defaults to 0.9 (90% chance to remember) |
| RB-5 | The first review (new verse) ALWAYS results in stability ≈ 1 day |
| RB-6 | An "Again" rating should NOT reduce stability below the previous interval's minimum |

### Contract du calcul

```typescript
// MockFSRSEngine review behavior matches FSRS mathematical properties:
// Rating AGAIN (1):   stability *= 0.1, difficulty += 0.5
// Rating HARD (2):    stability *= 1.0, difficulty += 0.2
// Rating GOOD (3):    stability *= 2.5, difficulty -= 0.1
// Rating EASY (4):    stability *= 3.0, difficulty -= 0.3

// These multipliers are simplified but follow FSRS principles:
// - Better ratings → bigger stability boosts
// - Worse ratings → difficulty increases
// - Multiple AGAINs → difficulty accumulates, stability drops sharply
```

---

*Document approuvé. Chaque use case sert de référence pour les agents IA durant l'implémentation.*
