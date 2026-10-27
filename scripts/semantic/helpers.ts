/**
 * Semantic layer — shared helpers + entity types for Stages A–H.
 *
 * These are pure helpers shared across the pipeline; they are tested
 * directly in tests/semantic/ and must remain side-effect free.
 */

// ---- enums (as const + union types, mirroring the MemorizationStatus
//      pattern in src/domains/memorization/entities.ts) ----

export const CONCEPT_ROLES = ['PRIMARY', 'SECONDARY', 'CONTRAST', 'RELATED'] as const;
export type ConceptRole = (typeof CONCEPT_ROLES)[number];

export const CONCEPT_RELATION_TYPES = ['RELATED', 'CONTRASTS', 'SUPPORTS', 'CHILD_OF'] as const;
export type ConceptRelationType = (typeof CONCEPT_RELATION_TYPES)[number];

export const VERSE_RELATION_TYPES = ['CROSS_REFERENCE', 'SHARED_CONCEPT', 'SAME_COMMUNITY'] as const;
export type VerseRelationType = (typeof VERSE_RELATION_TYPES)[number];

export const CONCEPT_STATUSES = ['unresolved', 'accepted', 'rejected'] as const;
export type ConceptStatus = (typeof CONCEPT_STATUSES)[number];

export const CONCEPT_KINDS = ['TOPIC', 'PERSON', 'EVENT', 'TEACHING', 'OTHER'] as const;
export type ConceptKind = (typeof CONCEPT_KINDS)[number];

// ---------------------------------------------------------------------------
// Canonical verse-reference system (the Stage B core).
//
// `bookId:chapter:verse` is the ONLY verse identifier in the semantic
// layer. It is translation-independent and never a display string, and
// never a memorization record id.
// ---------------------------------------------------------------------------

/**
 * Build the canonical verse key `bookId:chapter:verse` (e.g. `joh:3:16`).
 */
export function verseKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

/** Parse a canonical verse key back into its parts, or null if malformed. */
export function parseVerseKey(key: string): { bookId: string; chapter: number; verse: number } | null {
  const m = /^([a-z0-9]+):(\d+):(\d+)$/i.exec(String(key).trim());
  if (!m) return null;
  const bookId = m[1].toLowerCase();
  const chapter = Number(m[2]);
  const verse = Number(m[3]);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || verse < 1) return null;
  return { bookId, chapter, verse };
}

/** One aligned source-dataset reference (Stage A / B output). */
export interface AlignedRef {
  bookId: string; // VersyFlow canonical book id
  chapter: number;
  verse: number;
  /** Canonical, translation-independent verse key: `bookId:chapter:verse`. */
  verseId: string;
  /** The raw reference string as it appeared in the source dataset. */
  raw: string;
  /** The dataset this reference came from (e.g. 'nave', 'torrey'). */
  source: string;
}

// ---------------------------------------------------------------------------
// Deterministic identifiers
// ---------------------------------------------------------------------------

/** FNV-1a 32-bit hash of a string (unsigned). */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic UUID-shaped identifier from a seed. Not a random UUID —
 * stable across runs, which is what idempotency requires.
 */
export function detUuid(seed: string): string {
  const f = (suffix: string, len: number) => fnv1a(seed + ':' + suffix).toString(16).padStart(len, '0');
  const h = f('a', 8) + f('b', 4) + f('c', 4) + f('d', 4) + f('e', 12);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${h[16]}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// ---------------------------------------------------------------------------
// Label normalization (deterministic casefold + NFC + accent strip)
// ---------------------------------------------------------------------------

/** Casefold a label: trim, lowercase, NFC-normalize, collapse whitespace. */
export function casefold(label: string): string {
  return String(label).normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Strip diacritics from an already-casefolded label: "fé" → "fe". */
export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[̀-ͯ]/g, '');
}

/** Canonical concept key: `source:casefold(stripAccents(label))`. */
export function conceptKey(source: string, label: string): string {
  return `${source}:${stripDiacritics(casefold(label))}`;
}

// ---------------------------------------------------------------------------
// Small pure string helpers
// ---------------------------------------------------------------------------

/** Deterministic token set for similarity scoring (word multiset). */
export function tokens(label: string): string[] {
  return casefold(label)
    .split(/[^a-z0-9'’-]+/i)
    .filter((t) => t.length > 1 && t !== 'of' && t !== 'la' && t !== 'le' && t !== 'les' && t !== 'un' && t !== 'une');
}

/** Jaccard similarity over word sets, in [0,1]. */
export function jaccard(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Trim a generated community name to at most `maxWords` words. */
export function clampCommunityName(name: string, maxWords = 6): string {
  const words = name.trim().split(/\s+/);
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') : words.join(' ');
}

// ---------------------------------------------------------------------------
// Pipeline bookkeeping
// ---------------------------------------------------------------------------

export interface StageResult {
  stage: string;
  ok: boolean;
  counts: Record<string, number>;
  durationMs: number;
  errors: string[];
}

export interface PipelineReport {
  ranAt: string;
  idempotent: boolean;
  stages: StageResult[];
  validation: { passed: boolean; details: Record<string, string> };
}
