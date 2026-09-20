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

  describe('recordSlowResponse()', () => {
    it('does not record signal when response time is below threshold', () => {
      detector.recordSlowResponse(2000);
      expect(detector.isFatigued(0)).toBe(false);
    });

    it('records signal when response time exceeds default threshold (3000ms)', () => {
      detector.recordSlowResponse(4000);
      const level = detector.getFatigueLevel();
      expect(level).toBeGreaterThan(0);
    });

    it('records signal with custom threshold', () => {
      detector.recordSlowResponse(1500, 1000);
      expect(detector.getFatigueLevel()).toBeGreaterThan(0);
    });

    it('calculates severity proportional to response time', () => {
      detector.recordSlowResponse(8000); // (8000-3000)/5000 = 1.0 → capped at 1
      const level = detector.getFatigueLevel();
      expect(level).toBeCloseTo(1.0, 0);
    });

    it('caps severity at 1.0', () => {
      detector.recordSlowResponse(10000);
      expect(detector.getFatigueLevel()).toBeLessThanOrEqual(1);
    });
  });

  describe('recordManyErrors()', () => {
    it('does not record signal when error count is at threshold', () => {
      detector.recordManyErrors(3); // default threshold is 3, must be > 3
      expect(detector.getFatigueLevel()).toBe(0);
    });

    it('records signal when error count exceeds threshold', () => {
      detector.recordManyErrors(5);
      expect(detector.getFatigueLevel()).toBeGreaterThan(0);
    });

    it('calculates severity as errorCount / 10', () => {
      detector.recordManyErrors(8); // severity = min(1, 8/10) = 0.8
      expect(detector.getFatigueLevel()).toBeCloseTo(0.8, 1);
    });

    it('caps severity at 1.0 for many errors', () => {
      detector.recordManyErrors(15);
      expect(detector.getFatigueLevel()).toBeLessThanOrEqual(1);
    });
  });

  describe('recordAbandonment()', () => {
    it('records a signal with severity 0.8', () => {
      detector.recordAbandonment();
      expect(detector.getFatigueLevel()).toBeCloseTo(0.8, 1);
    });

    it('isFatigued returns true after abandonment with default threshold', () => {
      detector.recordAbandonment();
      expect(detector.isFatigued()).toBe(true);
    });
  });

  describe('isFatigued()', () => {
    it('returns false when no signals recorded', () => {
      expect(detector.isFatigued()).toBe(false);
    });

    it('returns false when average severity is below threshold', () => {
      detector.recordSlowResponse(3500); // severity = (3500-3000)/5000 = 0.1
      expect(detector.isFatigued(0.5)).toBe(false);
    });

    it('returns true when average severity meets threshold', () => {
      detector.recordAbandonment(); // severity = 0.8
      expect(detector.isFatigued(0.5)).toBe(true);
    });

    it('accepts custom threshold', () => {
      detector.recordSlowResponse(3500);
      expect(detector.isFatigued(0.05)).toBe(true);
    });
  });

  describe('getFatigueLevel()', () => {
    it('returns 0 when no signals', () => {
      expect(detector.getFatigueLevel()).toBe(0);
    });

    it('returns average of multiple signals', () => {
      detector.recordSlowResponse(3500); // severity 0.1
      detector.recordSlowResponse(8500); // severity 1.0
      const avg = (0.1 + 1.0) / 2;
      expect(detector.getFatigueLevel()).toBeCloseTo(avg, 1);
    });
  });

  describe('getRecommendedAction()', () => {
    it('returns null when no fatigue', () => {
      expect(detector.getRecommendedAction()).toBeNull();
    });

    it('returns "Prendre une petite pause" for moderate fatigue', () => {
      detector.recordSlowResponse(3500); // severity ~0.1 → not enough
      // Instead, record something that gives level between 0.4 and 0.7
      detector.recordAbandonment(); // 0.8 → too high
      // Clear and use a single moderate signal
      detector.clear();
      // Record two signals averaging ~0.5
      detector.recordSlowResponse(5500); // (5500-3000)/5000 = 0.5
      const action = detector.getRecommendedAction();
      expect(action).toBe('Prendre une petite pause');
    });

    it('returns "Recommencer une session plus tard" for high fatigue', () => {
      detector.recordAbandonment();
      const action = detector.getRecommendedAction();
      expect(action).toBe('Recommencer une session plus tard');
    });
  });

  describe('clear()', () => {
    it('removes all signals', () => {
      detector.recordAbandonment();
      expect(detector.getFatigueLevel()).toBeGreaterThan(0);
      detector.clear();
      expect(detector.getFatigueLevel()).toBe(0);
      expect(detector.isFatigued()).toBe(false);
    });
  });
});
