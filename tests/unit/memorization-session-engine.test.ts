/**
 * Unit Tests — MemorizationSessionEngine (passage memorization feature)
 * Tests PAS-ENG-001 through PAS-ENG-010
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemorizationSessionEngine, type VerseData, type PassageTargetParams } from '@/domains/memorization/session-engine';
import type { ILocalBibleRepository, BibleVerseData } from '@/domains/bible/repository-local';
import type { IFsrsEngine, FsrsState, FsrsReview } from '@/domains/fsrs/engine';
import { Rating } from '@/domains/fsrs/engine';

// =====================================================================
// Test doubles
// =====================================================================

/** Deterministic FSRS mock */
function makeMockFsrsEngine(opts?: {
  newStability?: number;
  reviewStabilityDelta?: number;
}): { engine: IFsrsEngine; calls: Array<{ state: FsrsState; rating: Rating }> } {
  const calls: Array<{ state: FsrsState; rating: Rating }> = [];
  const baseState: FsrsState = {
    stability: opts?.newStability ?? 1.0,
    difficulty: 5.0,
    recallProbability: 0.85,
    lastInterval: 0,
    nextInterval: 1,
    elapsedDays: 0,
    repetitions: 0,
    requestedRetention: 0.9,
  };

  return {
    engine: {
      newState: vi.fn(async () => baseState),
      currentState: vi.fn((s: FsrsState) => s),
      review: vi.fn(async (state: FsrsState, rating: Rating) => {
        calls.push({ state, rating });
        return {
          state: { ...state, stability: state.stability + (opts?.reviewStabilityDelta ?? 2.0), repetitions: state.repetitions + 1 },
          due: new Date(Date.now() + 86400000),
          stability: state.stability + (opts?.reviewStabilityDelta ?? 2.0),
          scheduledDays: 1,
          recurring: true,
        } as FsrsReview;
      }),
      explain: vi.fn(() => ({})),
      getDueItems: vi.fn(() => []),
    } as unknown as IFsrsEngine,
    calls,
  };
}

/** In-memory bible repo with a small Johannine dataset */
function makeBibleRepo(dataset: Record<string, BibleVerseData[]>): ILocalBibleRepository {
  return {
    getBooks: vi.fn(async () => []),
    getBook: vi.fn(async () => null),
    getChapter: vi.fn(async () => null),
    getVerse: vi.fn(async (translationId: string, _bookId: string, _chapter: number, verseNumber: number) => {
      const verses = dataset[translationId];
      return verses?.find(v => v.number === verseNumber) ?? null;
    }),
    getChapterVerses: vi.fn(async (translationId: string) => dataset[translationId] ?? []),
    getVerseCount: vi.fn(async () => 0),
  } as unknown as ILocalBibleRepository;
}

const JOH3_LSG: BibleVerseData[] = [
  { number: 16, text: 'Car Dieu a tant aime le monde qu il a donne son Fils unique' },
  { number: 17, text: 'Parce que Dieu a envoyer son Fils dans le monde' },
  { number: 18, text: 'Celui qui croit en lui n est pas jude' },
];

const JOH3_NVS: BibleVerseData[] = [
  { number: 16, text: 'For God so loved the world that he gave his one and only Son' },
  { number: 17, text: 'For God did not send his Son into the world' },
  { number: 18, text: 'Whoever believes in him is not condemned' },
];

// =====================================================================
// Tests
// =====================================================================

describe('MemorizationSessionEngine', () => {
  let bibleRepo: ILocalBibleRepository;
  let fsrs: ReturnType<typeof makeMockFsrsEngine>;
  let engine: MemorizationSessionEngine;
  let params: PassageTargetParams;

  beforeEach(() => {
    bibleRepo = makeBibleRepo({ lsg: JOH3_LSG, nvs: JOH3_NVS });
    fsrs = makeMockFsrsEngine();
    engine = new MemorizationSessionEngine(bibleRepo, fsrs.engine);
    params = {
      bookId: 'joh',
      chapter: 3,
      verseStart: 16,
      verseEnd: 18,
      translationId: 'lsg',
      learnerProfileId: 'profile-1',
    };
  });

  // PAS-ENG-001: startPassage loads all verses correctly
  it('startPassage should load all verses from the bible repo', async () => {
    await engine.startPassage(params);

    expect(engine.getTotalVerses()).toBe(3);
    expect(engine.getPhase()).toBe('preview');
    expect(engine.getCurrentVerseIndex()).toBe(0);

    const first = engine.getCurrentVerseData();
    expect(first).not.toBeNull();
    expect(first!.text).toBe(JOH3_LSG[0].text);
    expect(first!.bookId).toBe('joh');
    expect(first!.verse).toBe(16);
    expect(first!.translationId).toBe('lsg');
  });

  // PAS-ENG-002: nextVerse advances index
  it('nextVerse should advance to the next verse', async () => {
    await engine.startPassage(params);
    expect(engine.getCurrentVerseIndex()).toBe(0);

    const moved = engine.nextVerse();
    expect(moved).toBe(true);
    expect(engine.getCurrentVerseIndex()).toBe(1);

    const verse = engine.getCurrentVerseData()!;
    expect(verse.verse).toBe(17);
  });

  // PAS-ENG-003: prevVerse goes back
  it('prevVerse should go back to previous verse', async () => {
    await engine.startPassage(params);
    engine.nextVerse();
    engine.nextVerse();
    expect(engine.getCurrentVerseIndex()).toBe(2);

    const moved = engine.prevVerse();
    expect(moved).toBe(true);
    expect(engine.getCurrentVerseIndex()).toBe(1);
  });

  // PAS-ENG-004: boundary guards prevent over-navigation
  it('nextVerse at end should return false', async () => {
    await engine.startPassage(params);
    engine.nextVerse();
    engine.nextVerse();
    expect(engine.getCurrentVerseIndex()).toBe(2);

    expect(engine.nextVerse()).toBe(false);
    expect(engine.getCurrentVerseIndex()).toBe(2);
  });

  it('prevVerse at start should return false', async () => {
    await engine.startPassage(params);
    expect(engine.prevVerse()).toBe(false);
    expect(engine.getCurrentVerseIndex()).toBe(0);
  });

  // PAS-ENG-005: rateCurrentVerse calls FSRS and builds a record
  it('rateCurrentVerse should call FSRS review with correct state and rating', async () => {
    await engine.startPassage(params);
    await engine.rateCurrentVerse(Rating.GOOD);

    expect(fsrs.calls).toHaveLength(1);
    expect(fsrs.calls[0].rating).toBe(Rating.GOOD);
    expect(engine.getPhase()).toBe('rated');
  });

  // PAS-ENG-006: progress goes from 0 to 1 over rated verses
  it('getProgress should increase as verses are rated', async () => {
    await engine.startPassage(params);
    expect(engine.getProgress()).toBeCloseTo(0, 4);

    await engine.rateCurrentVerse(Rating.GOOD);
    expect(engine.getProgress()).toBeCloseTo(1 / 3, 4);

    engine.nextVerse();
    await engine.rateCurrentVerse(Rating.HARD);
    expect(engine.getProgress()).toBeCloseTo(2 / 3, 4);

    engine.nextVerse();
    await engine.rateCurrentVerse(Rating.EASY);
    expect(engine.getProgress()).toBeCloseTo(1, 4);
  });

  // PAS-ENG-007: isComplete reflects rated count
  it('isComplete should be true after all verses are rated', async () => {
    await engine.startPassage(params);
    expect(engine.isComplete()).toBe(false);

    await engine.rateCurrentVerse(Rating.GOOD);
    expect(engine.isComplete()).toBe(false);

    engine.nextVerse();
    await engine.rateCurrentVerse(Rating.HARD);
    expect(engine.isComplete()).toBe(false);

    engine.nextVerse();
    await engine.rateCurrentVerse(Rating.EASY);
    expect(engine.isComplete()).toBe(true);
  });

  // PAS-ENG-008: translation independence — different text for different translation
  it('should load different verse texts for different translations', async () => {
    const nvsParams: PassageTargetParams = {
      ...params,
      translationId: 'nvs',
    };
    await engine.startPassage(nvsParams);

    const verse = engine.getCurrentVerseData()!;
    expect(verse.text).toBe(JOH3_NVS[0].text);
    expect(verse.translationId).toBe('nvs');

    // Verify translationId is carried into the record when rated
    await engine.rateCurrentVerse(Rating.GOOD);
    expect(engine.getRecords()[0]?.translationId).toBe('nvs');
  });

  // PAS-ENG-009: abandon resets state
  it('abandon should reset completedCount and records', async () => {
    await engine.startPassage(params);
    await engine.rateCurrentVerse(Rating.GOOD);
    expect(engine.getProgress()).toBeCloseTo(1 / 3, 4);

    engine.abandon();
    expect(engine.getPhase()).toBe('idle');
    expect(engine.isComplete()).toBe(false);
    expect(engine.getProgress()).toBe(0);
    expect(engine.getRecords()).toHaveLength(0);
  });

  // PAS-ENG-010: missing verse throws an error
  it('startPassage should throw when a verse is missing from the source', async () => {
    const missingRepo = makeBibleRepo({ lsg: [JOH3_LSG[0], JOH3_LSG[2]] }); // verse 17 missing
    const badEngine = new MemorizationSessionEngine(missingRepo, fsrs.engine);

    await expect(badEngine.startPassage(params)).rejects.toThrow(/Verse 17 not found/);
  });

  // PAS-ENG-011: translation history persistence — switching translation keeps prior records
  it('should preserve records when switching translation (translation history)', async () => {
    // Start with LSG and rate verse 16
    await engine.startPassage(params);
    await engine.rateCurrentVerse(Rating.GOOD);
    expect(engine.getRecords()).toHaveLength(1);
    expect(engine.getRecords()[0].translationId).toBe('lsg');
    expect(engine.getRecords()[0].verseNumber).toBe(16);
    expect(engine.getRecords()[0].bibleVerseReference).toBe('16');

    // Now start a NEW passage with NVS translation, passing LSG records as initialRecords
    const nvsParams: PassageTargetParams = {
      ...params,
      translationId: 'nvs',
    };
    const lsgRecords = engine.getRecords();

    const engine2 = new MemorizationSessionEngine(bibleRepo, fsrs.engine);
    await engine2.startPassage(nvsParams, { initialRecords: lsgRecords });

    // LSG record should be preserved
    expect(engine2.getRecords()).toHaveLength(1);
    expect(engine2.getRecords()[0].translationId).toBe('lsg');

    // Rate a verse in NVS
    await engine2.rateCurrentVerse(Rating.EASY);
    expect(engine2.getRecords()).toHaveLength(2);

    // Both translations should have their own records
    const translations = engine2.getRecords().map(r => r.translationId);
    expect(translations).toContain('lsg');
    expect(translations).toContain('nvs');
  });
});
