/**
 * Session Engine — Deterministic workflow for memorization sessions
 * See MEMORY_ENGINE_SPEC.md §3
 * Extension passage: revealNextVerse() pour navigation verset par verset
 */

import type { SessionState, VerificationResult, ExerciseStrategy, MaskingConfig, MemorizationTargetType } from './entities';
import { SessionPhase, DEFAULT_MVP_STRATEGY, getMaskingConfigForStability } from './entities';
import { ComparisonEngine } from './comparison-engine';
import type { IWordFailureTracker } from './tracker';
import { Rating } from '@/domains/fsrs';
import type { ILocalBibleRepository, BibleVerseData } from '@/domains/bible';
import type { IFsrsEngine, FsrsState, FsrsReview } from '@/domains/fsrs';
import type { MemorizationRecord } from './entities';

// =====================================================================
// PassageMemorizationEngine types
// =====================================================================

/** Verse data snapshot loaded during session start */
export interface VerseData {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  translationId: string;
}

/** Parameters for starting a passage memorization session */
export interface PassageTargetParams {
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translationId: string;
  /** Identifier of the learner profile (for record scoping) */
  learnerProfileId: string;
}

/** Optional records to initialize the engine with (preserves translation history) */
export interface PassageStartOptions {
  /** Pre-existing records keyed by (bookId:chapter:verse:translationId) */
  initialRecords?: MemorizationRecord[];
}

/** Interface for the passage-level session engine */
export interface IMemorizationSessionEngine {
  /** Start a passage session by loading all verses from the bible repo */
  startPassage(params: PassageTargetParams, options?: PassageStartOptions): Promise<void>;
  /** Move to next verse; returns false if already at last verse */
  nextVerse(): boolean;
  /** Move to previous verse; returns false if already at first verse */
  prevVerse(): boolean;
  /** Rate the current verse with FSRS. Returns the built MemorizationRecord (null on guard). */
  rateCurrentVerse(rating: Rating): Promise<MemorizationRecord | null>;
  /** Get data for the currently displayed verse */
  getCurrentVerseData(): VerseData | null;
  /** Get overall passage progress in [0, 1] */
  getProgress(): number;
  /** Check if all verses have been rated */
  isComplete(): boolean;
  /** Abandon the session without saving */
  abandon(): void;
  /** Total number of verses in the passage */
  getTotalVerses(): number;
}

/**
 * MemorizationSessionEngine — passage-level orchestrator.
 * Loads verses from ILocalBibleRepository, calls IFsrsEngine for scheduling,
 * and builds MemorizationRecord objects for persistence.
 * Pure domain logic — zero UI dependencies.
 */
export class MemorizationSessionEngine implements IMemorizationSessionEngine {
  private verses: VerseData[] = [];
  private currentIndex: number = 0;
  private phase: 'idle' | 'preview' | 'rated' = 'idle';
  private completedCount: number = 0;
  private passageParams: PassageTargetParams | null = null;
  private records: MemorizationRecord[] = [];
  private abandoned: boolean = false;

  constructor(
    private readonly bibleRepo: ILocalBibleRepository,
    private readonly fsrsEngine: IFsrsEngine,
  ) {}

  // ---- startPassage ----

  async startPassage(params: PassageTargetParams, options?: PassageStartOptions): Promise<void> {
    const { bookId, chapter, verseStart, verseEnd, translationId, learnerProfileId } = params;

    if (verseEnd < verseStart) {
      throw new Error(`Passage range invalid: endVerse(${verseEnd}) < startVerse(${verseStart})`);
    }

    const loaded: VerseData[] = [];
    for (let v = verseStart; v <= verseEnd; v++) {
      const raw = await this.bibleRepo.getVerse(translationId, bookId, chapter, v);
      if (!raw) {
        throw new Error(`Verse ${v} not found in ${bookId}:${chapter} (${translationId})`);
      }
      loaded.push({
        bookId,
        chapter,
        verse: v,
        text: raw.text,
        translationId,
      });
    }

    this.verses = loaded;
    this.currentIndex = 0;
    this.phase = 'preview';
    this.completedCount = 0;
    this.records = options?.initialRecords ?? [];
    this.abandoned = false;
    this.passageParams = { bookId, chapter, verseStart, verseEnd, translationId, learnerProfileId };
  }

  // ---- navigation ----

  nextVerse(): boolean {
    if (this.verses.length <= 1 || this.currentIndex >= this.verses.length - 1) return false;
    this.currentIndex++;
    this.phase = 'preview';
    return true;
  }

  prevVerse(): boolean {
    if (this.currentIndex <= 0) return false;
    this.currentIndex--;
    this.phase = 'preview';
    return true;
  }

  // ---- rating / scoring ----

  async rateCurrentVerse(rating: Rating): Promise<MemorizationRecord | null> {
    if (this.verses.length === 0 || this.phase === 'idle' || this.abandoned) return null;
    if (!this.passageParams) return null;

    const verse = this.verses[this.currentIndex];
    const recordKey = `${verse.bookId}:${verse.chapter}:${verse.verse}:${verse.translationId}`;

    // Load existing state if present, else new
    const existingRecord = this.records.find(r => r.id === recordKey);
    let priorState: FsrsState;
    if (existingRecord) {
      priorState = existingRecord.fsrsState;
    } else {
      priorState = await this.fsrsEngine.newState(0);
    }

    const review = await this.fsrsEngine.review(priorState, rating);

    const newRecord: MemorizationRecord = {
      id: recordKey,
      learnerProfileId: this.passageParams.learnerProfileId,
      bookId: verse.bookId,
      chapterNumber: verse.chapter,
      verseNumber: verse.verse,
      endVerse: this.passageParams.verseEnd,
      translationId: verse.translationId,
      bibleVerseReference: this.buildReference(verse),
      bibleVerseText: verse.text,
      verseTexts: this.verses.map(v => v.text),
      status: 'new',
      fsrsState: review.state,
      favorite: false,
      tags: [],
      createdAt: Date.now(),
      lastReviewedAt: Date.now(),
      nextReviewAt: review.due.getTime(),
      reviewCount: existingRecord ? (existingRecord.reviewCount + 1) : 1,
      totalReviewMinutes: 0,
      wordPerformance: [],
      targetId: recordKey,
      targetType: 'passage',
    };

    this.records.push(newRecord);
    this.completedCount++;
    this.phase = 'rated';
    return newRecord;
  }

  // ---- getters ----

  getCurrentVerseData(): VerseData | null {
    if (this.verses.length === 0) return null;
    return this.verses[this.currentIndex];
  }

  getProgress(): number {
    const total = this.verses.length;
    if (total === 0) return 0;
    return this.completedCount / total;
  }

  isComplete(): boolean {
    return this.completedCount >= this.verses.length && this.verses.length > 0;
  }

  getTotalVerses(): number {
    return this.verses.length;
  }

  getCurrentVerseIndex(): number {
    return this.currentIndex;
  }

  getPhase(): 'idle' | 'preview' | 'rated' {
    return this.phase;
  }

  getRecords(): MemorizationRecord[] {
    return this.records;
  }

  // ---- abandon ----

  abandon(): void {
    this.abandoned = true;
    this.phase = 'idle';
    this.records = [];
    this.completedCount = 0;
  }

  // ---- helpers ----

  private buildReference(verse: VerseData): string {
    if (!this.passageParams) return `${verse.verse}`;
    if (this.passageParams.verseStart === this.passageParams.verseEnd) {
      return `${verse.verse}`;
    }
    // Return only the individual verse number for each record
    return `${verse.verse}`;
  }
}

// =====================================================================
// Legacy SessionEngine (word-by-word progressive reveal)
// =====================================================================

/**
 * SessionEngine: manages the complete lifecycle of a memorization session.
 * Pure domain logic — zero UI dependencies.
 * Extended for passage support: revealNextVerse() navigates verse by verse.
 */
export class SessionEngine {
  private state: SessionState;
  private strategy: ExerciseStrategy;
  private maskingConfig: MaskingConfig;
  private wordFailureTracker: IWordFailureTracker;
  private targetId?: string;
  private targetType?: MemorizationTargetType;
  private currentVerseIndex: number = 0;
  private passageTexts?: string[];

  constructor(
    verseText: string,
    initialStrategy?: ExerciseStrategy,
    wordFailureTracker?: IWordFailureTracker,
  ) {
    this.state = {
      phase: 'idle',
      verseText,
      words: verseText.split(/\s+/).filter(w => w.length > 0),
      revealedWordIndices: new Set(),
      startedAt: Date.now(),
      durationSeconds: 0,
      wordsRevealed: 0,
      totalWords: 0,
    };
    this.strategy = initialStrategy || DEFAULT_MVP_STRATEGY;
    this.maskingConfig = {
      maskPercentage: 0,
      smartMasking: false,
      preservedWords: [],
      maskingOrder: 'progressive',
    };
    this.wordFailureTracker = wordFailureTracker;
  }

  /**
   * Initialize for passage mode — sets up verse-by-verse navigation
   */
  initPassage(verseTexts: string[], targetId?: string, targetType?: MemorizationTargetType): void {
    this.passageTexts = verseTexts;
    this.targetId = targetId;
    this.targetType = targetType;
    this.currentVerseIndex = 0;
    this.state.verseText = verseTexts[0];
    this.state.words = verseTexts[0].split(/\s+/).filter(w => w.length > 0);
    this.state.totalWords = this.state.words.length;
    this.state.revealedWordIndices = new Set();
    this.state.wordsRevealed = 0;
  }

  /**
   * REVEAL NEXT VERSE — navigate to the next verse in a passage
   * Resets word reveal state for the new verse
   */
  revealNextVerse(): boolean {
    if (!this.passageTexts || this.passageTexts.length <= 1) {
      this.revealNextWord();
      return false;
    }

    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal next verse from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    if (this.currentVerseIndex < this.passageTexts.length - 1) {
      this.currentVerseIndex++;
      this.state.verseText = this.passageTexts[this.currentVerseIndex];
      this.state.words = this.state.verseText.split(/\s+/).filter(w => w.length > 0);
      this.state.totalWords = this.state.words.length;
      this.state.revealedWordIndices = new Set();
      this.state.wordsRevealed = 0;
      return true;
    }

    return false;
  }

  /**
   * REVEAL PREVIOUS VERSE — navigate to the previous verse in a passage
   */
  revealPrevVerse(): boolean {
    if (!this.passageTexts || this.passageTexts.length <= 1) {
      this.revealNextWord();
      return false;
    }

    if (this.currentVerseIndex > 0) {
      this.currentVerseIndex--;
      this.state.verseText = this.passageTexts[this.currentVerseIndex];
      this.state.words = this.state.verseText.split(/\s+/).filter(w => w.length > 0);
      this.state.totalWords = this.state.words.length;
      this.state.revealedWordIndices = new Set();
      this.state.wordsRevealed = 0;
      this.state.phase = 'preview';
      return true;
    }

    return false;
  }

  /**
   * Change the exercise strategy during a session
   */
  setStrategy(strategy: ExerciseStrategy): void {
    this.strategy = strategy;
    this.state.revealedWordIndices.clear();
    this.state.wordsRevealed = 0;
    this.state.phase = 'preview';
  }

  /**
   * START preview phase — user sees full verse for 10 seconds
   */
  startPreview(): void {
    if (this.state.phase !== 'idle' && this.state.phase !== 'abandoned') {
      throw new Error(`SessionEngine: Cannot start preview from state ${this.state.phase}`);
    }

    this.state = {
      ...this.state,
      phase: 'preview',
      revealedWordIndices: new Set(),
      startedAt: Date.now(),
      wordsRevealed: 0,
      totalWords: this.state.words.length,
    };
  }

  /**
   * PROGRESSIVE REVEAL — reveal one word at a time (left-to-right)
   */
  revealNextWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal words from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    for (let i = 0; i < this.state.totalWords; i++) {
      if (!this.state.revealedWordIndices.has(i)) {
        this.state.revealedWordIndices.add(i);
        this.state.wordsRevealed++;
        break;
      }
    }
  }

  /**
   * TAP-TO-REVEAL — user taps specific word to reveal it
   */
  revealWordAt(index: number): void {
    if (this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal specific word from state ${this.state.phase}`);
    }

    if (index < 0 || index >= this.state.totalWords) {
      throw new Error(`SessionEngine: Invalid word index ${index}`);
    }

    if (!this.state.revealedWordIndices.has(index)) {
      this.state.revealedWordIndices.add(index);
      this.state.wordsRevealed++;
    }
  }

  /**
   * REVEAL SENTENCE — reveal by sentence segments
   */
  revealNextSentence(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal sentences from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    const sentenceEnds: number[] = [];
    for (let i = 0; i < this.state.verseText.length; i++) {
      const char = this.state.verseText[i];
      if (char === '.' || char === '!' || char === '?') {
        let j = i + 1;
        while (j < this.state.verseText.length && this.state.verseText[j] === ' ') {
          j++;
        }
        sentenceEnds.push(j - 1);
      }
    }

    let nextEnd = -1;
    for (const end of sentenceEnds) {
      const wordsUpToEnd = this.getWordsUpToPosition(end);
      if (wordsUpToEnd.every(wIndex => !this.state.revealedWordIndices.has(wIndex))) {
        nextEnd = end;
        break;
      }
    }

    if (nextEnd !== -1) {
      const wordsUpToNextEnd = this.getWordsUpToPosition(nextEnd);
      for (const wordIndex of wordsUpToNextEnd) {
        if (!this.state.revealedWordIndices.has(wordIndex)) {
          this.state.revealedWordIndices.add(wordIndex);
          this.state.wordsRevealed++;
        }
      }
    } else {
      this.revealNextWord();
    }
  }

  private getWordsUpToPosition(pos: number): number[] {
    const words: number[] = [];
    let wordStart = 0;
    let charPos = 0;

    for (let i = 0; i < this.state.verseText.length && charPos <= pos; i++) {
      const char = this.state.verseText[i];
      if (char === ' ') {
        if (i > wordStart && i <= pos + 1) {
          const wordText = this.state.verseText.slice(wordStart, i);
          const wordIndex = this.state.words.findIndex(w => w === wordText && w.length > 0);
          if (wordIndex !== -1 && !words.includes(wordIndex)) {
            words.push(wordIndex);
          }
        }
        wordStart = i + 1;
      }
      charPos++;
    }

    if (wordStart < this.state.verseText.length && charPos <= pos) {
      const wordText = this.state.verseText.slice(wordStart);
      const wordIndex = this.state.words.findIndex(w => w === wordText && w.length > 0);
      if (wordIndex !== -1 && !words.includes(wordIndex)) {
        words.push(wordIndex);
      }
    }

    return words;
  }

  /**
   * REVEAL RANDOM — reveal words in random order
   */
  revealNextRandomWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal random words from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';

    const unrevealedIndices: number[] = [];
    for (let i = 0; i < this.state.totalWords; i++) {
      if (!this.state.revealedWordIndices.has(i)) {
        unrevealedIndices.push(i);
      }
    }

    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      this.state.revealedWordIndices.add(randomIndex);
      this.state.wordsRevealed++;
    }
  }

  /**
   * REVEAL BY DIFFICULTY
   */
  revealNextDifficultyWord(): void {
    if (this.state.phase !== 'preview' && this.state.phase !== 'revealing') {
      throw new Error(`SessionEngine: Cannot reveal by difficulty from state ${this.state.phase}`);
    }

    this.state.phase = 'revealing';
    this.revealNextWord();
  }

  /**
   * VERIFY answer
   */
  verifyAnswer(userInput: string): VerificationResult {
    const comparisonEngine = new ComparisonEngine();
    return comparisonEngine.compare(userInput, this.state.verseText);
  }

  /**
   * Validate session completeness
   */
  isComplete(): boolean {
    return this.state.revealedWordIndices.size >= this.state.totalWords;
  }

  /**
   * Get session progress (0-1)
   */
  getProgress(): number {
    return this.state.totalWords > 0
      ? this.state.wordsRevealed / this.state.totalWords
      : 0;
  }

  /**
   * END session and calculate final rating
   */
  endSession(complete: boolean): { rating: Rating; progress: number } {
    const progress = this.getProgress();
    let rating: Rating;

    if (!complete) {
      rating = Rating.AGAIN;
      this.state.phase = 'abandoned';
    } else if (progress >= 0.9) {
      rating = Rating.EASY;
      this.state.phase = 'confirmed';
    } else if (progress >= 0.6) {
      rating = Rating.GOOD;
      this.state.phase = 'confirmed';
    } else if (progress >= 0.3) {
      rating = Rating.HARD;
      this.state.phase = 'confirmed';
    } else {
      rating = Rating.AGAIN;
      this.state.phase = 'confirmed';
    }

    this.state.durationSeconds = Math.round((Date.now() - this.state.startedAt) / 1000);
    return { rating, progress };
  }

  /**
   * Reset session for retry
   */
  resetSession(): void {
    this.state.revealedWordIndices.clear();
    this.state.wordsRevealed = 0;
    this.state.phase = 'preview';
    this.state.startedAt = Date.now();
    this.wordFailureTracker?.clear();
  }

  /**
   * Record word failures based on verification result
   */
  recordWordFailures(verification: VerificationResult, now: number): void {
    for (const word of verification.missingWords) {
      const wordIndex = this.state.words.findIndex(w => w.toLowerCase() === word.toLowerCase());
      if (wordIndex !== -1) {
        this.wordFailureTracker?.recordFailure(word, wordIndex, now);
      }
    }

    for (const sub of verification.substitutedWords) {
      const wordIndex = this.state.words.findIndex(w => w.toLowerCase() === sub.expected.toLowerCase());
      if (wordIndex !== -1) {
        this.wordFailureTracker?.recordFailure(sub.expected, wordIndex, now);
      }
    }
  }

  /**
   * Get the most forgotten words for this session
   */
  getMostForgottenWords(count: number = 3): Array<{ word: string; failCount: number; lastFailedAt: number; position: number }> {
    return this.wordFailureTracker?.getMostForgottenWords(count) ?? [];
  }

  /**
   * Check if a word is frequently forgotten
   */
  isWordForgotten(word: string, threshold: number = 2): boolean {
    return (this.wordFailureTracker?.getFailureRate(word) ?? 0) >= threshold;
  }

  // ====================
  // Passage-specific getters
  // ====================

  getCurrentVerseIndex(): number {
    return this.currentVerseIndex;
  }

  getTotalVerses(): number {
    return this.passageTexts?.length ?? 1;
  }

  isPassage(): boolean {
    return this.targetType === 'passage';
  }

  getTargetId(): string | undefined {
    return this.targetId;
  }

  getTargetType(): MemorizationTargetType | undefined {
    return this.targetType;
  }

  getState(): SessionState {
    return this.state;
  }
}
