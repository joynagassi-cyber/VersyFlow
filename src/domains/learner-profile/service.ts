/**
 * LearnerProfile Domain Service — Fixed
 *
 * Uses DomainEventTypes from events, adds optional accountId scoping to findByAccountId
 * and findById.
 */

import type { LearnerProfile, ProfileStatus } from './entities';
import type { ILearnerProfileRepository } from './repository';
import { eventBus, DomainEventTypes } from '@/domains/events';

export class LearnerProfileDomainService {
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
      type: DomainEventTypes.PROFILE_CREATED,
      timestamp: now,
      payload: { profileId: created.id, accountId },
    });

    return created;
  }

  async findById(id: string, accountId?: string): Promise<LearnerProfile | null> {
    const profile = await this.repository.findById(id);
    if (!profile) return null;
    // If accountId is provided, verify ownership
    if (accountId && profile.accountId !== accountId) return null;
    return profile;
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    return this.repository.findByAccountId(accountId);
  }

  async update(id: string, updates: Partial<LearnerProfile>, accountId?: string): Promise<LearnerProfile | null> {
    const existing = await this.findById(id, accountId);
    if (!existing) return null;

    const updated = await this.repository.update(id, { ...updates, updatedAt: Date.now() });

    if (updated) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROFILE_UPDATED,
        timestamp: Date.now(),
        payload: { profileId: id },
      });
    }

    return updated;
  }

  async delete(id: string, accountId?: string): Promise<boolean> {
    const existing = await this.findById(id, accountId);
    if (!existing) return false;

    const deleted = await this.repository.delete(id);

    if (deleted && this.activeProfileId === id) {
      this.activeProfileId = null;
    }

    if (deleted) {
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.PROFILE_DELETED,
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
      type: DomainEventTypes.PROFILE_SELECTED,
      timestamp: Date.now(),
      payload: { profileId: id },
    });
  }

  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }
}
