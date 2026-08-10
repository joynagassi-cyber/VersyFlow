/**
 * Unit Tests — SessionEngine Passage Support (Phase 8.4)
 * Tests PAS-SE-001: revealNextVerse(), revealPrevVerse(), initPassage()
 */

import { SessionEngine } from '@/domains/memorization/session-engine';
import { MemorizationTargetType } from '@/domains/memorization/entities';

describe('SessionEngine — Passage Support', () => {
  const passageTexts = [
    'Au commencement était la parole',
    'et la parole était auprès de Dieu',
    'et la parole était Dieu.',
  ];

  describe('initPassage()', () => {
    it('should initialize passage with first verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-123', 'passage');

      expect(engine.isPassage()).toBe(true);
      expect(engine.getTargetId()).toBe('target-123');
      expect(engine.getTargetType()).toBe('passage');
      expect(engine.getTotalVerses()).toBe(3);
      expect(engine.getCurrentVerseIndex()).toBe(0);
    });

    it('should start with first verse text and words', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-456', 'passage');
      engine.startPreview();

      const state = engine.getState();
      expect(state.verseText).toBe(passageTexts[0]);
      expect(state.words.length).toBeGreaterThan(0);
      expect(state.totalWords).toBe(state.words.length);
    });

    it('should work as single verse when no passage texts set', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.startPreview();

      expect(engine.isPassage()).toBe(false);
      expect(engine.getTargetId()).toBeUndefined();
      expect(engine.getTotalVerses()).toBe(1);
    });
  });

  describe('revealNextVerse()', () => {
    it('should move to next verse in passage', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      const moved = engine.revealNextVerse();
      expect(moved).toBe(true);
      expect(engine.getCurrentVerseIndex()).toBe(1);
      expect(engine.getState().verseText).toBe(passageTexts[1]);
    });

    it('should return false when already at last verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      engine.revealNextVerse(); // verse 0 -> 1
      engine.revealNextVerse(); // verse 1 -> 2
      const moved = engine.revealNextVerse(); // verse 2 -> should return false
      expect(moved).toBe(false);
      expect(engine.getCurrentVerseIndex()).toBe(2);
    });

    it('should reset word reveal state when moving to next verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      // Reveal some words in first verse
      engine.revealNextWord();
      engine.revealNextWord();
      expect(engine.getState().wordsRevealed).toBe(2);

      // Move to next verse
      engine.revealNextVerse();
      expect(engine.getState().wordsRevealed).toBe(0);
      expect(engine.getState().verseText).toBe(passageTexts[1]);
    });

    it('should fall back to revealNextWord for single verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.startPreview();

      const moved = engine.revealNextVerse();
      expect(moved).toBe(false);
      expect(engine.getState().phase).toBe('revealing');
    });
  });

  describe('revealPrevVerse()', () => {
    it('should move to previous verse in passage', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      engine.revealNextVerse();
      engine.revealNextVerse();
      expect(engine.getCurrentVerseIndex()).toBe(2);

      const moved = engine.revealPrevVerse();
      expect(moved).toBe(true);
      expect(engine.getCurrentVerseIndex()).toBe(1);
      expect(engine.getState().verseText).toBe(passageTexts[1]);
    });

    it('should return false when at first verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      const moved = engine.revealPrevVerse();
      expect(moved).toBe(false);
      expect(engine.getCurrentVerseIndex()).toBe(0);
    });

    it('should reset phase to preview when going back', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      engine.revealNextVerse();
      engine.revealNextWord();
      expect(engine.getState().phase).toBe('revealing');

      engine.revealPrevVerse();
      expect(engine.getState().phase).toBe('preview');
    });
  });

  describe('verse word management', () => {
    it('should split each verse into words correctly', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      const firstVerseWords = passageTexts[0].split(/\s+/).filter(w => w.length > 0);
      expect(engine.getState().words).toEqual(firstVerseWords);
      expect(engine.getState().totalWords).toBe(firstVerseWords.length);

      // Move to second verse
      engine.revealNextVerse();
      const secondVerseWords = passageTexts[1].split(/\s+/).filter(w => w.length > 0);
      expect(engine.getState().words).toEqual(secondVerseWords);
      expect(engine.getState().totalWords).toBe(secondVerseWords.length);
    });

    it('should maintain word reveal state per verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      // Reveal words in verse 0
      engine.revealNextWord();
      engine.revealNextWord();
      expect(engine.getState().wordsRevealed).toBe(2);

      // Move to verse 1
      engine.revealNextVerse();
      expect(engine.getState().wordsRevealed).toBe(0);

      // Go back to verse 0 — should also be reset
      engine.revealPrevVerse();
      expect(engine.getState().wordsRevealed).toBe(0);
    });
  });

  describe('progress and completion', () => {
    it('should calculate progress per verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      const totalWords = engine.getState().totalWords;
      engine.revealNextWord();
      engine.revealNextWord();

      const progress = engine.getProgress();
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
      expect(progress).toBeCloseTo(2 / totalWords, 0.1);
    });

    it('should be complete when all words revealed in current verse', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-1', 'passage');
      engine.startPreview();

      const totalWords = engine.getState().totalWords;
      for (let i = 0; i < totalWords; i++) {
        engine.revealNextWord();
      }

      expect(engine.isComplete()).toBe(true);
    });
  });

  describe('state getters', () => {
    it('should return correct state', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'target-p-1', 'passage');
      engine.startPreview();
      engine.revealNextVerse();

      const state = engine.getState();
      // revealNextVerse sets phase to 'revealing'
      expect(state.verseText).toBe(passageTexts[1]);
      expect(state.totalWords).toBe(passageTexts[1].split(/\s+/).filter(w => w.length > 0).length);
    });

    it('should handle targetId and targetType correctly', () => {
      const engine = new SessionEngine(passageTexts[0]);
      engine.initPassage(passageTexts, 'unique-target-id', 'passage');

      expect(engine.getTargetId()).toBe('unique-target-id');
      expect(engine.getTargetType()).toBe('passage');
      expect(engine.isPassage()).toBe(true);
    });
  });
});
