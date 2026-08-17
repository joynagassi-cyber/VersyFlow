/**
 * ReviewQueueService — Intelligent prioritization for review queue
 * Combines FSRS predictions with user behavior patterns
 * Implements feature #84: Prioritisation intelligente
 * Phase 8: Profile-scoped (FAM-INT-001)
 */

import { IFsrsEngine } from '@/domains/fsrs';
import { MemorizationService, MemorizationRecord } from '@/domains/memorization';
import { IFatigueDetector } from '@/domains/memorization/fatigue-detector';
import { IStrategyRecommendor } from '@/domains/memorization/strategy-recommendor';
import { FatigueDetector } from '@/services/fatigue-detector';
import { StrategyRecommendor } from '@/services/strategy-recommender';
import { ExerciseStrategy } from '@/domains/memorization/entities';

/**
 * Priority rule for a review item
 */
interface PriorityRule {
  name: string;
  weight: number; // 0-1
  appliesTo: (record: MemorizationRecord, fatigueLevel: number) => boolean;
  impact: (record: MemorizationRecord) => number; // Higher = more urgent
}

/**
 * QueueItem with computed priority score
 */
interface QueueItem extends MemorizationRecord {
  urgencyScore: number;
  fatigueLevel: number;
  recommendedStrategy?: ExerciseStrategy;
  predictedDelay?: number; // Days before forgetting if not reviewed
}

/**
 * ReviewQueueService — Computes priority order for review queue
 * Profile-scoped: all operations filtered by learnerProfileId
 */
export class ReviewQueueService {
  private fatigueDetector: IFatigueDetector;
  private recommendor: IStrategyRecommendor;
  private ruleSet: PriorityRule[] = [];

  constructor(
    private memorizationService: MemorizationService,
    private fsrsEngine: IFsrsEngine,
    private profileId: string = 'default',
    fatigueDetector?: IFatigueDetector,
    recommendor?: IStrategyRecommendor,
  ) {
    this.fatigueDetector = fatigueDetector ?? new FatigueDetector();
    this.recommendor = recommendor ?? new StrategyRecommendor();
    this.ruleSet = this.defaultRules();
  }

  /**
   * Default priority rules
   */
  private defaultRules(): PriorityRule[] {
    return [
      {
        name: 'byFSRS',
        weight: 0.5,
        appliesTo: () => true,
        impact: (r) => r.nextReviewAt ? Math.max(0, (r.nextReviewAt - Date.now()) / 86400000) : 0,
      },
      {
        name: 'highErrorRate',
        weight: 0.3,
        appliesTo: (r, f) => f > 0.5 && r.reviewCount > 0,
        impact: (r) => r.reviewCount > 0 ? (100 - (r.fsrsState?.recallProbability || 0) * 100) / 100 : 0,
      },
      {
        name: 'fatigueSensitive',
        weight: 0.2,
        appliesTo: (r, f) => f > 0.3,
        impact: (r) => r.fsrsState?.stability || 0, // More unstable = higher priority
      },
    ];
  }

  /**
   * Get prioritized review items
   */
  async getPrioritizedQueue(): Promise<QueueItem[]> {
    // Get due records scoped to profile
    const records = await this.memorizationService.getDueRecords(this.profileId);

    // Calculate fatigue level
    const fatigueLevel = this.fatigueDetector.getFatigueLevel();

    // Process each record with priority scoring
    const queueItems: QueueItem[] = [];

    for (const record of records) {
      const priorityScore = this.calculatePriorityScore(record, fatigueLevel);

      // Get recommended strategy based on current state
      const recommendation = this.recommendor.recommend({ recordId: record.id, fatigueLevel });

      queueItems.push({
        ...record,
        urgencyScore: priorityScore,
        fatigueLevel,
        recommendedStrategy: recommendation.strategy,
        predictedDelay: this.predictForgetDelay(record.fsrsState || {}),
      });
    }

    // Sort by urgency score (highest first)
    return queueItems.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  /**
   * Calculate priority score using weighted rules
   */
  private calculatePriorityScore(record: MemorizationRecord, fatigueLevel: number): number {
    let score = 0;

    for (const rule of this.ruleSet) {
      if (rule.appliesTo(record, fatigueLevel)) {
        score += rule.weight * rule.impact(record);
      }
    }

    return score;
  }

  /**
   * Predict when this record will be forgotten without review
   */
  private predictForgetDelay(fsrsState: any): number {
    if (!fsrsState || !fsrsState.stability || !fsrsState.nextInterval) {
      return 7; // Default estimate
    }

    // Simple heuristic: stability predicts how long before recall drops below threshold
    // Higher stability = longer before forgetting
    return Math.max(1, fsrsState.stability * 2);
  }

  /**
   * Get queue summary with prioritization insights
   */
  async getQueueSummary(): Promise<{
    total: number;
    highPriority: number;
    dueToday: number;
    delayed: number;
    fatigueLevel: number;
  }> {
    const records = await this.memorizationService.getDueRecords(this.profileId);
    const fatigueLevel = this.fatigueDetector.getFatigueLevel();

    const highPriority = records.filter(r => this.calculatePriorityScore(r, fatigueLevel) > 0.5).length;
    const dueToday = records.filter(r => r.nextReviewAt && r.nextReviewAt <= Date.now()).length;
    const delayed = records.filter(r => r.nextReviewAt && r.nextReviewAt < Date.now() - 86400000).length;

    return {
      total: records.length,
      highPriority,
      dueToday,
      delayed,
      fatigueLevel,
    };
  }

  /**
   * Add custom priority rule
   */
  addRule(rule: PriorityRule): void {
    this.ruleSet.push(rule);
  }

  /**
   * Set fatigue level manually (for testing)
   * Replaces the detector with a stub that returns the given level
   */
  setFatigueLevel(level: number): void {
    this.fatigueDetector = {
      getFatigueLevel: () => level,
      recordSlowResponse: () => {},
      recordManyErrors: () => {},
      recordAbandonment: () => {},
      isFatigued: () => level > 0.5,
      shouldRecommendBreak: () => level > 0.7,
      calculateFatigueLevel: () => level,
      getRecommendedAction: () => null,
      clear: () => {},
    };
  }
}
