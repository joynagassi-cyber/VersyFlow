/**
 * ProgressService — Orchestrates progression calculations
 * Thin orchestrator delegating to StreakService, MilestoneService, StatsCalculator
 * See docs/25-retrieval-analytics-spec.md
 */

import type { MemorizationService } from '@/domains/memorization/service';
import type { MemorizationRecord } from '@/domains/memorization/entities';
import type { IFsrsEngine } from '@/domains/fsrs';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';
import type { IStreakRepository } from '@/domains/streaks/repository';
import { StreakService } from './streak-service';
import type { Milestone } from './milestone-service';
import { MilestoneService } from './milestone-service';
import type { ProgressStats } from './stats-calculator';
import { StatsCalculator } from './stats-calculator';

export type { ProgressStats, Milestone } from './stats-calculator';
export type { Milestone as MilestoneType } from './milestone-service';

export class ProgressService {
  private streakService: StreakService;
  private milestoneService: MilestoneService;
  private statsCalculator: StatsCalculator;

  constructor(
    memorizationService: MemorizationService,
    fsrsEngine: IFsrsEngine,
    telemetry?: ITelemetry,
    profileId: string = 'default',
    streakRepository?: IStreakRepository,
    userIdResolver?: () => Promise<string | null>,
  ) {
    this.streakService = new StreakService(
      memorizationService,
      profileId,
      streakRepository,
      userIdResolver,
    );
    this.milestoneService = new MilestoneService(memorizationService, profileId, telemetry);
    this.statsCalculator = new StatsCalculator(memorizationService, profileId);
  }

  async calculateStreak(): Promise<number> {
    return this.streakService.calculateStreak();
  }

  async incrementStreak(): Promise<boolean> {
    return this.streakService.incrementStreak();
  }

  async checkAndEmitMilestones(): Promise<Milestone[]> {
    return this.milestoneService.checkAndEmitMilestones();
  }

  async getWeeklyTrend(): Promise<{ thisWeek: number; lastWeek: number; changePercentage: number }> {
    return this.statsCalculator.getWeeklyTrend();
  }

  async calculateAverageRetention(): Promise<number> {
    return this.statsCalculator.calculateAverageRetention();
  }

  calculateMasteryIndex(record: MemorizationRecord): number {
    return this.statsCalculator.calculateMasteryIndex(record);
  }

  async detectLapse(recordId: string): Promise<boolean> {
    return this.statsCalculator.detectLapse(recordId);
  }

  async getMostForgottenWords(recordId: string): Promise<string[]> {
    return this.statsCalculator.getMostForgottenWords(recordId);
  }

  async getFragilePortions(recordId: string): Promise<Array<{ start: number; end: number }>> {
    return this.statsCalculator.getFragilePortions(recordId);
  }

  async getStats(): Promise<ProgressStats> {
    const streak = await this.streakService.calculateStreak();
    return this.statsCalculator.getStats(streak);
  }
}
