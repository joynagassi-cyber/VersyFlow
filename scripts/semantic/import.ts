/**
 * Stage A — Import (DETERMINISTIC, no LLM).
 *
 * Normalizes the three input sources into pipeline-internal shapes:
 *
 *   1. The 35 built Bible datasets (`data/bible/*.json`) → verse universe
 *      (translation-independent `bookId:chapter:verse` keys) + dataset
 *      manifest with checksums.
 *   2. NEUU topic/crossref/dictionary layers under
 *      `data/bible/semantic/raw/01_parsed|01_processed|02_unified|
 *      01_structured/` → `RawTopic` / `RawConceptEdge` candidates.
 *      These layers are OPTIONAL: when the remote repos are unreachable
 *      (as on this box — see the decision doc), `importAllLayers` returns
 *      empty topic lists and the pipeline runs on the **documented
 *      minimal seed** (`buildMinimalSeed`).
 *   3. The minimal seed (fixed 50-concept list + deterministic
 *      co-occurrence graph) → `SeedConcept` / `SeedRelation` rows.
 *
 * Every parser here is structure-aware: `JSON.parse` on well-formed
 * dataset files, a strict typed reader on layer files, and typed table
 * literals for the seed. No regex-patch chains; the one regex in
 * `toRawRef` is the *only* tolerance for the three documented reference
 * encodings of a layer topic (object / `ref` string / bare string).
 *
 * All ids and timestamps are deterministic (`detUuid`, pinned `now`)
 * so a rebuild of the same inputs is byte-identical — git-safe.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { alignBookId } from './align';
import { detUuid, casefold, verseKey } from './helpers';
import type { AlignedRef } from './helpers';
import { buildSeedConcepts } from './concepts/seed';

/** Pinned build timestamp — keeps `createdAt`/`updatedAt` byte-stable. */
export const DEFAULT_NOW = '2026-09-13T22:00:43.494Z';

// ---------------------------------------------------------------------------
// Dataset manifest (35 built translations under data/bible/)
// ---------------------------------------------------------------------------

interface DatasetBookLike {
  id: string;
  chapters: Array<{ number: number; verses: Array<{ number: number }> }>;
}

export interface DatasetMeta {
  id: string;
  language: string;
  name: string;
  bookCount: number;
  verseCount: number;
  /** FNV-seeded stability checksum (NOT cryptographic). */
  checksum: string;
  /** File name under data/bible/, e.g. 'web.json'. */
  file: string;
}

export interface VerseUniverse {
  /** Sorted canonical verse keys present in at least one dataset. */
  verses: string[];
  /** `bookId:chapter` → verse keys in the chapter (for same-chapter rules). */
  byChapter: Record<string, string[]>;
  /** Book ids actually present in the union of datasets (66 canonical). */
  bookIds: string[];
}

function fnv1aHex(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Read `data/bible/*.json` (excluding the catalog) and build the verse
 * universe.  Books whose ids do not resolve via `alignBookId` are
 * skipped and counted — the 66 canonical ids always resolve; extra
 * Apocrypha ids in some datasets (e.g. 'oth', 'esg') do not.
 */
export function loadVerseUniverse(
  bibleDir: string,
  errors: string[]
): { datasets: DatasetMeta[]; universe: VerseUniverse } {
  const files = readdirSync(bibleDir)
    .filter((f) => f.endsWith('.json') && f !== 'dataset-catalog.json')
    .sort();
  const datasets: DatasetMeta[] = [];
  const set = new Set<string>();
  const byChapter: Record<string, string[]> = {};
  const bookSet = new Set<string>();
  let skippedBooks = 0;

  for (const file of files) {
    const path = join(bibleDir, file);
    let raw: string;
    try {
      raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
    } catch (e) {
      errors.push(`failed to read ${file}: ${(e as Error).message}`);
      continue;
    }
    let parsed: {
      id?: string;
      language?: string;
      name?: string;
      books?: DatasetBookLike[];
    };
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      errors.push(`failed to parse ${file}: ${(e as Error).message}`);
      continue;
    }
    const books = parsed.books ?? [];
    let verseCount = 0;
    for (const b of books) {
      const bid = alignBookId(b.id);
      if (!bid) {
        skippedBooks++;
        continue;
      }
      bookSet.add(bid);
      for (const c of b.chapters ?? []) {
        const chKey = `${bid}:${c.number}`;
        const arr = byChapter[chKey] ?? (byChapter[chKey] = []);
        for (const v of c.verses ?? []) {
          const vk = verseKey(bid, c.number, v.number);
          arr.push(vk);
          set.add(vk);
          verseCount++;
        }
      }
    }
    datasets.push({
      id: parsed.id ?? file.replace(/\.json$/, ''),
      language: parsed.language ?? '',
      name: parsed.name ?? file,
      bookCount: books.length,
      verseCount,
      checksum: fnv1aHex(raw),
      file,
    });
  }

  for (const arr of Object.values(byChapter)) arr.sort();
  const verses = Array.from(set).sort();
  return {
    datasets,
    universe: { verses, byChapter, bookIds: Array.from(bookSet).sort() },
  };
}

// ---------------------------------------------------------------------------
// NEUU layer reader (01_parsed / 01_processed / 02_unified / 01_structured)
// ---------------------------------------------------------------------------

/** One reference as parsed from a source layer (pre-alignment book token). */
export interface RawRef {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * A raw cross-reference edge read from a source dataset. The `from` /
 * `to` sides are RAW book tokens (e.g. `Gen 1`, `Heb 11`); alignment to
 * canonical `bookId:chapter:verse` verse keys happens in
 * `alignCrossrefs` (Stage A), exactly like topic refs.
 */
export interface RawCrossref {
  from: string;
  to: string;
}

/**
 * A cross-reference edge aligned to the canonical verse universe:
 * `fromVerse` / `toVerse` are `bookId:chapter:verse` keys, one per
 * verse in the referenced chapter (a crossref dataset cites chapters,
 * not verses). Emitted undirected (lexicographic lower verse key first).
 */
export interface AlignedCrossref {
  fromVerse: string;
  toVerse: string;
  /** The book pair that produced this edge, for provenance. */
  fromBook: string;
  toBook: string;
}

/** A concept candidate read from any source layer. */
export interface RawTopic {
  /** Stable pipeline key — `source:casefold(label)`. */
  key: string;
  source: string;
  label: string;
  labelsByLanguage?: Record<string, string>;
  refs: RawRef[];
  /** The layer the topic was read from. */
  layer: string;
  definition?: string;
  /** True when the source dataset is authoritative (accepted at seed time). */
  authoritative: boolean;
}

/** A concept↔concept relation candidate read from a source layer. */
export interface RawConceptEdge {
  fromKey: string;
  toKey: string;
  relationType: 'RELATED' | 'CONTRASTS' | 'SUPPORTS' | 'CHILD_OF';
  confidence: number;
  source: string;
}

const LAYER_FILES: Record<string, string[]> = {
  '01_parsed': ['topics.json'],
  '01_processed': ['topics.json', 'edges.json'],
  '02_unified': ['topics.json', 'edges.json'],
  '01_structured': ['topics.json', 'edges.json'],
};

/** The crossref dataset lives at `raw/crossrefs.json` (source-scoped, not layer-scoped). */
const CROSSREFS_FILE = 'crossrefs.json';

export function discoverLayers(baseDir: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [layer, files] of Object.entries(LAYER_FILES)) {
    const layerDir = join(baseDir, 'raw', layer);
    if (!existsSync(layerDir)) continue;
    const present = files.filter((f) => existsSync(join(layerDir, f)));
    if (present.length > 0) out[layer] = present;
  }
  return out;
}

function readJson<T>(path: string, errors: string[]): T | null {
  try {
    const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
    return JSON.parse(text) as T;
  } catch (e) {
    errors.push(`failed to parse ${path}: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Strict typed reader for the three documented reference encodings of a
 * layer topic (object `{book,chapter,verse}`, object `{ref}`, bare string
 * `"book c:v"`).  Structure-aware: everything else is rejected, not
 * patched.
 */
function toRawRef(v: unknown): RawRef | null {
  if (typeof v === 'string') {
    const m = /^([A-Za-z0-9]+)\s+(\d+)(?::(\d+))?$/.exec(v.trim());
    if (!m) return null;
    return { book: m[1], chapter: Number(m[2]), verse: m[3] ? Number(m[3]) : 1 };
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.ref === 'string') {
      const m = /^([A-Za-z0-9]+)\s+(\d+):(\d+)$/.exec(o.ref.trim());
      if (m) return { book: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
    }
    if (typeof o.book === 'string' && typeof o.chapter === 'number' && typeof o.verse === 'number') {
      return { book: o.book, chapter: o.chapter, verse: o.verse };
    }
  }
  return null;
}

export interface ImportOptions {
  /** Base directory containing raw/. */
  semanticBaseDir?: string;
  /** Layer name to read (default '01_parsed'). */
  layer?: string;
  /** Source dataset identifier stamped on every topic (default 'nave'). */
  source?: string;
  /** Treat the source as authoritative (accepted status at seed time). */
  authoritative?: boolean;
  /** Pinned timestamp. */
  now?: string;
}

export interface ImportResult {
  layer: string;
  source: string;
  topicsRead: number;
  refsAligned: number;
  refsUnresolved: number;
  edgesRead: number;
  crossrefsRead: number;
  crossrefsUnresolved: number;
  topics: RawTopic[];
  edges: RawConceptEdge[];
  /** Raw crossref edges (`from`/`to` book tokens); align via `alignCrossrefs`. */
  crossrefs: RawCrossref[];
  alignedRefsByTopic: Record<string, AlignedRef[]>;
  errors: string[];
}

/** Read one source layer and align every reference to canonical verse keys. */
export function importLayer(opts: ImportOptions): ImportResult {
  const source = opts.source ?? 'nave';
  const layer = opts.layer ?? '01_parsed';
  const baseDir = opts.semanticBaseDir ?? join(process.cwd(), 'data', 'bible', 'semantic');
  const errors: string[] = [];

  const layerDir = join(baseDir, 'raw', layer);
  const topicsFile = join(layerDir, 'topics.json');
  const edgesFile = join(layerDir, 'edges.json');
  const crossrefsFile = join(baseDir, 'raw', CROSSREFS_FILE);

  const rawTopics: unknown[] =
    existsSync(topicsFile) ? (readJson<unknown[]>(topicsFile, errors) ?? []) : [];
  const rawEdges: unknown[] =
    existsSync(edgesFile) ? (readJson<unknown[]>(edgesFile, errors) ?? []) : [];
  const rawCrossrefs: unknown[] =
    existsSync(crossrefsFile) ? (readJson<unknown[]>(crossrefsFile, errors) ?? []) : [];

  const topics: RawTopic[] = [];
  const alignedRefsByTopic: Record<string, AlignedRef[]> = {};
  let refsAligned = 0;
  let refsUnresolved = 0;

  for (const [i, entry] of rawTopics.entries()) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`topic #${i} is not an object; skipped`);
      continue;
    }
    const o = entry as Record<string, unknown>;
    const label = typeof o.label === 'string' ? o.label : typeof o.title === 'string' ? o.title : null;
    if (!label) {
      errors.push(`topic #${i} has no label/title; skipped`);
      continue;
    }
    const key = `${source}:${label.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ')}`;
    const rawRefs: RawRef[] = [];
    const refList = Array.isArray(o.refs) ? o.refs : Array.isArray(o.references) ? o.references : [];
    for (const r of refList) {
      const rr = toRawRef(r);
      if (rr) rawRefs.push(rr);
    }
    topics.push({
      key,
      source,
      label,
      labelsByLanguage:
        o.labelsByLanguage && typeof o.labelsByLanguage === 'object'
          ? (o.labelsByLanguage as Record<string, string>)
          : { [String(typeof o.language === 'string' ? o.language : 'source')]: label },
      refs: rawRefs,
      layer,
      definition: typeof o.definition === 'string' ? o.definition : undefined,
      authoritative: opts.authoritative ?? (layer === '02_unified' || layer === '01_structured'),
    });

    const aligned: AlignedRef[] = [];
    for (const rr of rawRefs) {
      const hit = alignBookId(rr.book);
      if (hit && Number.isInteger(rr.chapter) && rr.chapter > 0 && Number.isInteger(rr.verse) && rr.verse > 0) {
        aligned.push({
          bookId: hit,
          chapter: rr.chapter,
          verse: rr.verse,
          verseId: verseKey(hit, rr.chapter, rr.verse),
          raw: `${rr.book} ${rr.chapter}:${rr.verse}`,
          source,
        });
        refsAligned++;
      } else {
        refsUnresolved++;
      }
    }
    alignedRefsByTopic[key] = aligned;
  }

  const edges: RawConceptEdge[] = [];
  for (const [i, entry] of rawEdges.entries()) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`edge #${i} is not an object; skipped`);
      continue;
    }
    const o = entry as Record<string, unknown>;
    const fromKey = typeof o.fromKey === 'string' ? o.fromKey : typeof o.from === 'string' ? o.from : null;
    const toKey = typeof o.toKey === 'string' ? o.toKey : typeof o.to === 'string' ? o.to : null;
    if (!fromKey || !toKey || fromKey === toKey) continue;
    const rel = o.relationType;
    const relationType: RawConceptEdge['relationType'] =
      rel === 'CONTRASTS' || rel === 'SUPPORTS' || rel === 'CHILD_OF' ? rel : 'RELATED';
    edges.push({
      fromKey,
      toKey,
      relationType,
      confidence:
        typeof o.confidence === 'number' ? Math.min(1, Math.max(0, o.confidence)) : 0.5,
      source: typeof o.source === 'string' ? o.source : source,
    });
  }

  // Crossref edges: `from`/`to` are RAW book tokens ("Gen 1" / "Gen",
  // "Heb 11" / "Heb"). Read them raw here; alignment to verse keys is a
  // separate step (`alignCrossrefs`) against the verse universe.
  const crossrefs: RawCrossref[] = [];
  for (const [i, entry] of rawCrossrefs.entries()) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`crossref #${i} is not an object; skipped`);
      continue;
    }
    const o = entry as Record<string, unknown>;
    const from = typeof o.from === 'string' ? o.from : null;
    const to = typeof o.to === 'string' ? o.to : null;
    if (!from || !to || from === to) continue;
    crossrefs.push({ from, to });
  }

  return {
    layer,
    source,
    topicsRead: topics.length,
    refsAligned,
    refsUnresolved,
    edgesRead: edges.length,
    crossrefsRead: crossrefs.length,
    crossrefsUnresolved: 0,
    topics,
    edges,
    crossrefs,
    alignedRefsByTopic,
    errors,
  };
}

/**
 * Read every available layer under `baseDir/raw/` and merge their
 * topics/edges/crossrefs, de-duplicating by topic key (authoritative
 * reads win).
 */
export function importAllLayers(baseDir: string, source = 'nave'): ImportResult {
  const layers = discoverLayers(baseDir);
  const merged: RawTopic[] = [];
  const edges: RawConceptEdge[] = [];
  const crossrefs: RawCrossref[] = [];
  const alignedRefsByTopic: Record<string, AlignedRef[]> = {};
  const errors: string[] = [];
  let refsAligned = 0;
  let refsUnresolved = 0;
  let layerUsed = 'none';

  for (const layer of Object.keys(layers)) {
    const res = importLayer({ semanticBaseDir: baseDir, layer, source });
    errors.push(...res.errors);
    layerUsed = layer;
    refsAligned += res.refsAligned;
    refsUnresolved += res.refsUnresolved;
    edges.push(...res.edges);
    crossrefs.push(...res.crossrefs);

    const seen = new Set(merged.map((t) => t.key));
    for (const t of res.topics) {
      if (seen.has(t.key) && !t.authoritative) continue;
      merged.push(t);
    }
    for (const [k, v] of Object.entries(res.alignedRefsByTopic)) {
      alignedRefsByTopic[k] = v;
    }
  }

  return {
    layer: layerUsed,
    source,
    topicsRead: merged.length,
    refsAligned,
    refsUnresolved,
    edgesRead: edges.length,
    crossrefsRead: crossrefs.length,
    crossrefsUnresolved: 0,
    topics: merged,
    edges,
    crossrefs,
    alignedRefsByTopic,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Crossref alignment (book tokens → canonical verse keys)
// ---------------------------------------------------------------------------

/**
 * Parse a raw crossref book token ("Gen 1" / "Gen") into `{ book, chapter }`.
 * Chapter defaults to 1 when the token names a book only — a crossref
 * dataset that cites "John" means "all of John", and its verse-key
 * expansion (below) covers every verse of chapter 1 of the *pair* — see
 * `alignCrossrefs`.
 */
function parseCrossrefToken(token: string): { book: string; chapter: number } | null {
  const m = /^([A-Za-z0-9]+)\s*(\d*)$/.exec(token.trim());
  if (!m) return null;
  const chapter = m[2] ? Number(m[2]) : 1;
  if (!Number.isInteger(chapter) || chapter < 1) return null;
  return { book: m[1], chapter };
}

/**
 * Align raw crossref edges to the verse universe. Each book token resolves
 * via `alignBookId`; when both sides resolve, the edge emits ONE verse
 * pair: verse 1 of `from`'s chapter vs verse 1 of `to`'s chapter
 * (deterministic, bounded — a full ×× expansion of a 1M-edge dataset
 * against a 32k-verse universe would mint ~32B rows and is not the
 * pipeline's job). Edges with an unresolved book token are counted, not
 * errors (the book may simply be outside the 66-book canon).
 *
 * `universe.byChapter` is used to confirm the verse actually exists before
 * emitting — an out-of-range chapter yields no row, not a dangling key.
 */
export function alignCrossrefs(
  crossrefs: RawCrossref[],
  universe: VerseUniverse
): { aligned: AlignedCrossref[]; unresolved: number } {
  const out: AlignedCrossref[] = [];
  let unresolved = 0;
  const seen = new Set<string>();
  for (const c of crossrefs) {
    const a = parseCrossrefToken(c.from);
    const b = parseCrossrefToken(c.to);
    if (!a || !b) {
      unresolved++;
      continue;
    }
    const fromBook = alignBookId(a.book);
    const toBook = alignBookId(b.book);
    if (!fromBook || !toBook) {
      unresolved++;
      continue;
    }
    // One verse pair per edge: verse 1 of each referenced chapter. A
    // chapter absent from the universe (out of range) skips the edge.
    const fromCh = `${fromBook}:${a.chapter}`;
    const toCh = `${toBook}:${b.chapter}`;
    const fromVerse = verseKey(fromBook, a.chapter, 1);
    const toVerse = verseKey(toBook, b.chapter, 1);
    if (!universe.byChapter[fromCh] || !universe.byChapter[toCh]) {
      unresolved++;
      continue;
    }
    if (fromVerse === toVerse) continue;
    const [lo, hi] = fromVerse < toVerse ? [fromVerse, toVerse] : [toVerse, fromVerse];
    const key = `${lo}|${hi}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      fromVerse: lo,
      toVerse: hi,
      fromBook,
      toBook,
    });
  }
  return { aligned: out, unresolved };
}

// ---------------------------------------------------------------------------
// Minimal seed — the documented fallback when the NEUU repos are
// unreachable (fixed 50-concept list + deterministic co-occurrence).
// ---------------------------------------------------------------------------

export interface SeedConcept {
  id: string;
  /** Stable pipeline key `seed:<slug>`. */
  key: string;
  labelsByLanguage: Record<string, string>;
  canonicalLabel: string;
  kind: 'TOPIC' | 'PERSON' | 'EVENT' | 'TEACHING' | 'OTHER';
  source: string;
  /** The seed dataset the concept's head verse is anchored in. */
  dataset: string;
  /** One-line description (carried through from concepts/seed.ts). */
  description?: string;
  confidence: number;
  createdBy: string;
  status: 'unresolved' | 'accepted';
  createdAt: string;
  updatedAt: string;
  /** The concept's head verse — Stage E attaches it PRIMARY. */
  headVerse: string;
}

export interface SeedRelation {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationType: 'RELATED' | 'CONTRASTS' | 'SUPPORTS' | 'CHILD_OF';
  confidence: number;
  source: string;
  dataset: string;
  createdAt: string;
}

export interface SeedResult {
  concepts: SeedConcept[];
  relations: SeedRelation[];
  /** Concept key → head verse key. */
  headVerseByKey: Map<string, string>;
}

interface SeedTopicDef {
  key: string;
  label: string;
  kind: SeedConcept['kind'];
  head: string;
}

/**
 * Fixed 56-concept seed.  The concept list (head verses, kinds, ids) comes
 * from `scripts/semantic/concepts/seed.ts` — the canonical source of
 * truth.  Every head verse is verified to exist in the canonical
 * 66-book verse universe.  The relation graph below is a deterministic
 * affinity list: each pair is a RELATED edge with confidence 0.8,
 * emitted undirected (lexicographic lower concept id first) and
 * de-duplicated — byte-stable across runs.
 */
const SEED_CONCEPTS = buildSeedConcepts();

/**
 * Fixed 50-concept seed (concepts/seed.ts — the canonical source).  Every
 * head verse is verified to exist in the canonical 66-book verse universe.
 * `SEED_AFFINITIES` below is the deterministic relation graph: each pair is
 * a RELATED edge with confidence 0.8, emitted undirected (lexicographic
 * lower concept id first) and de-duplicated — byte-stable across runs.
 */
const SEED_TOPICS: SeedTopicDef[] = SEED_CONCEPTS.map((c) => ({
  key: c.key.slice('seed:'.length), // strip the pipeline `seed:` prefix
  label: c.canonical_name,
  kind: c.kind,
  head: c.head_verse,
}));

/**
 * Deterministic affinity pairs for the seed graph (each pair is emitted
 * once, undirected, lower concept id first).  Every key resolves to a
 * concept in `concepts/seed.ts` — verified by tests/semantic/seed.test.ts.
 */
const SEED_AFFINITIES: Array<[string, string]> = [
  ['faith', 'hope'],
  ['faith', 'love'],
  ['faith', 'grace'],
  ['faith', 'jesus'],
  ['love', 'grace'],
  ['love', 'forgiveness'],
  ['love', 'service'],
  ['grace', 'salvation'],
  ['forgiveness', 'repentance'],
  ['repentance', 'obedience'],
  ['obedience', 'discipleship'],
  ['prayer', 'peace'],
  ['prayer', 'holy-spirit'],
  ['peace', 'wisdom'],
  ['wisdom', 'perseverance'],
  ['perseverance', 'temptation'],
  ['hope', 'salvation'],
  ['fear', 'temptation'],
  ['gospel', 'evangelism'],
  ['gospel', 'salvation'],
  ['gospel', 'discipleship'],
  ['mission', 'evangelism'],
  ['mission', 'discipleship'],
  ['justification', 'grace'],
  ['justification', 'salvation'],
  ['regeneration', 'conversion'],
  ['regeneration', 'holy-spirit'],
  ['sanctification', 'holiness'],
  ['sanctification', 'discipleship'],
  ['justice', 'the-law'],
  ['mercy', 'forgiveness'],
  ['the-cross', 'atonement'],
  ['the-cross', 'resurrection'],
  ['resurrection', 'second-coming'],
  ['ascension', 'the-millennium'],
  ['atonement', 'salvation'],
  ['transfiguration', 'jesus'],
  ['pentecost', 'holy-spirit'],
  ['pentecost', 'peter'],
  ['the-flood', 'creation'],
  ['exodus', 'the-fall'],
  ['exodus', 'moses'],
  ['the-burning-bush', 'moses'],
  ['the-burning-bush', 'the-exile'],
  ['the-exile', 'second-coming'],
  ['abraham', 'faith'],
  ['abraham', 'creation'],
  ['moses', 'the-law'],
  ['david', 'jesus'],
  ['david', 'the-psalms'],
  ['peter', 'jesus'],
  ['paul', 'grace'],
  ['paul', 'gospel'],
  ['john', 'jesus'],
  ['john', 'gospel'],
  ['jesus', 'holy-spirit'],
  ['the-psalms', 'the-prophets'],
  ['the-temple', 'the-law'],
  ['the-millennium', 'second-coming'],
];

/**
 * Build the minimal seed: the fixed 50-concept list with deterministic
 * ids, plus the derived co-occurrence relation graph.  `labelsByLanguage`
 * and `description` come from `concepts/seed.ts` (en/fr/pt labels,
 * one-line description per concept).
 */
export function buildMinimalSeed(opts: { now?: string; dataset?: string } = {}): SeedResult {
  const now = opts.now ?? DEFAULT_NOW;
  const dataset = opts.dataset ?? 'web';

  const seeded = buildSeedConcepts();
  const concepts = SEED_TOPICS.map((t, i) => {
    const key = `seed:${t.key}`;
    const id = detUuid(`seed-concept:${key}`);
    const def = seeded.find((s) => s.key === key);
    return {
      id,
      key,
      labelsByLanguage: def?.labels_by_language ?? { en: t.label },
      canonicalLabel: t.label,
      kind: t.kind,
      source: 'derived',
      dataset,
      description: def?.description,
      confidence: 1.0,
      createdBy: 'stage-A',
      status: 'accepted' as const,
      createdAt: now,
      updatedAt: now,
      headVerse: t.head,
    };
  });

  const idByKey = new Map(concepts.map((c) => [c.key, c.id]));
  const relations: SeedRelation[] = [];
  const seen = new Set<string>();
  for (const [a, b] of SEED_AFFINITIES) {
    const ia = idByKey.get(`seed:${a}`);
    const ib = idByKey.get(`seed:${b}`);
    if (!ia || !ib) continue;
    const [lo, hi] = ia < ib ? [ia, ib] : [ib, ia];
    const dedupKey = `${lo}|${hi}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    relations.push({
      id: detUuid(`seed-relation:${dedupKey}`),
      fromConceptId: lo,
      toConceptId: hi,
      relationType: 'RELATED',
      confidence: 0.8,
      source: 'derived',
      dataset,
      createdAt: now,
    });
  }

  const headVerseByKey = new Map(SEED_TOPICS.map((t) => [`seed:${t.key}`, t.head]));
  return { concepts, relations, headVerseByKey };
}
