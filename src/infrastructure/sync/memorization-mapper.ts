/**
 * MemorizationMapper — domain ↔ PowerSync row translation.
 *
 * This module owns the mapping between the domain entities
 * (`MemorizationRecord`, `ReviewLogEntry`) and the flat PowerSync
 * tables (`memorization_records`, `review_logs`).
 *
 *   - entity → row : write path (INSERT/UPSERT values + deterministic UUID)
 *   - row → entity : read path (coerces text/JSON columns back to domain)
 *   - id derivation : deterministic `recordUuid(userId, record)` so that
 *     an upsert on `memorization_records` is stable across users, and
 *     the Postgres `UNIQUE (user_id, book_id, chapter_number, verse_number,
 *     translation_id)` constraint is satisfied without duplicates.
 *
 * The mapper is pure (no I/O, no SDK import) so it is trivially unit-testable.
 * It does not import the PowerSync SDK or the DB singleton — repositories do.
 */

import type {
  MemorizationRecord,
  ReviewLogEntry,
  MemorizationStatus,
  WordPerformance,
  WordPerformanceSnapshot,
} from '@/domains/memorization/entities';
import type { FsrsState } from '@/domains/fsrs';
import { DEFAULT_FSRS_STATE } from '@/domains/fsrs';

// ============================================================================
// Row shapes (mirror of PowerSync/SQLite columns)
// ============================================================================

/** Row shape of the `memorization_records` PowerSync table. */
export interface MemorizationRecordRow {
  id: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  verse_number: number;
  end_verse: number | null;
  translation_id: string;
  bible_verse_reference: string;
  bible_verse_text: string;
  status: string;
  fsrs_state: string; // JSON-encoded FsrsState
  stability: number;
  difficulty: number;
  next_review_at: string | null; // ISO-8601
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  last_reviewed_at: string | null; // ISO-8601
  review_count: number;
  total_review_minutes: number;
  favorite: number; // 0|1
  tags: string; // JSON-encoded string[]
}

/** Row shape of the `review_logs` PowerSync table (insert-only). */
export interface ReviewLogRow {
  id: string;
  user_id: string;
  memorization_record_id: string;
  answered_at: string; // ISO-8601
  rating: string;
  actual_interval: number | null;
  predicted_interval: number;
  stability_before: number;
  stability_after: number;
  difficulty_before: number;
  difficulty_after: number;
  elapsed_days: number | null;
  repetitions: number;
  word_performance: string; // JSON-encoded WordPerformanceSnapshot[]
  created_at: string; // ISO-8601
}

// ============================================================================
// Deterministic record ID (UUIDv5-ish)
// ============================================================================

/**
 * Generate a stable pseudo-UUIDv5 from the tuple
 * `(userId, bookId, chapterNumber, verseNumber, endVerse, translationId)`.
 *
 * Using a deterministic ID is essential for the upsert path: the same record
 * (same verse, same user, same translation) must always map to the same
 * `id`, regardless of how many times it is saved. The alternative — a
 * random `crypto.randomUUID()` — would create a new row on every save and
 * violate the Postgres composite uniqueness constraint.
 *
 * The format is RFC-4122 compliant (8-4-4-4-12 hex, version=5, variant=10)
 * so it is stored in a `uuid` column without a type error. It is not a true
 * UUIDv5 (which requires an RFC-4180 namespace) but a deterministic
 * pseudo-UUID that preserves the shape and version byte; collisions across
 * different tuples are cryptographically negligible for a 128-bit hash.
 */
export function recordUuid(
  userId: string,
  record: Pick<MemorizationRecord, 'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'>,
): string {
  // Normalise optional endVerse to 0 for a single verse so that the tuple
  // is deterministic.
  const end = record.endVerse ?? 0;
  const seed = [
    userId,
    record.bookId,
    record.chapterNumber,
    record.verseNumber,
    end,
    record.translationId,
  ].join('|');

  // FNV-1a 64-bit, repeated twice to get 128 bits (32 bytes of hex).
  const hash1 = fnv1a64(seed);
  const hash2 = fnv1a64(seed + '|versyflow');
  const bytes = [...hash1, ...hash2];

  // RFC 4122 layout: set version 5 in byte 6 and variant bits in byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

/**
 * FNV-1a 64-bit. `input` is a JS string; the output is 8 bytes (big-endian
 * representation of the 64-bit hash).
 */
function fnv1a64(input: string): number[] {
  let h = 0xcbf29ce484222325n;
  const prime = 0x00000100000001b3n;
  for (let i = 0; i < input.length; i++) {
    const c = BigInt(input.charCodeAt(i));
    h ^= c;
    h = (h * prime) & 0xffffffffffffffffn;
  }
  const out: number[] = [];
  for (let b = 7; b >= 0; b--) {
    out.push(Number((h >> BigInt(b * 8)) & 0xffn));
  }
  return out;
}

function formatUuid(bytes: number[]): string {
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return (
    hex.slice(0, 8) +
    '-' +
    hex.slice(8, 12) +
    '-' +
    hex.slice(12, 16) +
    '-' +
    hex.slice(16, 20) +
    '-' +
    hex.slice(20)
  );
}

// ============================================================================
// Coercion helpers
// ============================================================================

function msToIso(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function coerceStatus(raw: string | undefined | null): MemorizationStatus {
  switch (raw) {
    case 'new':
    case 'in-progress':
    case 'mastered':
      return raw;
    default:
      return 'new';
  }
}

type RatingValue = ReviewLogEntry['rating'];

/**
 * Coerce an arbitrary string to the 4-value rating vocabulary. Defensive
 * default: any unknown value (legacy data, corruption) maps to `'again'`
 * so the reader does not break on unknown tokens.
 */
function toRating(raw: string | undefined | null): RatingValue {
  switch (raw) {
    case 'again':
    case 'hard':
    case 'good':
    case 'easy':
      return raw;
    default:
      return 'again';
  }
}

// ============================================================================
// Entity → Row
// ============================================================================

const DEFAULT_STABILITY = 0;
const DEFAULT_DIFFICULTY = 5;

/**
 * Convert a domain record into a `memorization_records` row. The `id` is
 * derived from the deterministic tuple — see {@link recordUuid}.
 */
export function memorizationRecordToRow(userId: string, record: MemorizationRecord): MemorizationRecordRow {
  const fsrsState: FsrsState = record.fsrsState ?? DEFAULT_FSRS_STATE;
  return {
    id: recordUuid(userId, record),
    user_id: userId,
    book_id: record.bookId,
    chapter_number: record.chapterNumber,
    verse_number: record.verseNumber,
    end_verse: record.endVerse ?? null,
    translation_id: record.translationId,
    bible_verse_reference: record.bibleVerseReference,
    bible_verse_text: record.bibleVerseText,
    status: record.status,
    fsrs_state: JSON.stringify(fsrsState),
    stability: fsrsState.stability ?? DEFAULT_STABILITY,
    difficulty: fsrsState.difficulty ?? DEFAULT_DIFFICULTY,
    next_review_at: msToIso(record.nextReviewAt),
    created_at: msToIso(record.createdAt) ?? new Date().toISOString(),
    updated_at: msToIso(record.lastReviewedAt ?? record.createdAt) ?? new Date().toISOString(),
    last_reviewed_at: msToIso(record.lastReviewedAt),
    review_count: record.reviewCount ?? 0,
    total_review_minutes: record.totalReviewMinutes ?? 0,
    favorite: record.favorite ? 1 : 0,
    tags: JSON.stringify(record.tags ?? []),
  };
}

/**
 * Convert a domain review-log entry into a `review_logs` row.
 * `id` MUST be a random UUIDv4 (one-to-many, append-only fact table).
 */
export function reviewLogToRow(userId: string, entry: ReviewLogEntry): ReviewLogRow {
  const nowIso = new Date().toISOString();
  const answeredMs = entry.answeredAt ?? Date.now();
  const answeredIso = msToIso(answeredMs) ?? nowIso;
  return {
    id: entry.id,
    user_id: userId,
    memorization_record_id: entry.memorizationRecordId,
    answered_at: answeredIso,
    rating: entry.rating,
    actual_interval: entry.actualInterval ?? null,
    predicted_interval: entry.predictedInterval ?? 0,
    stability_before: entry.stabilityBefore ?? DEFAULT_STABILITY,
    stability_after: entry.stabilityAfter ?? DEFAULT_STABILITY,
    difficulty_before: entry.difficultyBefore ?? DEFAULT_DIFFICULTY,
    difficulty_after: entry.difficultyAfter ?? DEFAULT_DIFFICULTY,
    elapsed_days: null,
    repetitions: 0,
    word_performance: JSON.stringify(entry.wordPerformance ?? []),
    created_at: answeredIso,
  };
}

// ============================================================================
// Row → Entity
// ============================================================================

/**
 * Convert a `memorization_records` row back into a domain entity.
 * `learnerProfileId` is reconstructed from `row.id` — see {@link recordUuid}
 * and the domain invariant (C-4).
 */
export function memorizationRowToRecord(row: MemorizationRecordRow): MemorizationRecord {
  const fsrsState: FsrsState = {
    ...DEFAULT_FSRS_STATE,
    ...safeParseJson<Partial<FsrsState>>(row.fsrs_state, {}),
  };
  const tags: string[] = safeParseJson<string[]>(row.tags, []);
  return {
    id: row.id,
    learnerProfileId: '', // LOCAL_ONLY (V1); see memorization-mapper note
    bookId: row.book_id,
    chapterNumber: row.chapter_number,
    verseNumber: row.verse_number,
    endVerse: row.end_verse ?? undefined,
    translationId: row.translation_id,
    bibleVerseReference: row.bible_verse_reference,
    bibleVerseText: row.bible_verse_text,
    status: coerceStatus(row.status),
    fsrsState,
    favorite: row.favorite === 1,
    tags,
    createdAt: isoToMs(row.created_at) ?? 0,
    lastReviewedAt: isoToMs(row.last_reviewed_at),
    nextReviewAt: isoToMs(row.next_review_at),
    reviewCount: row.review_count ?? 0,
    totalReviewMinutes: row.total_review_minutes ?? 0,
    wordPerformance: [] as WordPerformance[],
  };
}

/** Convert a `review_logs` row back into a domain entry. */
export function reviewLogRowToEntry(row: ReviewLogRow): ReviewLogEntry {
  const wordPerformance: WordPerformanceSnapshot[] = safeParseJson<WordPerformanceSnapshot[]>(
    row.word_performance,
    [],
  );
  return {
    id: row.id,
    memorizationRecordId: row.memorization_record_id,
    answeredAt: isoToMs(row.answered_at) ?? 0,
    rating: toRating(row.rating),
    actualInterval: row.actual_interval,
    predictedInterval: row.predicted_interval ?? 0,
    stabilityBefore: row.stability_before ?? 0,
    stabilityAfter: row.stability_after ?? 0,
    difficultyBefore: row.difficulty_before ?? 0,
    difficultyAfter: row.difficulty_after ?? 0,
    wordPerformance,
  };
}
