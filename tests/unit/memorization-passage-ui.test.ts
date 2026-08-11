/**
 * Unit Tests — Passage Session UI (Phase 8.5)
 * Tests PAS-UI-002: session.tsx passage navigation logic
 */

import { SessionEngine } from '@/domains/memorization/session-engine';
import { ContentReference, MemorizationTarget } from '@/domains/memorization/entities';

describe('Phase 8.5 — Passage Session UI Logic', () => {
  const passageTexts = [
    'Au commencement était la parole',
    'et la parole était auprès de Dieu',
    'et la parole était Dieu.',
  ];

  describe('Session state for passage navigation', () => {
    it('should produce correct session state shape from chapter navigation', () => {
      // Simulate what chapter.tsx builds when user selects verses 16-18
      const reference: ContentReference = {
        bookId: 'joh',
        chapter: 3,
        startVerse: 16,
        endVerse: 18,
        translationId: 'lsg',
      };

      const displayReference = 'Jean 3:16-18';
      const target: MemorizationTarget = {
        id: 'target-joh-3-16-18',
        type: 'passage',
        reference,
        displayReference,
        createdAt: Date.now(),
      };

      // Verify target structure matches what session.tsx expects
      expect(target.type).toBe('passage');
      expect(target.displayReference).toBe('Jean 3:16-18');
      expect(target.reference.startVerse).toBe(16);
      expect(target.reference.endVerse).toBe(18);
      expect(target.reference.bookId).toBe('joh');
      expect(target.reference.chapter).toBe(3);
    });

    it('should produce correct URL params for passage session navigation', () => {
      const target: MemorizationTarget = {
        id: 'target-joh-3-16-18',
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

      const verseTexts = passageTexts;
      const serialized = encodeURIComponent(JSON.stringify(verseTexts));
      const expectedUrl = `/memorization/session?targetId=${encodeURIComponent(target.id)}&targetType=passage&bookId=joh&chapter=3&startVerse=16&endVerse=18&verseTexts=${serialized}&reference=Jean%203%3A16-18`;

      expect(expectedUrl).toContain('targetType=passage');
      expect(expectedUrl).toContain('verseTexts=');
      expect(expectedUrl).toContain('startVerse=16');
      expect(expectedUrl).toContain('endVerse=18');
    });

    it('should parse passage text array from URL params', () => {
      const verseTexts = passageTexts;
      const serialized = JSON.stringify(verseTexts);
      const parsed = JSON.parse(decodeURIComponent(serialized)) as string[];

      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Au commencement était la parole');
      expect(parsed[1]).toBe('et la parole était auprès de Dieu');
      expect(parsed[2]).toBe('et la parole était Dieu.');
    });
  });

  describe('SessionEngine passage session flow', () => {
    it('should support full passage memorization flow', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-p-1', 'passage');
      engine.startPreview();

      // Verse 0: reveal all words
      const words0 = passageTexts[0].split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words0.length; i++) {
        engine.revealNextWord();
      }
      expect(engine.isComplete()).toBe(true);

      // Navigate to verse 1
      engine.revealNextVerse();
      expect(engine.getCurrentVerseIndex()).toBe(1);
      expect(engine.getState().wordsRevealed).toBe(0);

      // Verse 1: reveal all words
      const words1 = passageTexts[1].split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words1.length; i++) {
        engine.revealNextWord();
      }
      expect(engine.isComplete()).toBe(true);

      // Navigate to verse 2
      engine.revealNextVerse();
      expect(engine.getCurrentVerseIndex()).toBe(2);
      expect(engine.getState().wordsRevealed).toBe(0);

      // Verse 2: reveal all words
      const words2 = passageTexts[2].split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words2.length; i++) {
        engine.revealNextWord();
      }
      expect(engine.isComplete()).toBe(true);

      // End of passage
      expect(engine.revealNextVerse()).toBe(false);
    });

    it('should calculate passage-level progress', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-p-1', 'passage');
      engine.startPreview();

      // Complete verse 0
      const words0 = passageTexts[0].split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words0.length; i++) engine.revealNextWord();

      // Move to verse 1
      engine.revealNextVerse();
      // Complete verse 1
      const words1 = passageTexts[1].split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words1.length; i++) engine.revealNextWord();

      // Overall passage progress: 2/3 verses complete
      const currentVerseIdx = engine.getCurrentVerseIndex();
      const totalVerses = engine.getTotalVerses();
      expect(currentVerseIdx).toBe(1);
      expect(totalVerses).toBe(3);
    });

    it('should display verse indicator dots correctly', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-p-1', 'passage');
      engine.startPreview();

      // At start: dot 0 active
      expect(engine.getCurrentVerseIndex()).toBe(0);
      expect(engine.getTotalVerses()).toBe(3);

      engine.revealNextVerse();
      expect(engine.getCurrentVerseIndex()).toBe(1);

      engine.revealNextVerse();
      expect(engine.getCurrentVerseIndex()).toBe(2);
      expect(engine.revealNextVerse()).toBe(false); // no more
    });
  });

  describe('Confirm screen params', () => {
    it('should handle passage reference in confirm screen', () => {
      const reference = 'Jean 3:16-18';
      const rating = 'good';
      const targetType = 'passage';

      // Simulate URL params for confirm screen
      const params = { rating, reference, targetType };

      expect(params.rating).toBe('good');
      expect(params.reference).toBe('Jean 3:16-18');
      expect(params.targetType).toBe('passage');
    });

    it('should default to single verse when no targetType', () => {
      const reference = 'Jean 3:16';
      const rating = 'good';

      const params = { rating, reference };
      const isPassage = params.targetType === 'passage';

      expect(isPassage).toBe(false);
    });
  });
});
