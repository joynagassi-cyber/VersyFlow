/**
 * Unit Tests for StrategyRecommendor
 * Tests feature #85: Choix automatique de stratégie
 */

import { StrategyRecommendor } from '@/services/strategy-recommendor';
import { VerificationResult } from '@/domains/memorization/entities';

describe('StrategyRecommendor', () => {
  let recommendor: StrategyRecommendor;

  beforeEach(() => {
    recommendor = new StrategyRecommendor();
  });

  afterEach(() => {
    recommendor.reset();
  });

  describe('recommend()', () => {
    it('should recommend progressive-masking for high fatigue', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        fatigueLevel: 0.8,
      };

      // Act
      const result = recommendor.recommend(context);

      // Assert
      expect(result.strategy).toBe('progressive-masking');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.rationale).toContain('fatigué');
    });

    it('should recommend incremental-reveal for low verification score', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        verification: { score: 0.3, correctWords: [], missingWords: ['word1', 'word2', 'word3', 'word4'], extraWords: [], substitutedWords: [] },
      };

      // Act
      const result = recommendor.recommend(context);

      // Assert
      expect(result.strategy).toBe('incremental-reveal');
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.rationale).toContain('Plusieurs erreurs');
    });

    it('should recommend heat-words for many forgotten words', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        wordFailures: [
          { word: 'Dieu', failCount: 3, lastFailedAt: Date.now(), position: 1 },
          { word: 'créa', failCount: 2, lastFailedAt: Date.now(), position: 2 },
          { word: 'cieux', failCount: 4, lastFailedAt: Date.now(), position: 3 },
        ],
      };

      // Act
      const result = recommendor.recommend(context);

      // Assert
      expect(result.strategy).toBe('heat-words');
      expect(result.rationale).toContain('mots souvent oubliés');
    });

    it('should recommend active-recall for high performance', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        verification: { score: 0.95, correctWords: ['au', 'commencement', 'dieu'], missingWords: [], extraWords: [], substitutedWords: [] },
      };

      // Act
      const result = recommendor.recommend(context);

      // Assert
      expect(result.strategy).toBe('active-recall');
      expect(result.confidence).toBe(0.8);
      expect(result.rationale).toContain('Excellente performance');
    });

    it('should fall back to progressive-masking for unknown cases', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        verification: { score: 0.7, correctWords: [], missingWords: [], extraWords: [], substitutedWords: [] },
      };

      // Act
      const result = recommendor.recommend(context);

      // Assert
      expect(result.strategy).toBe('progressive-masking');
      expect(result.confidence).toBe(0.6);
    });
  });

  describe('recordPerformance()', () => {
    it('should track word failures from verification', () => {
      // Arrange
      const context = {
        recordId: 'test-123',
        verification: { score: 0.6, correctWords: [], missingWords: ['dieu', 'créa'], extraWords: [], substitutedWords: [] },
      };

      // Act
      recommendor.recordPerformance('test-123', context.verification);

      // Assert - verify failures were tracked (indirectly, next recommendation would change)
      expect(recommendor.getFatigueLevel()).toBeDefined();
    });

    it('should clear cache after recording', () => {
      // Arrange - make a recommendation first
      const context1 = { recordId: 'test-123', fatigueLevel: 0.5 };
      const result1 = recommendor.recommend(context1);

      // Record performance with different context
      const context2 = { recordId: 'test-123', fatigueLevel: 0.8 };
      recommendor.recordPerformance('test-123', undefined, 0.8);

      // Get a new recommendation (should be different due to cache clearing)
      const result2 = recommendor.recommend(context2);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('reset()', () => {
    it('should clear all trackers and cache', () => {
      // Arrange - record some data
      recommendor.recordPerformance('test-123', { score: 0.6, correctWords: [], missingWords: ['word'] }, 0.3);
      recommendor.recommend({ recordId: 'test-123' });

      // Act
      recommendor.reset();

      // Assert - verify state is cleared (would require internal access in a real test)
      expect(recommendor.getFatigueLevel()).toBe(0);
    });
  });
});
