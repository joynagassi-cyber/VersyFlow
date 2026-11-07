import type { LearnerProfile, ILearnerProfileRepository } from '@/domains/learner-profile';

/** Profiles persist only in the isolated demo storage. */
export class LearnerProfileRepositoryDemo implements ILearnerProfileRepository {
  private readonly key = 'versyflow:demo:learner-profiles';
  private read(): LearnerProfile[] {
    try { const value: unknown = JSON.parse(localStorage.getItem(this.key) || '[]'); return Array.isArray(value) ? value as LearnerProfile[] : []; }
    catch { return []; }
  }
  private save(profiles: LearnerProfile[]) { localStorage.setItem(this.key, JSON.stringify(profiles)); }
  async findById(id: string) { return this.read().find((p) => p.id === id) ?? null; }
  async findByAccountId(accountId: string) { return this.read().filter((p) => p.accountId === accountId); }
  async create(profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now(); const record = { ...profile, id: `demo-${crypto.randomUUID()}`, createdAt: now, updatedAt: now };
    this.save([...this.read(), record]); return record;
  }
  async update(id: string, updates: Partial<LearnerProfile>) {
    const profiles = this.read(); const index = profiles.findIndex((p) => p.id === id);
    if (index < 0) return null;
    const current = profiles[index]; const record = { ...current, ...updates, id: current.id, accountId: current.accountId, createdAt: current.createdAt, updatedAt: Date.now() };
    profiles[index] = record; this.save(profiles); return record;
  }
  async delete(id: string) { const profiles = this.read(); const remaining = profiles.filter((p) => p.id !== id); this.save(remaining); return remaining.length !== profiles.length; }
}
