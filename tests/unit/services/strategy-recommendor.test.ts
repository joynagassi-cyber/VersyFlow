/**
 * Tests pour StrategyRecommendor
 * Vérifie la recommandation automatique de stratégie de mémorisation
 */

import { StrategyRecommendor } from '@/services/strategy-recommendor';
import { WordPerformance } from '@/domains/memorization/entities';

describe('StrategyRecommendor', () => {
  let recommendor: StrategyRecommendor;

  beforeEach(() => {
    recommendor = new StrategyRecommendor();
  });

  describe('Recommandation de stratégie', () => {
    it('should recommend progressive masking for new verses', () => {
      // Arrange
      const wordPerformance: WordPerformance[] = [];
      
      // Act
      const recommendation = recommendor.recommendStrategy(wordPerformance, 0);
      
      // Assert
      expect(recommendation).toBe('progressive-masking');
    });

    it('should recommend smart masking for verses with errors', () => {
      // Arrange
      const wordPerformance: WordPerformance[] = [
        { word: 'Dieu', errorCount: 3, totalAttempts: 5 },
        { word: 'créa', errorCount: 2, totalAttempts: 4 },
      ];
      
      // Act
      const recommendation = recommendor.recommendStrategy(wordPerformance, 2);
      
      // Assert
      expect(recommendation).toBe('smart-masking');
    });

    it('should recommend flashcards for verses with high stability', () => {
      // Arrange
      const wordPerformance: WordPerformance[] = [
        { word: 'Dieu', errorCount: 0, totalAttempts: 1 },
        { word: 'créa', errorCount: 0, totalAttempts: 1 },
      ];
      const avgStability = 8.0;
      
      // Act
      const recommendation = recommendor.recommendStrategy(wordPerformance, avgStability);
      
      // Assert
      expect(recommendation).toBe('flashcard');
    });

    it('should recommend recall writing for mastery practice', () => {
      // Arrange
      const wordPerformance: WordPerformance[] = [];
      const avgStability = 15.0; // High stability
      
      // Act
      const recommendation = recommendor.recommendStrategy(wordPerformance, avgStability);
      
      // Assert
      expect(recommendation).toBe('recall-writing');
    });
  });

  describe('Calcul du score de difficulté', () => {
    it('should return 0 for empty performance', () => {
      // Act
      const score = recommendor.calculateDifficultyScore([]);
      
      // Assert
      expect(score).toBe(0);
    });

    it('should calculate difficulty based on error rates', () => {
      // Arrange
      const wordPerformance: WordPerformance[] = [
        { word: 'test', errorCount: 3, totalAttempts: 5 },
        { word: 'word', errorCount: 2, totalAttempts: 4 },
      ];
      
      // Act
      const score = recommendor.calculateDifficultyScore(wordPerformance);
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
