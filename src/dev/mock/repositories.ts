/**
 * Mock repositories — the mock-mode adapters for every domain port.
 *
 * They implement the exact same interfaces as the PowerSync adapters
 * (`IMemorizationRepository`, `IReviewLogRepository`, …) but store domain
 * entities in `MockDb` (localStorage) instead of SQLite rows. The rest of the
 * app — domain services, hooks, screens — is unchanged: swapping the
 * composition root is enough to run the whole frontend with no backend.
 *
 * Every mutation is also forwarded to the local test collector
 * (`recordMockMutation`) so a manual session can be replayed from the
 * dashboard.
 */

import type { IMemorizationRepository } from '@/infrastructure/repository/memorization-repository-powersync';
import type { IReviewLogRepository } from '@/infrastructure/repository/review-log-repository-powersync';
import type { ITranslationPreferenceRepository } from '@/infrastructure/repository/translation-preference-repository-powersync';
import type { ILearnerProfileRepository } from '@/domains/learner-profile/repository';
import type { IFamilyRepository } from '@/domains/family/repository';
import type { IFamilyInvitationRepository } from '@/domains/family-invitation/repository';
import type { IStreakRepository, StreakRecord } from '@/domains/streaks/repository';
import type { ITelemetryUploadPort } from '@/infrastructure/telemetry/upload-adapter';
import type { MemorizationRecord } from '@/domains/memorization';
import type { ReviewLogEntry } from '@/domains/memorization';
import type { LearnerProfile } from '@/domains/learner-profile';
import type { Family, FamilyMembership } from '@/domains/family';
import type { FamilyInvitation } from '@/domains/family-invitation';
import type { TelemetryEvent } from '@/domains/telemetry/entities';
import { recordUuid } from '@/infrastructure/sync/memorization-mapper';
import { DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';
import { mockDb } from './db';
import { getMockUserId, stableId } from './identity';
import { recordTestEvent } from '../local-backend';

/** Synthetic `user_id` owner for rows created before a login. */
function owner(userId: string | null | undefined): string {
  return userId ?? getMockUserId();
}

/** Mirror a mutation to the local collector (fire-and-forget). */
export function recordMockMutation(
  collection: string,
  action: 'create' | 'update' | 'delete',
  details: Record<string, unknown>,
): void {
  recordTestEvent('mock.write', { collection, action, ...details });
}

function randomId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return stableId(prefix, `${Date.now()}:${Math.random()}`);
}

// =====================================================================
// Memorization records
// =====================================================================

interface StoredRecord extends MemorizationRecord {
  userId: string;
}

export class MockMemorizationRepository implements IMemorizationRepository {
  private rows(): StoredRecord[] {
    return mockDb.list<StoredRecord>('memorization_records');
  }

  computeId(
    userId: string,
    record: Pick<
      MemorizationRecord,
      'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'
    >,
  ): string {
    return recordUuid(owner(userId), record);
  }

  async upsert(
    userId: string,
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void> {
    const uid = owner(userId);
    const id = recordUuid(uid, record);
    const existing = this.rows().find((row) => row.id === id);
    const next: StoredRecord = {
      ...record,
      id,
      userId: uid,
      learnerProfileId: existing?.learnerProfileId ?? '',
      createdAt: existing?.createdAt ?? record.createdAt ?? Date.now(),
    };
    mockDb.put('memorization_records', next);
    recordMockMutation('memorization_records', existing ? 'update' : 'create', {
      id,
      reference: record.bibleVerseReference,
      status: record.status,
    });
  }

  async getById(userId: string, recordId: string): Promise<MemorizationRecord | null> {
    const uid = owner(userId);
    return this.rows().find((row) => row.id === recordId && row.userId === uid) ?? null;
  }

  async listByUser(userId: string): Promise<MemorizationRecord[]> {
    const uid = owner(userId);
    return this.rows()
      .filter((row) => row.userId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listDueByUser(userId: string, beforeMs?: number): Promise<MemorizationRecord[]> {
    const uid = owner(userId);
    const cutoff = beforeMs ?? Date.now();
    return this.rows()
      .filter(
        (row) =>
          row.userId === uid &&
          row.status !== 'mastered' &&
          row.nextReviewAt !== null &&
          row.nextReviewAt <= cutoff,
      )
      .sort((a, b) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0));
  }

  async listByStatus(
    userId: string,
    status: MemorizationRecord['status'],
  ): Promise<MemorizationRecord[]> {
    const uid = owner(userId);
    return this.rows().filter((row) => row.userId === uid && row.status === status);
  }

  async remove(userId: string, recordId: string): Promise<void> {
    const uid = owner(userId);
    mockDb.removeWhere<StoredRecord>(
      'memorization_records',
      (row) => row.id === recordId && row.userId === uid,
    );
    recordMockMutation('memorization_records', 'delete', { id: recordId });
  }
}

// =====================================================================
// Review logs
// =====================================================================

interface StoredReviewLog extends ReviewLogEntry {
  userId: string;
}

export class MockReviewLogRepository implements IReviewLogRepository {
  async append(userId: string, entry: ReviewLogEntry): Promise<void> {
    const uid = owner(userId);
    const id = entry.id || randomId('log_');
    mockDb.put<StoredReviewLog>('review_logs', {
      ...entry,
      id,
      userId: uid,
    });
    recordMockMutation('review_logs', 'create', {
      id,
      recordId: entry.memorizationRecordId,
      rating: entry.rating,
    });
  }

  async listByRecord(recordId: string): Promise<ReviewLogEntry[]> {
    return mockDb
      .list<StoredReviewLog>('review_logs')
      .filter((row) => row.memorizationRecordId === recordId)
      .sort((a, b) => b.answeredAt - a.answeredAt);
  }

  async listByUser(userId: string): Promise<ReviewLogEntry[]> {
    const uid = owner(userId);
    return mockDb
      .list<StoredReviewLog>('review_logs')
      .filter((row) => row.userId === uid)
      .sort((a, b) => b.answeredAt - a.answeredAt);
  }
}

// =====================================================================
// Learner profiles
// =====================================================================

export class MockLearnerProfileRepository implements ILearnerProfileRepository {
  async findById(id: string): Promise<LearnerProfile | null> {
    return mockDb.list<LearnerProfile>('learner_profiles').find((p) => p.id === id) ?? null;
  }

  async findByAccountId(accountId: string): Promise<LearnerProfile[]> {
    const uid = owner(accountId);
    return mockDb
      .list<LearnerProfile>('learner_profiles')
      .filter((p) => p.accountId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async create(
    profile: Omit<LearnerProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LearnerProfile> {
    const now = Date.now();
    const created: LearnerProfile = {
      ...profile,
      accountId: owner(profile.accountId),
      id: randomId('prf_'),
      createdAt: now,
      updatedAt: now,
    };
    mockDb.put('learner_profiles', created);
    recordMockMutation('learner_profiles', 'create', {
      id: created.id,
      displayName: created.displayName,
    });
    return created;
  }

  async update(
    id: string,
    updates: Partial<LearnerProfile>,
  ): Promise<LearnerProfile | null> {
    const updated = mockDb.patch<LearnerProfile>('learner_profiles', id, {
      ...updates,
      updatedAt: Date.now(),
    });
    if (updated) {
      recordMockMutation('learner_profiles', 'update', { id });
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const removed = mockDb.removeWhere<LearnerProfile>(
      'learner_profiles',
      (p) => p.id === id,
    );
    if (removed > 0) recordMockMutation('learner_profiles', 'delete', { id });
    return removed > 0;
  }
}

// =====================================================================
// Family
// =====================================================================

export class MockFamilyRepository implements IFamilyRepository {
  async findById(id: string): Promise<Family | null> {
    return mockDb.list<Family>('families').find((f) => f.id === id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<Family[]> {
    const uid = owner(ownerId);
    return mockDb.list<Family>('families').filter((f) => f.ownerId === uid);
  }

  async create(family: Omit<Family, 'id' | 'createdAt'>): Promise<Family> {
    const created: Family = { ...family, id: randomId('fam_'), createdAt: Date.now() };
    mockDb.put('families', created);
    recordMockMutation('families', 'create', { id: created.id, name: created.name });
    return created;
  }

  async update(id: string, updates: Partial<Family>): Promise<Family | null> {
    const updated = mockDb.patch<Family>('families', id, updates);
    if (updated) recordMockMutation('families', 'update', { id });
    return updated;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const family = await this.findById(id);
    if (!family || family.ownerId !== owner(ownerId)) return false;
    mockDb.removeWhere<Family>('families', (f) => f.id === id);
    mockDb.removeWhere<FamilyMembership>('family_memberships', (m) => m.familyId === id);
    recordMockMutation('families', 'delete', { id });
    return true;
  }

  async getMembers(familyId: string): Promise<FamilyMembership[]> {
    return mockDb
      .list<FamilyMembership>('family_memberships')
      .filter((m) => m.familyId === familyId);
  }

  async addMember(
    familyId: string,
    membership: Omit<FamilyMembership, 'id' | 'createdAt' | 'joinedAt' | 'familyId'>,
  ): Promise<FamilyMembership> {
    const now = Date.now();
    const created: FamilyMembership = {
      ...membership,
      id: randomId('mbr_'),
      familyId,
      createdAt: now,
      joinedAt: now,
    };
    mockDb.put('family_memberships', created);
    recordMockMutation('family_memberships', 'create', {
      id: created.id,
      familyId,
      role: created.role,
    });
    return created;
  }

  async removeMember(familyId: string, accountId: string): Promise<boolean> {
    const removed = mockDb.removeWhere<FamilyMembership>(
      'family_memberships',
      (m) => m.familyId === familyId && m.accountId === accountId,
    );
    if (removed > 0) {
      recordMockMutation('family_memberships', 'delete', { familyId, accountId });
    }
    return removed > 0;
  }
}

export class MockFamilyInvitationRepository implements IFamilyInvitationRepository {
  async findById(id: string): Promise<FamilyInvitation | null> {
    return (
      mockDb.list<FamilyInvitation>('family_invitations').find((i) => i.id === id) ?? null
    );
  }

  async findByToken(token: string): Promise<FamilyInvitation | null> {
    return (
      mockDb
        .list<FamilyInvitation>('family_invitations')
        .find((i) => i.token === token) ?? null
    );
  }

  async create(
    invitation: Omit<FamilyInvitation, 'id' | 'createdAt' | 'expiresAt'> & {
      expiresInDays?: number;
    },
  ): Promise<FamilyInvitation> {
    const now = Date.now();
    const days = invitation.expiresInDays ?? 7;
    const created: FamilyInvitation = {
      id: randomId('inv_'),
      familyId: invitation.familyId,
      createdBy: invitation.createdBy,
      token: invitation.token || randomId('TOK').toUpperCase().slice(0, 12),
      status: invitation.status ?? 'active',
      createdAt: now,
      expiresAt: now + days * 86_400_000,
    };
    mockDb.put('family_invitations', created);
    recordMockMutation('family_invitations', 'create', {
      id: created.id,
      token: created.token,
    });
    return created;
  }

  async markUsed(id: string): Promise<boolean> {
    const updated = mockDb.patch<FamilyInvitation>('family_invitations', id, {
      status: 'used',
    });
    return Boolean(updated);
  }

  async revoke(id: string): Promise<boolean> {
    const updated = mockDb.patch<FamilyInvitation>('family_invitations', id, {
      status: 'revoked',
    });
    return Boolean(updated);
  }

  async expirePastDue(): Promise<number> {
    const now = Date.now();
    const rows = mockDb.list<FamilyInvitation>('family_invitations');
    let expired = 0;
    for (const row of rows) {
      if (row.status === 'active' && row.expiresAt < now) {
        mockDb.patch<FamilyInvitation>('family_invitations', row.id, { status: 'expired' });
        expired += 1;
      }
    }
    return expired;
  }
}

// =====================================================================
// Streaks
// =====================================================================

export class MockStreakRepository implements IStreakRepository {
  private recordId(userId: string, streakDate: string): string {
    return recordUuid(userId, {
      bookId: `streak:${streakDate}`,
      chapterNumber: 0,
      verseNumber: 0,
      endVerse: undefined,
      translationId: 'streak',
    });
  }

  async insert(record: Omit<StreakRecord, 'id' | 'createdAt'>): Promise<void> {
    const uid = owner(record.userId);
    const id = this.recordId(uid, record.streakDate);
    mockDb.put<StreakRecord>('streaks', {
      ...record,
      userId: uid,
      id,
      createdAt: new Date().toISOString(),
    });
    recordMockMutation('streaks', 'create', {
      id,
      date: record.streakDate,
      reviews: record.reviewsCompleted,
    });
  }

  async getForDate(userId: string, streakDate: string): Promise<StreakRecord | null> {
    const uid = owner(userId);
    return (
      mockDb
        .list<StreakRecord>('streaks')
        .find((s) => s.userId === uid && s.streakDate === streakDate) ?? null
    );
  }
}

// =====================================================================
// Translation preference
// =====================================================================

interface StoredPreference {
  id: string;
  userId: string;
  translationId: string;
}

const FALLBACK_CATALOG = DEFAULT_BIBLE_TRANSLATIONS.map((t) => t.id);

export class MockTranslationPreferenceRepository
  implements ITranslationPreferenceRepository
{
  async get(): Promise<string | null> {
    const uid = owner(null);
    const row = mockDb
      .list<StoredPreference>('translation_preferences')
      .find((p) => p.userId === uid);
    return row?.translationId ?? null;
  }

  async set(translationId: string, catalog?: readonly string[]): Promise<void> {
    const allowed = catalog ?? FALLBACK_CATALOG;
    if (!allowed.includes(translationId)) {
      throw new Error(`[mock] Translation inconnue: ${translationId}`);
    }
    const uid = owner(null);
    const existing = mockDb
      .list<StoredPreference>('translation_preferences')
      .find((p) => p.userId === uid);
    const next: StoredPreference = {
      id: existing?.id ?? stableId('pref_', `${uid}:translation`),
      userId: uid,
      translationId,
    };
    mockDb.put('translation_preferences', next);
    recordMockMutation('translation_preferences', 'update', { translationId });
  }
}

// =====================================================================
// Telemetry
// =====================================================================

interface StoredTelemetry {
  id: string;
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
  sessionId: string | null;
  createdAt: string;
}

export class MockTelemetryUploadPort implements ITelemetryUploadPort {
  async upload(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) return;
    const uid = owner(null);
    for (const event of events) {
      mockDb.put<StoredTelemetry>('telemetry_events', {
        id: randomId('tel_'),
        userId: uid,
        eventType: event.eventType,
        payload: (event.payload ?? {}) as Record<string, unknown>,
        sessionId: event.sessionId ?? null,
        createdAt: new Date(event.timestamp).toISOString(),
      });
    }
    recordTestEvent('telemetry.batch', {
      count: events.length,
      types: events.map((e) => e.eventType),
    });
  }
}
