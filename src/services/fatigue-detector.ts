/**
 * FatigueDetector — Detects user fatigue based on session patterns
 * Helps adjust difficulty or suggest breaks
 */

interface FatigueSignal {
  type: 'slow_response' | 'many_errors' | 'rapid_tapping' | 'abandonment';
  severity: number; // 0-1
  timestamp: number;
}

export class FatigueDetector {
  private signals: FatigueSignal[] = [];
  private readonly MAX_SIGNALS = 50;

  /**
   * Record a slow response signal
   */
  recordSlowResponse(responseTimeMs: number, threshold: number = 3000): void {
    if (responseTimeMs > threshold) {
      const severity = Math.min(1, (responseTimeMs - threshold) / 5000); // Normalize to 0-1
      this.signals.push({
        type: 'slow_response',
        severity,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Record many errors signal
   */
  recordManyErrors(errorCount: number, threshold: number = 3): void {
    if (errorCount > threshold) {
      const severity = Math.min(1, errorCount / 10); // Normalize to 0-1
      this.signals.push({
        type: 'many_errors',
        severity,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Record abandonment signal
   */
  recordAbandonment(): void {
    this.signals.push({
      type: 'abandonment',
      severity: 0.8,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if the user shows signs of fatigue
   */
  isFatigued(fatigueThreshold: number = 0.5): boolean {
    const recentSignals = this.signals.filter(s => s.timestamp > Date.now() - 300000); // last 5 minutes
    if (recentSignals.length === 0) return false;

    const avgSeverity = recentSignals.reduce((sum, s) => sum + s.severity, 0) / recentSignals.length;
    return avgSeverity >= fatigueThreshold;
  }

  /**
   * Get the current fatigue level (0-1)
   */
  getFatigueLevel(): number {
    const recentSignals = this.signals.filter(s => s.timestamp > Date.now() - 300000);
    if (recentSignals.length === 0) return 0;
    return recentSignals.reduce((sum, s) => sum + s.severity, 0) / recentSignals.length;
  }

  /**
   * Get recommended action based on fatigue level
   */
  getRecommendedAction(): string | null {
    const level = this.getFatigueLevel();
    if (level > 0.7) return 'Recommencer une session plus tard';
    if (level > 0.4) return 'Prendre une petite pause';
    return null; // Pas de fatigue détectée
  }

  /**
   * Clear all signals (new session)
   */
  clear(): void {
    this.signals = [];
  }
}
