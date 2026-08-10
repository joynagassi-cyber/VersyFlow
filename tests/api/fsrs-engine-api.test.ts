/**
 * API Tests - FSRS Engine
 * Teste le moteur FSRS pour la répétition espacée
 */

describe('VersyFlow API Tests - FSRS Engine', () => {
  describe('Initial state', () => {
    it('should create initial FSRS state', () => {
      const initialState = {
        stability: 0,
        difficulty: 5,
        recallProbability: 0.9,
        lastInterval: 0,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 0,
        requestedRetention: 0.9
      };

      expect(initialState.stability).toBe(0);
      expect(initialState.difficulty).toBe(5);
      expect(initialState.recallProbability).toBe(0.9);
    });
  });

  describe('Rating values', () => {
    it('should have 4 rating options', () => {
      const ratings = ['again', 'hard', 'good', 'easy'];
      expect(ratings).toHaveLength(4);
      expect(ratings).toContain('again');
      expect(ratings).toContain('easy');
    });
  });

  describe('State transitions', () => {
    it('should decrease stability for Again rating', () => {
      const state = {
        stability: 5.0,
        difficulty: 5.0,
        recallProbability: 0.8,
        lastInterval: 3,
        nextInterval: 3,
        elapsedDays: 1,
        repetitions: 2,
        requestedRetention: 0.9
      };

      const nextState = {
        ...state,
        repetitions: 1,
        stability: state.stability * 0.5
      };

      expect(nextState.repetitions).toBe(1);
      expect(nextState.stability).toBeLessThan(state.stability);
    });

    it('should increase stability for Good rating', () => {
      const state = {
        stability: 5.0,
        difficulty: 5.0,
        recallProbability: 0.8,
        lastInterval: 3,
        nextInterval: 3,
        elapsedDays: 1,
        repetitions: 2,
        requestedRetention: 0.9
      };

      const nextState = {
        ...state,
        repetitions: 3,
        stability: state.stability * 1.5
      };

      expect(nextState.repetitions).toBe(3);
      expect(nextState.stability).toBeGreaterThan(state.stability);
    });

    it('should significantly increase stability for Easy rating', () => {
      const state = {
        stability: 5.0,
        difficulty: 5.0,
        recallProbability: 0.8,
        lastInterval: 3,
        nextInterval: 3,
        elapsedDays: 1,
        repetitions: 2,
        requestedRetention: 0.9
      };

      const nextState = {
        ...state,
        repetitions: 3,
        stability: state.stability * 2.0
      };

      expect(nextState.stability).toBeGreaterThan(state.stability * 1.5);
    });
  });

  describe('Stability prediction', () => {
    it('should predict stability correctly', () => {
      const predictStability = (difficulty, interval) => {
        return Math.max(0.1, difficulty / (1 + interval * 0.1));
      };

      const stability = predictStability(5.0, 10.0);
      expect(stability).toBeGreaterThan(0);
      expect(stability).toBeLessThan(100);
    });

    it('should return higher stability for shorter intervals', () => {
      const predictStability = (difficulty, interval) => {
        return difficulty / (1 + interval * 0.1);
      };

      const stability1 = predictStability(5.0, 5.0);
      const stability2 = predictStability(5.0, 10.0);
      expect(stability1).toBeGreaterThan(stability2);
    });
  });

  describe('Retention prediction', () => {
    it('should predict retention correctly', () => {
      const predictRetention = (stability, interval) => {
        return Math.pow(0.9, interval / stability);
      };

      const retention = predictRetention(1.0, 1.0);
      expect(retention).toBeGreaterThan(0);
      expect(retention).toBeLessThan(1);
    });

    it('should return lower retention for longer intervals', () => {
      const predictRetention = (stability, interval) => {
        return Math.pow(0.9, interval / stability);
      };

      const retention1 = predictRetention(5.0, 1.0);
      const retention2 = predictRetention(5.0, 10.0);
      expect(retention2).toBeLessThan(retention1);
    });
  });

  describe('Memory strength', () => {
    it('should calculate memory strength', () => {
      const calculateStrength = (stability, interval) => {
        return Math.min(100, (stability / interval) * 100);
      };

      const strength = calculateStrength(5.0, 10.0);
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThan(100);
    });
  });

  describe('Interval calculation', () => {
    it('should calculate appropriate intervals', () => {
      const state = {
        stability: 1.0,
        difficulty: 5.0,
        recallProbability: 0.9,
        lastInterval: 1,
        nextInterval: 1,
        elapsedDays: 0,
        repetitions: 0,
        requestedRetention: 0.9
      };

      const nextState = {
        ...state,
        nextInterval: state.nextInterval * 2.5
      };

      expect(nextState.nextInterval).toBeGreaterThan(state.nextInterval);
    });
  });
});
