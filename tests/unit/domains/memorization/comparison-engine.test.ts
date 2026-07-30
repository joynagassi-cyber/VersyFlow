/**
 * Tests pour ComparisonEngine
 * Vérifie chaque étape de l'algorithme de comparaison selon docs/22-comparison-engine-spec.md
 */

import { ComparisonEngine, VerificationResult } from '@/domains/memorization/comparison-engine';

describe('ComparisonEngine', () => {
  let engine: ComparisonEngine;

  beforeEach(() => {
    engine = new ComparisonEngine();
  });

  describe('Normalisation', () => {
    it('should normalize text to lowercase and trim', () => {
      const result = engine.normalize('  HELLO WORLD!  ');
      expect(result).toBe('hello world');
    });

    it('should remove punctuation and normalize whitespace', () => {
      const result = engine.normalize('Hello,   world!!! How are you?');
      expect(result).toBe('hello world how are you');
    });

    it('should handle empty string', () => {
      const result = engine.normalize('');
      expect(result).toBe('');
    });
  });

  describe('Tokenisation', () => {
    it('should split string into words', () => {
      const result = engine.tokenize('hello world test');
      expect(result).toEqual(['hello', 'world', 'test']);
    });

    it('should filter empty strings', () => {
      const result = engine.tokenize('hello  world   test');
      expect(result).toEqual(['hello', 'world', 'test']);
    });

    it('should handle empty string', () => {
      const result = engine.tokenize('');
      expect(result).toEqual([]);
    });
  });

  describe('Alignement de mots', () => {
    it('should detect perfect match', () => {
      const expected = ['hello', 'world', 'test'];
      const provided = ['hello', 'world', 'test'];
      const alignment = engine.alignWords(expected, provided);

      expect(alignment.correct).toEqual([
        { position: 0, word: 'hello' },
        { position: 1, word: 'world' },
        { position: 2, word: 'test' },
      ]);
      expect(alignment.missing).toEqual([]);
      expect(alignment.extra).toEqual([]);
      expect(alignment.substituted).toEqual([]);
      expect(alignment.transpositions).toEqual([]);
    });

    it('should detect missing words', () => {
      const expected = ['hello', 'world', 'test'];
      const provided = ['hello', 'test'];
      const alignment = engine.alignWords(expected, provided);

      expect(alignment.correct).toEqual([
        { position: 0, word: 'hello' },
      ]);
      expect(alignment.missing).toEqual([
        { position: 1, word: 'world' },
        { position: 2, word: 'test' },
      ]);
      expect(alignment.extra).toEqual([]);
    });

    it('should detect extra words', () => {
      const expected = ['hello', 'world'];
      const provided = ['hello', 'test', 'world', 'foo'];
      const alignment = engine.alignWords(expected, provided);

      expect(alignment.correct).toEqual([
        { position: 0, word: 'hello' },
        { position: 1, word: 'world' },
      ]);
      expect(alignment.missing).toEqual([]);
      expect(alignment.extra).toEqual([
        { position: 2, word: 'test' },
        { position: 3, word: 'foo' },
      ]);
    });

    it('should detect substitutions', () => {
      const expected = ['hello', 'world', 'test'];
      const provided = ['hello', 'universe', 'test'];
      const alignment = engine.alignWords(expected, provided);

      expect(alignment.correct).toEqual([
        { position: 0, word: 'hello' },
        { position: 2, word: 'test' },
      ]);
      expect(alignment.substituted).toEqual([
        { position: 1, expected: 'world', got: 'universe' },
      ]);
    });

    it('should detect transpositions', () => {
      const expected = ['hello', 'world', 'test'];
      const provided = ['world', 'hello', 'test'];
      const alignment = engine.alignWords(expected, provided);

      // transpositions should detect the swap at positions 0 and 1
      expect(alignment.transpositions).toHaveLength(1);
      expect(alignment.transpositions[0]).toEqual({ first: 0, second: 1 });
    });

    it('should handle mixed case', () => {
      const expected = ['Hello', 'World'];
      const provided = ['hello', 'world'];
      const alignment = engine.alignWords(expected, provided);

      expect(alignment.correct).toHaveLength(2);
    });
  });

  describe('Calcul du score', () => {
    it('should calculate perfect score 1.0', () => {
      const expected = ['hello', 'world'];
      const provided = ['hello', 'world'];
      const alignment = engine.alignWords(expected, provided);
      const score = engine.calculateSimilarityScore(alignment, expected.length);
      expect(score).toBe(1.0);
    });

    it('should calculate score based on matches', () => {
      const expected = ['hello', 'world', 'test'];
      const provided = ['hello', 'world', 'x'];
      const alignment = engine.alignWords(expected, provided);
      const score = engine.calculateSimilarityScore(alignment, expected.length);
      expect(score).toBe(2 / 3);
    });

    it('should handle division by zero', () => {
      const expected: string[] = [];
      const provided: string[] = [];
      const alignment = engine.alignWords(expected, provided);
      const score = engine.calculateSimilarityScore(alignment, expected.length);
      expect(score).toBe(0);
    });
  });

  describe('Analyse des portions', () => {
    it('should identify strong portions', () => {
      const alignment = {
        correct: [{ position: 0, word: 'hello' }, { position: 1, word: 'world' }],
        missing: [],
        extra: [],
        substituted: [],
        transpositions: [],
      };
      const result = engine.analyzePortions(alignment, 2);
      expect(result.strongPortions).toEqual([{ start: 0, end: 1, accuracy: 1.0 }]);
      expect(result.fragilePortions).toEqual([]);
    });

    it('should identify fragile portions', () => {
      const alignment = {
        correct: [{ position: 0, word: 'hello' }],
        missing: [{ position: 1, word: 'world' }],
        extra: [],
        substituted: [],
        transpositions: [],
      };
      const result = engine.analyzePortions(alignment, 2);
      expect(result.strongPortions).toEqual([{ start: 0, end: 0, accuracy: 1.0 }]);
      expect(result.fragilePortions).toEqual([{ start: 1, end: 1, accuracy: 0.0 }]);
    });

    it('should handle mixed strong and fragile portions', () => {
      const alignment = {
        correct: [
          { position: 0, word: 'hello' },
          { position: 1, word: 'world' },
          { position: 3, word: 'test' },
        ],
        missing: [{ position: 2, word: 'missing' }],
        extra: [],
        substituted: [],
        transpositions: [],
      };
      const result = engine.analyzePortions(alignment, 4);
      expect(result.strongPortions).toHaveLength(2);
      expect(result.fragilePortions).toHaveLength(1);
    });
  });

  describe('Méthode principale compare()', () => {
    it('should return structured verification result for perfect match', () => {
      const result = engine.compare('hello world test', 'hello world test');
      expect(result.score).toBe(1.0);
      expect(result.wordCount).toBe(3);
      expect(result.correctWords).toEqual(['hello', 'world', 'test']);
      expect(result.missingWords).toEqual([]);
      expect(result.extraWords).toEqual([]);
      expect(result.substitutedWords).toEqual([]);
      expect(result.strongPortions).toHaveLength(1);
      expect(result.fragilePortions).toHaveLength(0);
    });

    it('should return result with missing words', () => {
      const result = engine.compare('hello world', 'hello test');
      expect(result.score).toBeLessThan(1.0);
      expect(result.missingWords).toContain('world');
      expect(result.extraWords).toContain('test');
      expect(result.substitutedWords).toContain(
        expect.objectContaining({ expected: 'world', got: 'test' })
      );
    });

    it('should include wordCount in result', () => {
      const result = engine.compare('hello world', 'hello');
      expect(result.wordCount).toBe(2);
    });

    it('should handle case insensitivity', () => {
      const result = engine.compare('HELLO WORLD', 'hello world');
      expect(result.score).toBe(1.0);
      expect(result.correctWords).toEqual(['hello', 'world']);
    });

    it('should handle punctuation differences', () => {
      const result = engine.compare('Hello, world!', 'hello world');
      expect(result.score).toBe(1.0);
    });
  });
});
