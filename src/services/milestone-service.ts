/**
 * MilestoneService — Check and emit progress milestones
 * Extracted from ProgressService (C8 deepening)
 */

import { eventBus, DomainEventTypes } from '@/domains';
import { MemorizationService } from '@/domains/memorization';
import { ITelemetry } from '@/domains/telemetry/it telemetry';

export interface Milestone {
  type: 'first_verse' | 'ten_verses' | 'fifty_verses' | 'mastered_first';
  totalVerses: number;
  totalMastered: number;
  reachedAt: number;
}

export class MilestoneService {
  constructor(
    private memorizationService: MemorizationService,
    private profileId: string,
    private telemetry?: ITelemetry,
  ) {}

  private recordFeatureAccessed(payload: Record<string, unknown>): void {
    if (this.telemetry) {
      this.telemetry.record('feature.accessed', payload);
    }
  }

  /**
   * Check if a milestone has been reached and emit event if so
   */
  async checkAndEmitMilestones(): Promise<Milestone[]> {
    const milestones: Milestone[] = [];
    const records = await this.memorizationService.getAllMemorized(this.profileId);

    const totalMemorized = records.length;
    const masteredCount = records.filter(r => r.status === 'mastered').length;

    const emit = (type: Milestone['type'], totalVerses: number, totalMastered: number) => {
      milestones.push({ type, totalVerses, totalMastered, reachedAt: Date.now() });
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        timestamp: Date.now(),
        payload: { milestoneType: type, totalVerses, totalMastered },
      });
      this.recordFeatureAccessed({ featureName: `milestone.${type}` });
    };

    if (totalMemorized === 1) emit('first_verse', 1, masteredCount);
    if (totalMemorized === 10) emit('ten_verses', 10, masteredCount);
    if (totalMemorized === 50) emit('fifty_verses', 50, masteredCount);
    if (masteredCount === 1 && totalMemorized >= 1) emit('mastered_first', totalMemorized, 1);

    return milestones;
  }
}
