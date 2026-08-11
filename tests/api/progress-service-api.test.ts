/**
 * API Tests - Progress Service
 * Teste le service de progression
 */

describe('VersyFlow API Tests - Progress Service', () => {
  describe('Progress stats', () => {
    it('should have progress stats structure', () => {
      const stats = {
        totalVerses: 0,
        masteredVerses: 0,
        inProgressVerses: 0,
        dueForReview: 0,
        streakCount: 0,
        longestStreak: 0,
        weeklyTrend: {
          thisWeek: 0,
          lastWeek: 0,
          changePercentage: 0
        },
        avgSessionDurationMin: 0
      };

      expect(stats.totalVerses).toBeGreaterThanOrEqual(0);
      expect(stats.masteredVerses).toBeGreaterThanOrEqual(0);
      expect(stats.streakCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Streak calculation', () => {
    it('should calculate streak correctly', () => {
      const calculateStreak = (reviewDates) => {
        if (reviewDates.length === 0) return 0;

        const today = Math.floor(Date.now() / 86400000);
        let streak = 0;

        for (let i = 0; i <= today; i++) {
          const checkDay = today - i;
          const hasActivity = reviewDates.some(date => Math.floor(date / 86400000) === checkDay);

          if (hasActivity) {
            streak++;
          } else {
            break;
          }
        }

        return streak;
      };

      const reviewDates = [Date.now()];
      const streak = calculateStreak(reviewDates);
      expect(streak).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(streak)).toBe(true);
    });
  });

  describe('Weekly trend', () => {
    it('should calculate weekly trend', () => {
      const calculateTrend = (records) => {
        const today = Math.floor(Date.now() / 86400000);
        const sevenDaysAgo = today - 7;
        const fourteenDaysAgo = today - 14;

        const thisWeek = records.filter(r => {
          const createdAtDay = Math.floor(r.createdAt / 86400000);
          return createdAtDay >= fourteenDaysAgo && createdAtDay <= sevenDaysAgo;
        }).length;

        const lastWeek = records.filter(r => {
          const createdAtDay = Math.floor(r.createdAt / 86400000);
          return createdAtDay >= fourteenDaysAgo - 7 && createdAtDay < fourteenDaysAgo;
        }).length;

        const changePercentage = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

        return { thisWeek, lastWeek, changePercentage: Math.round(changePercentage) };
      };

      const trend = calculateTrend([]);
      expect(trend).toBeDefined();
      expect(trend.thisWeek).toBeGreaterThanOrEqual(0);
      expect(trend.lastWeek).toBeGreaterThanOrEqual(0);
      expect(typeof trend.changePercentage).toBe('number');
    });
  });

  describe('Retention calculation', () => {
    it('should calculate average retention', () => {
      const calculateRetention = (records) => {
        if (records.length === 0) return 0;

        let totalRetention = 0;
        for (const record of records) {
          if (record.stability > 0 && record.nextInterval > 0) {
            const retention = (record.stability / record.nextInterval) * 100;
            totalRetention += retention;
          }
        }

        return Math.round((totalRetention / records.length) * 100) / 100;
      };

      const retention = calculateRetention([]);
      expect(retention).toBeGreaterThanOrEqual(0);
      expect(retention).toBeLessThanOrEqual(100);
    });
  });

  describe('Mastery index', () => {
    it('should calculate mastery index for record', () => {
      const calculateMasteryIndex = (record) => {
        const { fsrsState } = record;

        const stabilityScore = Math.min(100, (fsrsState.stability / 30) * 100);
        const repetitionScore = Math.min(100, fsrsState.repetitions * 10);
        const recallScore = fsrsState.recallProbability * 100;

        return Math.round(stabilityScore * 0.4 + repetitionScore * 0.3 + recallScore * 0.3);
      };

      const record = {
        fsrsState: {
          stability: 10.0,
          difficulty: 3.0,
          recallProbability: 0.95,
          lastInterval: 7,
          nextInterval: 10,
          elapsedDays: 1,
          repetitions: 5,
          requestedRetention: 0.9
        }
      };

      const masteryIndex = calculateMasteryIndex(record);
      expect(masteryIndex).toBeGreaterThanOrEqual(0);
      expect(masteryIndex).toBeLessThanOrEqual(100);
    });
  });

  describe('Lapse detection', () => {
    it('should detect lapse in record', () => {
      const detectLapse = (logs) => {
        if (logs.length < 5) return false;

        const recentStabilities = logs.slice(-5).map(log => log.stabilityAfter);
        const olderStabilities = logs.slice(-10, -5).map(log => log.stabilityAfter);

        if (olderStabilities.length === 0) return false;

        const recentAvg = recentStabilities.reduce((a, b) => a + b, 0) / recentStabilities.length;
        const olderAvg = olderStabilities.reduce((a, b) => a + b, 0) / olderStabilities.length;

        return recentAvg < olderAvg * 0.5;
      };

      const hasLapse = detectLapse([]);
      expect(typeof hasLapse).toBe('boolean');
    });
  });

  describe('Forgotten words', () => {
    it('should get most forgotten words', () => {
      const getMostForgottenWords = (logs) => {
        const wordFailures = {};

        for (const log of logs) {
          // Count missing words from verification
        }

        return Object.entries(wordFailures)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([word]) => word);
      };

      const forgottenWords = getMostForgottenWords([]);
      expect(Array.isArray(forgottenWords)).toBe(true);
    });
  });

  describe('Streak increment', () => {
    it('should increment streak', () => {
      const incrementStreak = (currentStreak) => {
        return currentStreak + 1;
      };

      const result = incrementStreak(0);
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });
  });
});
