/**
 * Seed data for mock mode.
 *
 * Realistic (French, LSG-flavoured) test data so every screen has something
 * to show on a fresh browser: due reviews, mastered verses, a streak, a
 * family with members, review history, telemetry rows.
 *
 * Deterministic: re-seeding always produces the same ids (via `recordUuid`
 * and `stableId`), so manual test sessions stay comparable.
 *
 * `seedMockDatabase()` is idempotent-ish: it only writes when the store is
 * empty, unless `force` is passed (Dev panel "Réinitialiser").
 */

import type { MemorizationRecord, ReviewLogEntry } from '@/domains/memorization';
import type { FsrsState } from '@/domains/fsrs';
import type { LearnerProfile } from '@/domains/learner-profile';
import type { Family, FamilyMembership } from '@/domains/family';
import type { FamilyInvitation } from '@/domains/family-invitation';
import type { StreakRecord } from '@/domains/streaks/repository';
import { DEFAULT_FSRS_STATE } from '@/domains/fsrs';
import { recordUuid } from '@/infrastructure/sync/memorization-mapper';
import { mockDb } from './db';
import { getMockIdentity, stableId } from './identity';

const DAY = 86_400_000;
const now = () => Date.now();

export interface SeedVerseDefinition {
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  endVerse?: number;
  reference: string;
  text: string;
  translationId: string;
  status: MemorizationRecord['status'];
  /** Delay before the next review, in days (negative = overdue). */
  dueInDays: number;
  reviewCount: number;
  stability: number;
  difficulty: number;
  lastReviewedDaysAgo: number;
  favorite?: boolean;
  tags?: string[];
  totalReviewMinutes?: number;
}

/**
 * The demo corpus. Verses are public-domain (Louis Segond 1910).
 */
export const SEED_VERSES: SeedVerseDefinition[] = [
  {
    bookId: 'joh',
    chapterNumber: 3,
    verseNumber: 16,
    reference: 'Jean 3:16',
    text:
      "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que " +
      "quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
    translationId: 'lsg',
    status: 'in-progress',
    dueInDays: -1,
    reviewCount: 9,
    stability: 4.2,
    difficulty: 4.5,
    lastReviewedDaysAgo: 2,
    favorite: true,
    tags: ['amour', 'salut'],
    totalReviewMinutes: 24,
  },
  {
    bookId: 'psa',
    chapterNumber: 23,
    verseNumber: 1,
    reference: 'Psaumes 23:1',
    text: "L'Éternel est mon berger : je ne manquerai de rien.",
    translationId: 'lsg',
    status: 'mastered',
    dueInDays: 21,
    reviewCount: 18,
    stability: 42,
    difficulty: 3.1,
    lastReviewedDaysAgo: 6,
    favorite: true,
    tags: ['confiance'],
    totalReviewMinutes: 35,
  },
  {
    bookId: 'php',
    chapterNumber: 4,
    verseNumber: 13,
    reference: 'Philippiens 4:13',
    text: 'Je puis tout par celui qui me fortifie.',
    translationId: 'lsg',
    status: 'in-progress',
    dueInDays: 2,
    reviewCount: 6,
    stability: 6.5,
    difficulty: 3.8,
    lastReviewedDaysAgo: 1,
    tags: ['force'],
    totalReviewMinutes: 12,
  },
  {
    bookId: 'rom',
    chapterNumber: 8,
    verseNumber: 28,
    reference: 'Romains 8:28',
    text:
      'Nous savons, du reste, que toutes choses concourent au bien de ceux qui ' +
      "aiment Dieu, de ceux qui sont appelés selon son dessein.",
    translationId: 'lsg',
    status: 'new',
    dueInDays: 0,
    reviewCount: 0,
    stability: 1,
    difficulty: 5,
    lastReviewedDaysAgo: 0,
    tags: ['providence'],
  },
  {
    bookId: 'isa',
    chapterNumber: 40,
    verseNumber: 31,
    reference: 'Ésaïe 40:31',
    text:
      "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils " +
      "prennent le vol comme les aigles ; ils courent, et ne se lassent point.",
    translationId: 'lsg',
    status: 'in-progress',
    dueInDays: -3,
    reviewCount: 11,
    stability: 9.4,
    difficulty: 4.2,
    lastReviewedDaysAgo: 4,
    tags: ['espérance'],
    totalReviewMinutes: 27,
  },
  {
    bookId: 'pro',
    chapterNumber: 3,
    verseNumber: 5,
    endVerse: 6,
    reference: 'Proverbes 3:5-6',
    text:
      "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta " +
      'sagesse ; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.',
    translationId: 'lsg',
    status: 'in-progress',
    dueInDays: -2,
    reviewCount: 4,
    stability: 3.2,
    difficulty: 5.6,
    lastReviewedDaysAgo: 5,
    tags: ['sagesse'],
    totalReviewMinutes: 9,
  },
  {
    bookId: 'mat',
    chapterNumber: 11,
    verseNumber: 28,
    reference: 'Matthieu 11:28',
    text:
      'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
    translationId: 'lsg',
    status: 'mastered',
    dueInDays: 30,
    reviewCount: 22,
    stability: 61,
    difficulty: 2.8,
    lastReviewedDaysAgo: 12,
    totalReviewMinutes: 41,
  },
  {
    bookId: 'jos',
    chapterNumber: 1,
    verseNumber: 9,
    reference: 'Josué 1:9',
    text:
      "Fortifie-toi et prends courage. Ne t'effraie point et ne t'épouvante " +
      "point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.",
    translationId: 'lsg',
    status: 'new',
    dueInDays: 0,
    reviewCount: 0,
    stability: 1,
    difficulty: 5,
    lastReviewedDaysAgo: 0,
  },
];

function fsrsStateFor(verse: SeedVerseDefinition): FsrsState {
  return {
    ...DEFAULT_FSRS_STATE,
    stability: verse.stability,
    difficulty: verse.difficulty,
    recallProbability: verse.status === 'mastered' ? 0.96 : 0.88,
    lastInterval: Math.max(1, Math.round(verse.stability / 2)),
    nextInterval: Math.max(1, Math.round(verse.stability)),
    elapsedDays: verse.lastReviewedDaysAgo,
    repetitions: verse.reviewCount,
  };
}

/** Build the seeded memorization records for a given owner. */
export function buildSeedRecords(userId: string, profileId: string): MemorizationRecord[] {
  const base = now();
  return SEED_VERSES.map((verse) => {
    const id = recordUuid(userId, {
      bookId: verse.bookId,
      chapterNumber: verse.chapterNumber,
      verseNumber: verse.verseNumber,
      endVerse: verse.endVerse,
      translationId: verse.translationId,
    });
    return {
      id,
      targetId: id,
      targetType: verse.endVerse ? 'passage' : 'single-verse',
      learnerProfileId: profileId,
      bookId: verse.bookId,
      chapterNumber: verse.chapterNumber,
      verseNumber: verse.verseNumber,
      endVerse: verse.endVerse,
      translationId: verse.translationId,
      bibleVerseReference: verse.reference,
      bibleVerseText: verse.text,
      verseTexts: [verse.text],
      status: verse.status,
      fsrsState: fsrsStateFor(verse),
      favorite: verse.favorite ?? false,
      tags: verse.tags ?? [],
      createdAt: base - (verse.lastReviewedDaysAgo + 7) * DAY,
      lastReviewedAt:
        verse.reviewCount > 0 ? base - verse.lastReviewedDaysAgo * DAY : null,
      nextReviewAt: base + verse.dueInDays * DAY,
      reviewCount: verse.reviewCount,
      totalReviewMinutes: verse.totalReviewMinutes ?? 0,
      wordPerformance: [],
    } satisfies MemorizationRecord;
  });
}

/** Build review logs so the history / analytics screens have content. */
export function buildSeedReviewLogs(records: MemorizationRecord[]): ReviewLogEntry[] {
  const logs: ReviewLogEntry[] = [];
  const ratings: ReviewLogEntry['rating'][] = ['good', 'hard', 'good', 'easy', 'again', 'good'];
  for (const record of records) {
    const sessions = Math.min(record.reviewCount, 6);
    for (let i = 0; i < sessions; i += 1) {
      const daysAgo = (sessions - i) * 2 + 1;
      logs.push({
        id: stableId('log_', `${record.id}:${i}`),
        memorizationRecordId: record.id,
        answeredAt: now() - daysAgo * DAY,
        rating: ratings[i % ratings.length],
        actualInterval: Math.max(1, record.fsrsState.lastInterval),
        predictedInterval: Math.max(1, record.fsrsState.nextInterval),
        stabilityBefore: Math.max(0.5, record.fsrsState.stability - 1),
        stabilityAfter: record.fsrsState.stability,
        difficultyBefore: record.fsrsState.difficulty,
        difficultyAfter: record.fsrsState.difficulty,
        wordPerformance: [],
      });
    }
  }
  return logs;
}

function buildSeedProfiles(userId: string): LearnerProfile[] {
  const identity = getMockIdentity();
  const base = now() - 30 * DAY;
  return [
    {
      id: stableId('prf_', `${userId}:main`),
      accountId: userId,
      displayName: identity.displayName || 'Ami de la Parole',
      avatar: '🌱',
      slogan: 'Un verset à la fois',
      status: 'active',
      createdAt: base,
      updatedAt: now(),
    },
    {
      id: stableId('prf_', `${userId}:family`),
      accountId: userId,
      displayName: 'Lecture en famille',
      avatar: '👨‍👩‍👧',
      slogan: 'Grandir ensemble',
      status: 'active',
      createdAt: base + DAY,
      updatedAt: now(),
    },
  ];
}

function buildSeedFamily(userId: string): {
  families: Family[];
  memberships: FamilyMembership[];
  invitations: FamilyInvitation[];
} {
  const familyId = stableId('fam_', `${userId}:home`);
  const createdAt = now() - 14 * DAY;
  const companionA = stableId('usr_', 'grace@versyflow.test');
  const companionB = stableId('usr_', 'sophie@versyflow.test');
  return {
    families: [
      {
        id: familyId,
        ownerId: userId,
        name: 'Famille Béthel',
        color: '#D81B97',
        icon: '🏡',
        createdAt,
      },
    ],
    memberships: [
      {
        id: stableId('mbr_', `${familyId}:owner`),
        familyId,
        accountId: userId,
        role: 'owner',
        status: 'active',
        createdAt,
        joinedAt: createdAt,
      },
      {
        id: stableId('mbr_', `${familyId}:grace`),
        familyId,
        accountId: companionA,
        role: 'admin',
        status: 'active',
        createdAt: createdAt + DAY,
        joinedAt: createdAt + DAY,
      },
      {
        id: stableId('mbr_', `${familyId}:sophie`),
        familyId,
        accountId: companionB,
        role: 'member',
        status: 'pending',
        createdAt: createdAt + 2 * DAY,
        joinedAt: createdAt + 2 * DAY,
      },
    ],
    invitations: [
      {
        id: stableId('inv_', `${familyId}:pending`),
        familyId,
        createdBy: userId,
        token: 'VERSY-TEST-2026',
        status: 'active',
        expiresAt: now() + 7 * DAY,
        createdAt: now() - DAY,
      },
    ],
  };
}

function buildSeedStreaks(userId: string): StreakRecord[] {
  const streaks: StreakRecord[] = [];
  for (let i = 0; i < 9; i += 1) {
    const date = new Date(now() - i * DAY);
    const iso = date.toISOString().slice(0, 10);
    streaks.push({
      id: stableId('str_', `${userId}:${iso}`),
      userId,
      streakDate: iso,
      versesMemorized: i === 0 ? 1 : i % 3 === 0 ? 2 : 0,
      reviewsCompleted: i === 0 ? 3 : Math.max(0, 6 - i),
      sessionDurationMinutes: 8 + (i % 5) * 3,
      createdAt: date.toISOString(),
    });
  }
  return streaks;
}

export interface SeedOptions {
  /** Owner id. Defaults to the current mock identity. */
  userId?: string;
  /** Overwrite existing collections (Dev panel "Réinitialiser + seed"). */
  force?: boolean;
}

export interface SeedResult {
  userId: string;
  profileId: string;
  records: number;
  reviewLogs: number;
  seeded: boolean;
}

/**
 * Populate the mock database. No-op when data already exists unless `force`.
 */
export function seedMockDatabase(options: SeedOptions = {}): SeedResult {
  const identity = getMockIdentity();
  const userId = options.userId ?? identity.id;
  const existing = mockDb.counts();
  const hasData =
    existing.memorization_records > 0 || existing.learner_profiles > 0;

  const profiles = buildSeedProfiles(userId);
  const profileId = profiles[0].id;

  if (hasData && !options.force) {
    mockDb.setActiveUserId(userId);
    return {
      userId,
      profileId,
      records: existing.memorization_records,
      reviewLogs: existing.review_logs,
      seeded: false,
    };
  }

  const records = buildSeedRecords(userId, profileId);
  // The mock store is a document store: the SQL `user_id` column becomes an
  // explicit `userId` field on every owned row (the adapters filter on it).
  const ownedRecords = records.map((record) => ({ ...record, userId }));
  const reviewLogs = buildSeedReviewLogs(records).map((log) => ({ ...log, userId }));
  const { families, memberships, invitations } = buildSeedFamily(userId);
  const streaks = buildSeedStreaks(userId);

  mockDb.replace('users', [
    {
      id: userId,
      email: identity.email,
      display_name: identity.displayName,
      default_translation: 'lsg',
      ui_language: 'fr',
      created_at: new Date(now() - 30 * DAY).toISOString(),
    },
  ]);
  mockDb.replace('learner_profiles', profiles);
  mockDb.replace('memorization_records', ownedRecords);
  mockDb.replace('review_logs', reviewLogs);
  mockDb.replace('streaks', streaks);
  mockDb.replace('families', families);
  mockDb.replace('family_memberships', memberships);
  mockDb.replace('family_invitations', invitations);
  mockDb.replace('translation_preferences', [
    { id: stableId('pref_', `${userId}:translation`), userId, translationId: 'lsg' },
  ]);
  mockDb.setActiveUserId(userId);

  return {
    userId,
    profileId,
    records: records.length,
    reviewLogs: reviewLogs.length,
    seeded: true,
  };
}

/** Wipe the mock store and re-seed from scratch. */
export function resetMockDatabase(): SeedResult {
  const userId = getMockIdentity().id;
  mockDb.reset();
  mockDb.setActiveUserId(userId);
  return seedMockDatabase({ userId, force: true });
}

/**
 * Re-own every mock row from one account id to another.
 *
 * Manual testers often explore the seeded demo data first, then type their
 * own email in the login screen — which changes the identity (and therefore
 * the owner id). Instead of silently losing the seeded session, the mock auth
 * service transfers ownership of the existing rows to the new account so the
 * data stays on screen.
 *
 * Returns the number of rows updated.
 */
export function reassignMockOwner(fromUserId: string, toUserId: string): number {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return 0;
  let changed = 0;

  const reown = <T extends Record<string, unknown>>(
    collection: Parameters<typeof mockDb.list>[0],
    field: string,
  ) => {
    const rows = mockDb.list<T>(collection);
    let touched = false;
    const next = rows.map((row) => {
      if (row[field] !== fromUserId) return row;
      touched = true;
      return { ...row, [field]: toUserId } as T;
    });
    if (touched) {
      mockDb.replace(collection, next);
      changed += next.filter((row) => row[field] === toUserId).length;
    }
  };

  reown('memorization_records', 'userId');
  reown('review_logs', 'userId');
  reown('streaks', 'userId');
  reown('learner_profiles', 'accountId');
  reown('families', 'ownerId');
  reown('family_memberships', 'accountId');
  reown('family_invitations', 'createdBy');
  reown('translation_preferences', 'userId');
  reown('telemetry_events', 'userId');

  return changed;
}

/**
 * Seed only if needed. Called once at boot by the mock composition root and
 * by the Dev panel.
 */
export function ensureMockSeed(): SeedResult {
  return seedMockDatabase();
}
