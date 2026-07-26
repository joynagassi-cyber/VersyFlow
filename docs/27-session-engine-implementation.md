# VersyFlow — Final Session Engine Implementation

> Implémentation complète du session engine avec toutes les stratégies MVP
> Fichier: `src/domains/memorization/session-engine.ts`

---

## 1. SessionEngine Complet

```typescript
import { Rating, IFsrsEngine, FsrsState } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { eventBus, DomainEventTypes, DomainEvent } from '@/domains';
import { ComparisonEngine, VerificationResult } from './comparison-engine';

/**
 * Complete memorization flow orchestrator.
 * Handles: preview → reveal → verify → FSRS update → persistence → events
 */
export class MemorizationFlow {
  private comparisonEngine: ComparisonEngine;
  
  constructor() {
    this.comparisonEngine = new ComparisonEngine();
  }
  
  /**
   * COMPLETE FLOW: From verse selection to FSRS scheduling
   */
  async completeMemorization(params: {
    recordId: string;
    bookId: string;
    chapterNumber: number;
    verseNumber: number;
    translationId: string;
    verseText: string;
    referenceDisplay: string;
    userAnswer?: string;       // If typing mode (future)
    revealedWordIndices: Set<number>;  // For progressive masking
    startTime: number;         // Unix ms when session started
  }, fsrsEngine: IFsrsEngine, storage: IStorage): Promise<{
    success: boolean;
    rating: Rating;
    score: number;
    nextReviewAt: number;
    verificationResult: VerificationResult;
  }> {
    try {
      const { 
        recordId, bookId, chapterNumber, verseNumber, 
        translationId, verseText, referenceDisplay,
        userAnswer, revealedWordIndices, startTime 
      } = params;
      
      // ====== STEP 1: Calculate Progress ======
      const totalWords = verseText.split(/\s+/).filter(w => w.length > 0).length;
      const wordsRevealed = revealedWordIndices.size;
      const progress = totalWords > 0 ? wordsRevealed / totalWords : 0;
      
      // ====== STEP 2: Get Verification Result ======
      let verificationResult: VerificationResult;
      
      if (userAnswer && userAnswer.trim().length > 0) {
        // User typed full answer
        verificationResult = this.comparisonEngine.compare(userAnswer, verseText);
      } else {
        // Progressive masking mode - calculate from revealed words
        verificationResult = this.calculateProgressiveVerification(
          verseText, 
          revealedWordIndices,
          totalWords
        );
      }
      
      // ====== STEP 3: Map Verification to Rating ======
      const rating = this.mapVerificationToRating(verificationResult.score);
      
      // ====== STEP 4: Duration ======
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      
      // ====== STEP 5: FSRS Review ======
      const currentState = await fsrsEngine.newState(0);
      const reviewResult = await fsrsEngine.review(currentState, rating);
      
      // ====== STEP 6: Update MemorizationRecord ======
      const updatedRecord = {
        id: recordId,
        bookId,
        chapterNumber,
        verseNumber,
        translationId,
        bibleVerseReference: referenceDisplay,
        bibleVerseText: verseText,
        status: 'in-progress' as const,  // Will transition to 'mastered' later
        fsrsState: reviewResult.state,
        favorite: false,
        tags: [],
        createdAt: Date.now(),
        lastReviewedAt: Date.now(),
        nextReviewAt: reviewResult.due.getTime(),
        reviewCount: 1,
        totalReviewMinutes: durationSeconds / 60,
        wordPerformance: this.extractWordPerformance(verseText, verificationResult),
      };
      
      // ====== STEP 7: Persist ======
      await storage.set(
        `versyflow:user:memorized:${recordId}`,
        JSON.stringify(updatedRecord)
      );
      
      // ====== STEP 8: Emit Events ======
      this.emitMemorizationEvents({
        recordId,
        rating,
        score: verificationResult.score,
        stable: reviewResult.state.stability,
        nextReviewAt: reviewResult.due.getTime(),
        durationSeconds,
      });
      
      return {
        success: true,
        rating,
        score: verificationResult.score,
        nextReviewAt: reviewResult.due.getTime(),
        verificationResult,
      };
    } catch (error) {
      console.error('[MemorizationFlow] Error:', error);
      return {
        success: false,
        rating: Rating.AGAIN,
        score: 0,
        nextReviewAt: Date.now(),
        verificationResult: {
          score: 0,
          wordCount: 0,
          correctWords: [],
          missingWords: [],
          extraWords: [],
          substitutedWords: [],
          characterDiffs: [],
          strongPortions: [],
          fragilePortions: [],
        },
      };
    }
  }
  
  private mapVerificationToRating(score: number): Rating {
    if (score >= 0.95) return Rating.EASY;
    if (score >= 0.80) return Rating.GOOD;
    if (score >= 0.60) return Rating.HARD;
    return Rating.AGAIN;
  }
  
  private calculateProgressiveVerification(
    verseText: string,
    revealedIndices: Set<number>,
    totalWords: number
  ): VerificationResult {
    const words = verseText.split(/\s+/).filter(w => w.length > 0);
    
    // Simulate a "partial recall" based on which words were revealed
    const revealedWords = words.filter((_, i) => revealedIndices.has(i));
    const unrevealedWords = words.filter((_, i) => !revealedIndices.has(i));
    
    return {
      score: revealedWords.length / words.length,
      wordCount: words.length,
      correctWords: revealedWords,
      missingWords: unrevealedWords,
      extraWords: [],
      substitutedWords: [],
      characterDiffs: [],
      strongPortions: [{ start: 0, end: revealedWords.length, accuracy: 1.0 }],
      fragilePortions: [{ start: revealedWords.length, end: words.length, accuracy: 0 }],
    };
  }
  
  private extractWordPerformance(
    verseText: string,
    verification: VerificationResult
  ): Array<{ wordIndex: number; word: string; failedRecalls: number }> {
    const words = verseText.split(/\s+/).filter(w => w.length > 0);
    
    return verification.missingWords.map((word, i) => ({
      wordIndex: words.indexOf(word),
      word,
      failedRecalls: 1, // Will be incremented over time
    }));
  }
  
  private emitMemorizationEvents(data: {
    recordId: string;
    rating: Rating;
    score: number;
    stable: number;
    nextReviewAt: number;
    durationSeconds: number;
  }): void {
    // Primary event: VERSE_MEMORIZED
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.VERSE_MEMORIZED,
      timestamp: Date.now(),
      payload: {
        recordId: data.recordId,
        rating: data.rating,
        score: data.score,
        stability: data.stable,
        nextReviewAt: data.nextReviewAt,
        durationSeconds: data.durationSeconds,
      },
    });
  }
}
```

---

## 2. ComparisonEngine Complet

```typescript
interface WordAlignment {
  correct: Array<{ position: number; word: string }>;
  missing: Array<{ position: number; word: string }>;
  extra: Array<{ position: number; word: string }>;
  substituted: Array<{ position: number; expected: string; got: string }>;
  transpositions: Array<{ first: number; second: number }>;
}

export class ComparisonEngine {
  /**
   * Compare user input against expected verse text
   * Returns structured diagnostic result
   */
  compare(userInput: string, expectedVerse: string): VerificationResult {
    const normalizedExpected = this.normalize(expectedVerse);
    const normalizedInput = this.normalize(userInput);
    
    const expectedWords = this.tokenize(normalizedExpected);
    const providedWords = this.tokenize(normalizedInput);
    
    // Alignment
    const alignment = this.alignWords(expectedWords, providedWords);
    
    // Calculate metrics
    const score = this.calculateSimilarityScore(alignment, expectedWords.length);
    
    // Analyze portions
    const { strongPortions, fragilePortions } = this.analyzePortions(alignment, expectedWords.length);
    
    return {
      score,
      wordCount: expectedWords.length,
      correctWords: alignment.correct.map(c => c.word),
      missingWords: alignment.missing.map(m => m.word),
      extraWords: alignment.extra.map(e => e.word),
      substitutedWords: alignment.substituted.map(s => ({
        expected: s.expected,
        got: s.got,
      })),
      characterDiffs: [], // Future: character-level diff
      strongPortions,
      fragilePortions,
    };
  }
  
  private normalize(text: string): string {
    return text.toLowerCase()
      .trim()
      .replace(/[.,;:'!?"]/g, '')
      .replace(/\s+/g, ' ');
  }
  
  private tokenize(text: string): string[] {
    return text.split(' ').filter(w => w.length > 0);
  }
  
  private alignWords(expected: string[], provided: string[]): WordAlignment {
    // Simplified alignment using longest common subsequence
    const alignment: WordAlignment = {
      correct: [],
      missing: [],
      extra: [],
      substituted: [],
      transpositions: [],
    };
    
    const expectedSet = new Set(expected);
    const providedSet = new Set(provided);
    
    for (let i = 0; i < expected.length; i++) {
      if (i < provided.length && expected[i] === provided[i]) {
        alignment.correct.push({ position: i, word: expected[i] });
      } else if (!providedSet.has(expected[i])) {
        alignment.missing.push({ position: i, word: expected[i] });
      } else {
        // Check if it's a transposition
        if (i > 0 && provided[i-1] === expected[i] && provided[i] === expected[i-1]) {
          alignment.transpositions.push({ first: i-1, second: i });
          // Already handled in next iteration
        } else {
          alignment.substituted.push({ 
            position: i, 
            expected: expected[i], 
            got: provided[i] || expected[i] 
          });
        }
      }
    }
    
    // Handle extra words at end of provided text
    for (let i = expected.length; i < provided.length; i++) {
      alignment.extra.push({ position: i, word: provided[i] });
    }
    
    return alignment;
  }
  
  private calculateSimilarityScore(alignment: WordAlignment, totalWords: number): number {
    return alignment.correct.length / Math.max(totalWords, 1);
  }
  
  private analyzePortions(alignment: WordAlignment, totalWords: number): {
    strongPortions: Array<{ start: number; end: number; accuracy: number }>;
    fragilePortions: Array<{ start: number; end: number; accuracy: number }>;
  } {
    const correctPositions = new Set(alignment.correct.map(c => c.position));
    const strongPortions: Array<{ start: number; end: number; accuracy: number }> = [];
    const fragilePortions: Array<{ start: number; end: number; accuracy: number }> = [];
    
    let currentStart = 0;
    let currentCorrect = 0;
    
    for (let i = 0; i <= totalWords; i++) {
      const isCorrect = i < totalWords && correctPositions.has(i);
      
      if (isCorrect) {
        currentCorrect++;
      }
      
      if (!isCorrect || i === totalWords) {
        const length = i - currentStart || 1;
        const accuracy = currentCorrect / length;
        
        if (accuracy >= 0.8) {
          strongPortions.push({ start: currentStart, end: i - 1, accuracy });
        } else if (accuracy < 0.5) {
          fragilePortions.push({ start: currentStart, end: i - 1, accuracy });
        }
        
        currentStart = i;
        currentCorrect = 0;
      }
    }
    
    return { strongPortions, fragilePortions };
  }
}
```

---

## 3. Utilisation dans l'UI

```typescript
// Dans MemorizationSessionScreen:
function handleMemorizeComplete() {
  const { currentRecordId, verseText, wordChips, sessionStartTime } = useMemorizationStore.getState();
  
  const revealedWordIndices = new Set(
    wordChips.map((chip, index) => chip.revealed ? index : -1).filter(i => i !== -1)
  );
  
  const flow = new MemorizationFlow();
  const result = await flow.completeMemorization({
    recordId: currentRecordId!,
    bookId: params.bookId,
    chapterNumber: params.chapterNumber,
    verseNumber: params.verseNumber,
    translationId: 'lsg',
    verseText,
    referenceDisplay: params.reference,
    revealedWordIndices,
    startTime: sessionStartTime!,
  }, fsrsService, storageService);
  
  if (result.success) {
    // Navigate to confirmation screen with results
    router.push({
      pathname: '/memorization/confirm',
      params: {
        score: String(result.score),
        stability: String(result.stable),
        nextReviewAt: String(result.nextReviewAt),
        verification: JSON.stringify(result.verificationResult),
      },
    });
  }
}
```

---

*Ce fichier contient toute la logique métier de la mémorisation. Aucun UI code ne doit être ajouté ici.*
