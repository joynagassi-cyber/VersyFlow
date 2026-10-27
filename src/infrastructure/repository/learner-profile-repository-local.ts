/**
 * LearnerProfile Repository — Local (In-Memory) Adapter
 *
 * In-memory implementation of ILearnerProfileRepository using Map + UUID v4.
 * Used for offline development and testing before PowerSync binding is ready.
 */

import type { LearnerProfile } from '@/domains/learner-profile';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';

function generateId(): string {
  return crypto.randomUUID();
}

export class LearnerProfileRepositoryLocal implements ILearnerProfileRepository {
  private profiles = new Map<string, LearnerProfile>();

  async findById(id: string): Promise<LearnerProfile | null> {
    return this.profiles.get(id) ?? null;
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    return Array.from(this.profiles.values()).filter(p => p.accountId === accountId);
  }

  async create(profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearnerProfile> {
    const id = generateId();
    const now = Date.now();
    const record: LearnerProfile = { ...profile, id, createdAt: now, updatedAt: now };
    this.profiles.set(id, record);
    return record;
  }

  async update(id: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile | null> {
    const existing = this.profiles.get(id);
    if (!existing) return null;
    const updated: LearnerProfile = { ...existing, ...updates, updatedAt: Date.now() };
    this.profiles.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.profiles.has(id)) return false;
    this.profiles.delete(id);
    return true;
  }

  /** Clear all data — useful for tests */
  clear(): void {
    this.profiles.clear();
  }
}
