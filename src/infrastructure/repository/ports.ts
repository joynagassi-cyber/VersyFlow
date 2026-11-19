/**
 * Repository ports — the contracts the app depends on, with no implementation.
 *
 * These interfaces used to live inside the cloud adapters
 * (once, inside the cloud adapters). VersyFlow is frontend-only: the only
 * implementation is the local one (`src/dev/mock/repositories.ts`), so the
 * contracts live here, in a file that imports nothing but domain types.
 *
 * A future backend plugs in by implementing these ports and changing the
 * single composition root (`./index`), never the screens.
 */

import type { MemorizationRecord, MemorizationStatus, ReviewLogEntry } from '@/domains/memorization/entities';

/** Read/write surface for memorization records, scoped by owner id. */
export interface IMemorizationRepository {
  /** Upsert the record for a user + verse + translation. */
  upsert(
    userId: string,
    record: Omit<MemorizationRecord, 'id' | 'learnerProfileId' | 'updatedAt'>,
  ): Promise<void>;
  /** Read a single record by deterministic id, or `null` when absent. */
  getById(userId: string, recordId: string): Promise<MemorizationRecord | null>;
  /** All records for a user. */
  listByUser(userId: string): Promise<MemorizationRecord[]>;
  /** Records with a due review. `mastered` is excluded. */
  listDueByUser(userId: string, beforeMs?: number): Promise<MemorizationRecord[]>;
  /** Records matching a status. */
  listByStatus(userId: string, status: MemorizationStatus): Promise<MemorizationRecord[]>;
  /** Delete a record by its deterministic id. */
  remove(userId: string, recordId: string): Promise<void>;
  /** Deterministic record id for a verse tuple. */
  computeId(
    userId: string,
    record: Pick<
      MemorizationRecord,
      'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'
    >,
  ): string;
}

/** Append-only review log. Entries are immutable once written. */
export interface IReviewLogRepository {
  /** Insert a review log entry. Idempotent on `id`. */
  append(userId: string, entry: ReviewLogEntry): Promise<void>;
  /** All entries for a given memorization record, most recent first. */
  listByRecord(recordId: string): Promise<ReviewLogEntry[]>;
  /** All entries for a user, most recent first. */
  listByUser(userId: string): Promise<ReviewLogEntry[]>;
}

/** Read/write surface for the user's preferred Bible translation. */
export interface ITranslationPreferenceRepository {
  /** The current user's stored preference, or `null` when absent. */
  get(): Promise<string | null>;
  /**
   * Persist a translation id as the current user's preference. `catalog` is
   * the allowed translation id list (defaults to the bundled catalogue when
   * omitted). Rejects an id that is not in the catalogue.
   */
  set(translationId: string, catalog?: readonly string[]): Promise<void>;
}

/**
 * Deterministic, RFC-4122-shaped id derived from a verse tuple
 * (`user | book | chapter | verse | end | translation`).
 *
 * Same tuple → same id, which is what makes a save an upsert instead of a
 * duplicate row. It survives a backend migration unchanged: the id is a pure
 * function of the tuple, so the future server can recompute it too.
 */
export function recordUuid(
  userId: string,
  record: Pick<
    MemorizationRecord,
    'bookId' | 'chapterNumber' | 'verseNumber' | 'endVerse' | 'translationId'
  >,
): string {
  const end = record.endVerse ?? 0;
  const seed = [
    userId,
    record.bookId,
    record.chapterNumber,
    record.verseNumber,
    end,
    record.translationId,
  ].join('|');

  // FNV-1a 64-bit, twice, to fill 128 bits.
  const bytes = [...fnv1a64(seed), ...fnv1a64(`${seed}|versyflow`)];
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

/**
 * FNV-1a 64-bit → 8 big-endian bytes.
 *
 * Kept byte-for-byte identical to the implementation that produced every id
 * already persisted on users' devices: changing it would orphan their
 * memorization records.
 */
function fnv1a64(input: string): number[] {
  let h = 0xcbf29ce484222325n;
  const prime = 0x00000100000001b3n;
  for (let index = 0; index < input.length; index += 1) {
    h ^= BigInt(input.charCodeAt(index));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  const out: number[] = [];
  for (let byte = 7; byte >= 0; byte -= 1) {
    out.push(Number((h >> BigInt(byte * 8)) & 0xffn));
  }
  return out;
}

/** 16 bytes → `8-4-4-4-12` hex. */
function formatUuid(bytes: number[]): string {
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
