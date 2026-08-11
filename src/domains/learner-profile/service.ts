/**
 * LearnerProfile Service
 * Business logic for profile CRUD and selection
 */

import { LearnerProfile, ProfileStatus } from './entities';
import { ILearnerProfileRepository } from './repository';
import { eventBus, DomainEventTypes } from '@/domains';

export class LearnerProfileService {
  private activeProfileId: string | null = null;

  constructor(private repository: ILearnerProfileRepository) {}

  async create(accountId: string, displayName: string, avatar?: string): Promise<LearnerProfile> {
    const now = Date.now();
    const profile: Omit<LearnerProfile, 'id'> = {
      accountId,
      displayName,
      avatar,
      createdAt: now,
      updatedAt: now,
      status: 'active' as ProfileStatus,
    };

    const created = await this.repository.create(profile);
    this.activeProfileId = created.id;

    eventBus.emit({
      id: crypto.randomUUID(),
      type: 'learner_profile.created',
      timestamp: now,
      payload: { profileId: created.id, accountId },
    });

    return created;
  }

  async findById(id: string): Promise<LearnerProfile | null> {
    return this.repository.findById(id);
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    return this.repository.findByAccountId(accountId);
  }

  async update(id: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile | null> {
    const updated = await this.repository.update(id, { ...updates, updatedAt: Date.now() });

    if (updated) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: 'learner_profile.updated',
        timestamp: Date.now(),
        payload: { profileId: id },
      });
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.delete(id);

    if (deleted && this.activeProfileId === id) {
      this.activeProfileId = null;
    }

    if (deleted) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: 'learner_profile.deleted',
        timestamp: Date.now(),
        payload: { profileId: id },
      });
    }

    return deleted;
  }

  setActiveProfileId(id: string): void {
    this.activeProfileId = id;
    eventBus.emit({
      id: crypto.randomUUID(),
      type: 'learner_profile.selected',
      timestamp: Date.now(),
      payload: { profileId: id },
    });
  }

  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }
}
