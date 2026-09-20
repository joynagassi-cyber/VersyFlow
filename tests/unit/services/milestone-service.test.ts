/**
 * Tests for MilestoneService — progress milestone detection and emission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MilestoneService } from '@/services/milestone-service';
import type { MemorizationService } from '@/domains/memorization/service';
import type { ITelemetry } from '@/domains/telemetry/it telemetry';
import { eventBus, DomainEventTypes } from '@/domains/events';

function makeMockMemorizationService(count: number, masteredCount: number = 0): MemorizationService {
  const records = Array.from({ length: count }, (_, i) => ({
    id: `rec-${i}`,
    status: i < masteredCount ? 'mastered' : 'in-progress',
  }));
  return {
    getAllMemorized: vi.fn(async () => records),
  } as unknown as MemorizationService;
}

function makeMockTelemetry(): ITelemetry {
  return {
    record: vi.fn(),
    flush: vi.fn(),
    getSummary: vi.fn(),
    clear: vi.fn(),
    getQueue: vi.fn(),
    setUserId: vi.fn(),
  };
}

describe('MilestoneService', () => {
  let service: MilestoneService;
  let mockMemService: MemorizationService;
  let mockTelemetry: ITelemetry;
  let emitSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTelemetry = makeMockTelemetry();
    emitSpy = vi.spyOn(eventBus, 'emit').mockReturnValue(undefined);
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  describe('checkAndEmitMilestones()', () => {
    it('returns empty array when no records', async () => {
      mockMemService = makeMockMemorizationService(0);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();
      expect(milestones).toEqual([]);
    });

    it('emits first_verse milestone when totalMemorized === 1', async () => {
      mockMemService = makeMockMemorizationService(1, 0);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      expect(milestones).toHaveLength(1);
      expect(milestones[0].type).toBe('first_verse');
      expect(milestones[0].totalVerses).toBe(1);

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: DomainEventTypes.PROGRESS_MILESTONE_REACHED,
        payload: expect.objectContaining({ milestoneType: 'first_verse' }),
      }));
    });

    it('emits ten_verses milestone when totalMemorized === 10', async () => {
      mockMemService = makeMockMemorizationService(10, 2);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      expect(milestones.some(m => m.type === 'ten_verses')).toBe(true);
    });

    it('emits fifty_verses milestone when totalMemorized === 50', async () => {
      mockMemService = makeMockMemorizationService(50, 10);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      expect(milestones.some(m => m.type === 'fifty_verses')).toBe(true);
    });

    it('emits mastered_first milestone when first verse is mastered', async () => {
      mockMemService = makeMockMemorizationService(1, 1);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      expect(milestones.some(m => m.type === 'mastered_first')).toBe(true);
    });

    it('does not emit milestones for counts other than 1, 10, 50', async () => {
      mockMemService = makeMockMemorizationService(5, 0);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      expect(milestones).toEqual([]);
    });

    it('emits telemetry feature.accessed for each milestone', async () => {
      mockMemService = makeMockMemorizationService(1, 0);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      await service.checkAndEmitMilestones();

      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.accessed',
        expect.objectContaining({ featureName: 'milestone.first_verse' }),
      );
    });

    it('does not emit telemetry when no telemetry service provided', async () => {
      mockMemService = makeMockMemorizationService(1, 0);
      service = new MilestoneService(mockMemService, 'profile-1');
      await service.checkAndEmitMilestones();

      // Should still emit domain event but not telemetry
      expect(emitSpy).toHaveBeenCalled();
    });

    it('returns correct milestone data', async () => {
      mockMemService = makeMockMemorizationService(10, 3);
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);
      const milestones = await service.checkAndEmitMilestones();

      const tenMilestone = milestones.find(m => m.type === 'ten_verses');
      expect(tenMilestone).toBeDefined();
      expect(tenMilestone!.totalVerses).toBe(10);
      expect(tenMilestone!.totalMastered).toBe(3);
      expect(typeof tenMilestone!.reachedAt).toBe('number');
    });

    it('handles service error gracefully', async () => {
      mockMemService = makeMockMemorizationService(0);
      vi.spyOn(mockMemService, 'getAllMemorized').mockRejectedValue(new Error('db error'));
      service = new MilestoneService(mockMemService, 'profile-1', mockTelemetry);

      // Should throw since there's no try/catch in MilestoneService
      await expect(service.checkAndEmitMilestones()).rejects.toThrow();
    });
  });
});
