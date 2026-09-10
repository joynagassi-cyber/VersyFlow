/**
 * LearnerProfile Service — Orchestrator Layer
 *
 * Thin orchestrator wrapping LearnerProfileDomainService,
 * always filtering by current accountId from auth context.
 */

import type { LearnerProfile } from '@/domains/learner-profile';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';
import { LearnerProfileDomainService } from '@/domains/learner-profile/service';

export class LearnerProfileService {
  private domainService: LearnerProfileDomainService;

  constructor(private repository: ILearnerProfileRepository) {
    this.domainService = new LearnerProfileDomainService(repository);
  }

  async create(accountId: string, displayName: string, avatar?: string): Promise<LearnerProfile> {
    return this.domainService.create(accountId, displayName, avatar);
  }

  async findById(id: string, accountId?: string): Promise<LearnerProfile | null> {
    return this.domainService.findById(id, accountId);
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    return this.domainService.findByAccountId(accountId);
  }

  /**
   * Get profile scoped to current account — enforces ownership
   */
  async getScopedProfile(id: string, currentAccountId: string): Promise<LearnerProfile | null> {
    return this.domainService.findById(id, currentAccountId);
  }

  async update(id: string, updates: Partial<LearnerProfile>, accountId?: string): Promise<LearnerProfile | null> {
    return this.domainService.update(id, updates, accountId);
  }

  async delete(id: string, accountId?: string): Promise<boolean> {
    return this.domainService.delete(id, accountId);
  }

  setActiveProfileId(id: string): void {
    this.domainService.setActiveProfileId(id);
  }

  getActiveProfileId(): string | null {
    return this.domainService.getActiveProfileId();
  }
}
