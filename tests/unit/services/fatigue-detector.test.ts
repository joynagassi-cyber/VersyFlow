/**
 * Tests pour FatigueDetector
 * Vérifie la détection de fatigue cognitive
 */

import { FatigueDetector } from '@/services/fatigue-detector';

describe('FatigueDetector', () => {
  let detector: FatigueDetector;

  beforeEach(() => {
    detector = new FatigueDetector();
  });

  describe('Calcul du niveau de fatigue', () => {
    it('should return low fatigue for fresh session', () => {
      // Arrange
      const todayReviews = 0;
      const recentErrorRate = 0.1;
      const sessionDuration = 5; // minutes
      
      // Act
      const fatigueLevel = detector.calculateFatigueLevel(todayReviews, recentErrorRate, sessionDuration);
      
      // Assert
      expect(fatigueLevel).toBeLessThan(0.3);
    });

    it('should return high fatigue for exhausted session', () => {
      // Arrange
      const todayReviews = 50;
      const recentErrorRate = 0.6;
      const sessionDuration = 120; // 2 hours
      
      // Act
      const fatigueLevel = detector.calculateFatigueLevel(todayReviews, recentErrorRate, sessionDuration);
      
      // Assert
      expect(fatigueLevel).toBeGreaterThan(0.7);
    });

    it('should return moderate fatigue for average session', () => {
      // Arrange
      const todayReviews = 20;
      const recentErrorRate = 0.3;
      const sessionDuration = 30; // 30 minutes
      
      // Act
      const fatigueLevel = detector.calculateFatigueLevel(todayReviews, recentErrorRate, sessionDuration);
      
      // Assert
      expect(fatigueLevel).toBeGreaterThan(0.3);
      expect(fatigueLevel).toBeLessThan(0.7);
    });
  });

  describe('Recommandation de pause', () => {
    it('should recommend break when fatigue is high', () => {
      // Act
      const shouldBreak = detector.shouldRecommendBreak(0.8);
      
      // Assert
      expect(shouldBreak).toBe(true);
    });

    it('should not recommend break when fatigue is low', () => {
      // Act
      const shouldBreak = detector.shouldRecommendBreak(0.2);
      
      // Assert
      expect(shouldBreak).toBe(false);
    });
  });
});
