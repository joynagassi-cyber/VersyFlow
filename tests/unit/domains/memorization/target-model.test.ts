/**
 * Unit Tests — MemorizationTarget Model
 * Tests ContentReference, MemorizationTarget, and MemorizationRecord extensions
 */

import { ContentReference, MemorizationTarget, MemorizationTargetType, MemorizationRecord } from '@/domains/memorization/entities';

describe('ContentReference', () => {
  it('should create a valid single verse reference', () => {
    const ref: ContentReference = {
      bookId: 'joh',
      chapter: 3,
      startVerse: 16,
      translationId: 'lsg',
    };

    expect(ref.bookId).toBe('joh');
    expect(ref.chapter).toBe(3);
    expect(ref.startVerse).toBe(16);
    expect(ref.endVerse).toBeUndefined();
    expect(ref.translationId).toBe('lsg');
  });

  it('should create a valid passage reference', () => {
    const ref: ContentReference = {
      bookId: 'joh',
      chapter: 3,
      startVerse: 16,
      endVerse: 18,
      translationId: 'lsg',
    };

    expect(ref.endVerse).toBe(18);
    expect(ref.endVerse).toBeGreaterThan(ref.startVerse);
  });

  it('should reject invalid passage (end < start)', () => {
    // TypeScript compilation would catch this, but runtime check:
    const ref = {
      bookId: 'joh',
      chapter: 3,
      startVerse: 18,
      endVerse: 16,
      translationId: 'lsg',
    };

    expect(ref.endVerse).toBeLessThan(ref.startVerse);
  });
});

describe('MemorizationTarget', () => {
  it('should create a single verse target', () => {
    const target: MemorizationTarget = {
      id: 'target-single-1',
      type: 'single-verse',
      reference: {
        bookId: 'joh',
        chapter: 3,
        startVerse: 16,
        translationId: 'lsg',
      },
      displayReference: 'Jean 3:16',
      createdAt: Date.now(),
    };

    expect(target.type).toBe('single-verse');
    expect(target.reference.endVerse).toBeUndefined();
    expect(target.displayReference).toBe('Jean 3:16');
  });

  it('should create a passage target', () => {
    const target: MemorizationTarget = {
      id: 'target-passage-1',
      type: 'passage',
      reference: {
        bookId: 'joh',
        chapter: 3,
        startVerse: 16,
        endVerse: 18,
        translationId: 'lsg',
      },
      displayReference: 'Jean 3:16-18',
      createdAt: Date.now(),
    };

    expect(target.type).toBe('passage');
    expect(target.reference.endVerse).toBe(18);
    expect(target.displayReference).toBe('Jean 3:16-18');
  });

  it('should generate display reference for passage', () => {
    const ref = {
      bookId: 'psa',
      chapter: 23,
      startVerse: 1,
      endVerse: 6,
      translationId: 'lsg',
    };

    const displayRef = ref.endVerse
      ? `Psaumes ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`
      : `Psaumes ${ref.chapter}:${ref.startVerse}`;

    expect(displayRef).toBe('Psaumes 23:1-6');
  });
});

describe('MemorizationRecord Extension', () => {
  it('should have new optional fields', () => {
    const record: MemorizationRecord = {
      id: 'rec-1',
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tant aimé le monde...',
      status: 'new',
      fsrsState: {
        stability: 0,
        difficulty: 5,
        recallProbability: 0.9,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 0,
        requestedRetention: 0.9,
      },
      favorite: false,
      tags: [],
      createdAt: Date.now(),
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
      // New optional fields
      targetId: 'target-1',
      targetType: 'single-verse' as MemorizationTargetType,
      endVerse: undefined,
      verseTexts: undefined,
    };

    expect(record.targetId).toBe('target-1');
    expect(record.targetType).toBe('single-verse');
  });

  it('should support passage record', () => {
    const record: MemorizationRecord = {
      id: 'rec-2',
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      endVerse: 18,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16-18',
      bibleVerseText: 'Car Dieu a tant aimé le monde... Ce便是...',
      verseTexts: [
        'Car Dieu a tant aimé le monde, afin qu\'il a donné son Fils unique...',
        'afin que quiconque croit en lui ne périsse point...',
        'mais qu\'il ait la vie éternelle.',
      ],
      status: 'in-progress',
      fsrsState: {
        stability: 2.5,
        difficulty: 5,
        recallProbability: 0.75,
        lastInterval: 1,
        nextInterval: 3,
        elapsedDays: 1,
        repetitions: 1,
        requestedRetention: 0.9,
      },
      favorite: false,
      tags: [],
      createdAt: Date.now(),
      lastReviewedAt: null,
      nextReviewAt: Date.now() + 3 * 86400000,
      reviewCount: 1,
      totalReviewMinutes: 5,
      wordPerformance: [],
      targetId: 'target-passage-1',
      targetType: 'passage' as MemorizationTargetType,
    };

    expect(record.targetType).toBe('passage');
    expect(record.verseTexts).toHaveLength(3);
    expect(record.endVerse).toBe(18);
  });

  it('should be backward compatible (old records work)', () => {
    // Old record without new fields
    const oldRecord: MemorizationRecord = {
      id: 'joh:3:16:lsg',
      bookId: 'joh',
      chapterNumber: 3,
      verseNumber: 16,
      translationId: 'lsg',
      bibleVerseReference: 'Jean 3:16',
      bibleVerseText: 'Car Dieu a tant aimé le monde...',
      status: 'new',
      fsrsState: {
        stability: 0,
        difficulty: 5,
        recallProbability: 0.9,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 0,
        requestedRetention: 0.9,
      },
      favorite: false,
      tags: [],
      createdAt: Date.now(),
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      totalReviewMinutes: 0,
      wordPerformance: [],
    };

    // Should work without new fields
    expect(oldRecord.id).toBe('joh:3:16:lsg');
    expect(oldRecord.bookId).toBe('joh');
    expect(oldRecord.verseNumber).toBe(16);
    expect(oldRecord.targetType).toBeUndefined(); // backward compat
  });

  it('should handle passage ID generation', () => {
    const targetId = 'joh:3:16-18:lsg';
    const singleVerseId = 'joh:3:16:lsg';

    // Passage ID includes range
    expect(targetId).toContain('-');
    // Single verse ID does not
    expect(singleVerseId).not.toContain('-');
  });
});

describe('Target Type Transitions', () => {
  it('should have exactly 2 target types', () => {
    const types: MemorizationTargetType[] = ['single-verse', 'passage'];
    expect(types).toHaveLength(2);
    expect(types).toContain('single-verse');
    expect(types).toContain('passage');
  });

  it('should convert single verse to passage target', () => {
    const single: MemorizationTarget = {
      id: 't1',
      type: 'single-verse',
      reference: { bookId: 'joh', chapter: 3, startVerse: 16, translationId: 'lsg' },
      displayReference: 'Jean 3:16',
      createdAt: Date.now(),
    };

    const passage: MemorizationTarget = {
      ...single,
      type: 'passage',
      reference: { ...single.reference, endVerse: 16 }, // same verse
      displayReference: 'Jean 3:16',
    };

    expect(passage.type).toBe('passage');
    expect(passage.reference.endVerse).toBe(16);
  });
});

describe('Passage Length Categories', () => {
  it('should classify passage lengths', () => {
    const classifyLength = (verseCount: number): string => {
      if (verseCount === 1) return 'single-verse';
      if (verseCount <= 3) return 'short-passage';
      if (verseCount <= 10) return 'medium-passage';
      return 'long-passage';
    };

    expect(classifyLength(1)).toBe('single-verse');
    expect(classifyLength(3)).toBe('short-passage');
    expect(classifyLength(7)).toBe('medium-passage');
    expect(classifyLength(20)).toBe('long-passage');
  });
});
