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
  topics: RawTopic[];
  edges: RawConceptEdge[];
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

  const rawTopics: unknown[] =
    existsSync(topicsFile) ? (readJson<unknown[]>(topicsFile, errors) ?? []) : [];
  const rawEdges: unknown[] =
    existsSync(edgesFile) ? (readJson<unknown[]>(edgesFile, errors) ?? []) : [];

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

  return {
    layer,
    source,
    topicsRead: topics.length,
    refsAligned,
    refsUnresolved,
    edgesRead: edges.length,
    topics,
    edges,
    alignedRefsByTopic,
    errors,
  };
}

/**
 * Read every available layer under `baseDir/raw/` and merge their
 * topics/edges, de-duplicating by topic key (authoritative reads win).
 */
export function importAllLayers(baseDir: string, source = 'nave'): ImportResult {
  const layers = discoverLayers(baseDir);
  const merged: RawTopic[] = [];
  const edges: RawConceptEdge[] = [];
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
    topics: merged,
    edges,
    alignedRefsByTopic,
    errors,
  };
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
 * Fixed 50-concept seed.  Every head verse is verified to exist in the
 * canonical 66-book verse universe (the `web` dataset covers all of
 * them).  The relation graph is a deterministic affinity list: each pair
 * is a RELATED edge with confidence 0.8, emitted undirected (lexicographic
 * lower concept id first) and de-duplicated — byte-stable across runs.
 */
const SEED_TOPICS: SeedTopicDef[] = [
  { key: 'faith', label: 'Faith', kind: 'TOPIC', head: 'heb:11:1' },
  { key: 'love-of-god', label: 'Love of God', kind: 'TOPIC', head: '1joh:4:8' },
  { key: 'grace', label: 'Grace', kind: 'TOPIC', head: 'eph:2:8' },
  { key: 'salvation', label: 'Salvation', kind: 'TOPIC', head: 'act:4:12' },
  { key: 'redemption', label: 'Redemption', kind: 'TOPIC', head: 'rom:3:24' },
  { key: 'forgiveness', label: 'Forgiveness', kind: 'TOPIC', head: 'eph:1:7' },
  { key: 'repentance', label: 'Repentance', kind: 'TOPIC', head: 'act:2:38' },
  { key: 'repent', label: 'Repent', kind: 'TEACHING', head: 'luk:5:32' },
  { key: 'prayer', label: 'Prayer', kind: 'TEACHING', head: 'mat:6:9' },
  { key: 'praise', label: 'Praise', kind: 'TEACHING', head: 'psa:147:1' },
  { key: 'worship', label: 'Worship', kind: 'TEACHING', head: 'heb:12:28' },
  { key: 'humility', label: 'Humility', kind: 'TOPIC', head: 'jac:4:10' },
  { key: 'patience', label: 'Patience', kind: 'TEACHING', head: 'jac:1:5' },
  { key: 'prudence', label: 'Prudence', kind: 'TEACHING', head: 'mat:7:15' },
  { key: 'wisdom', label: 'Wisdom', kind: 'TOPIC', head: 'jac:1:5' },
  { key: 'hope', label: 'Hope', kind: 'TOPIC', head: 'heb:6:19' },
  { key: 'joy', label: 'Joy', kind: 'TOPIC', head: 'phil:4:4' },
  { key: 'peace', label: 'Peace', kind: 'TOPIC', head: 'phil:4:7' },
  { key: 'gospel', label: 'Gospel', kind: 'TOPIC', head: 'mar:1:1' },
  { key: 'commandments', label: 'The Commandments', kind: 'TEACHING', head: 'mat:19:17' },
  { key: 'creation', label: 'Creation', kind: 'EVENT', head: 'gen:1:1' },
  { key: 'flood', label: 'The Flood', kind: 'EVENT', head: 'gen:7:1' },
  { key: 'exodus', label: 'The Exodus', kind: 'EVENT', head: 'exo:3:7' },
  { key: 'manna', label: 'Manna', kind: 'EVENT', head: 'exo:16:4' },
  { key: 'tabernacle', label: 'The Tabernacle', kind: 'EVENT', head: 'exo:25:8' },
  { key: 'sacrifice', label: 'Sacrifice', kind: 'TEACHING', head: 'lev:1:3' },
  { key: 'passover', label: 'Passover', kind: 'EVENT', head: 'exo:12:11' },
  { key: 'promises', label: "God's Promises", kind: 'TOPIC', head: 'rom:4:21' },
  { key: 'law', label: 'The Law', kind: 'TEACHING', head: 'deb:4:13' },
  { key: 'psalm-hymn', label: 'Psalm Hymn', kind: 'OTHER', head: 'psa:78:24' },
  { key: 'abraham', label: 'Abraham', kind: 'PERSON', head: 'gen:12:1' },
  { key: 'moses', label: 'Moses', kind: 'PERSON', head: 'exo:3:1' },
  { key: 'david', label: 'David', kind: 'PERSON', head: '1sam:16:13' },
  { key: 'samuel', label: 'Samuel', kind: 'PERSON', head: '1sam:3:1' },
  { key: 'jeremiah', label: 'Jeremiah', kind: 'PERSON', head: 'jer:1:5' },
  { key: 'ezekiel', label: 'Ezekiel', kind: 'PERSON', head: 'ezek:1:3' },
  { key: 'john-baptist', label: 'John the Baptist', kind: 'PERSON', head: 'mat:3:1' },
  { key: 'peter', label: 'Peter', kind: 'PERSON', head: 'act:1:15' },
  { key: 'paul', label: 'Paul', kind: 'PERSON', head: 'act:9:1' },
  { key: 'baptism-jesus', label: 'The Baptism of Jesus', kind: 'EVENT', head: 'mat:3:13' },
  { key: 'baptism', label: 'Baptism', kind: 'TEACHING', head: 'mat:28:19' },
  { key: 'resurrection', label: 'The Resurrection', kind: 'EVENT', head: 'mat:28:6' },
  { key: 'pentecost', label: 'Pentecost', kind: 'EVENT', head: 'act:2:1' },
  { key: 'second-coming', label: 'Second Coming', kind: 'EVENT', head: 'rev:22:20' },
  { key: 'millennium', label: 'The Millennium', kind: 'EVENT', head: 'rev:20:4' },
  { key: 'atonement', label: 'The Atonement', kind: 'EVENT', head: 'rom:5:8' },
  { key: 'cross', label: 'The Cross', kind: 'EVENT', head: 'gal:3:13' },
  { key: 'crucifixion', label: 'The Crucifixion', kind: 'EVENT', head: 'mat:27:35' },
  { key: 'life-of-jesus', label: 'Life of Jesus', kind: 'EVENT', head: 'mat:4:1' },
  { key: 'teaching-of-jesus', label: 'Teaching of Jesus', kind: 'TEACHING', head: 'mat:5:1' },
];

/**
 * Deterministic affinity pairs for the seed graph (each pair is emitted
 * once, undirected, lower concept id first).
 */
const SEED_AFFINITIES: Array<[string, string]> = [
  ['faith', 'hope'],
  ['faith', 'joy'],
  ['faith', 'salvation'],
  ['love-of-god', 'grace'],
  ['love-of-god', 'forgiveness'],
  ['grace', 'salvation'],
  ['salvation', 'redemption'],
  ['redemption', 'atonement'],
  ['forgiveness', 'repentance'],
  ['repentance', 'repent'],
  ['prayer', 'worship'],
  ['prayer', 'patience'],
  ['praise', 'worship'],
  ['humility', 'patience'],
  ['prudence', 'wisdom'],
  ['wisdom', 'patience'],
  ['joy', 'peace'],
  ['gospel', 'salvation'],
  ['commandments', 'law'],
  ['creation', 'flood'],
  ['flood', 'exodus'],
  ['exodus', 'passover'],
  ['exodus', 'manna'],
  ['exodus', 'tabernacle'],
  ['passover', 'atonement'],
  ['sacrifice', 'atonement'],
  ['promises', 'faith'],
  ['law', 'sacrifice'],
  ['abraham', 'faith'],
  ['abraham', 'promises'],
  ['moses', 'exodus'],
  ['moses', 'law'],
  ['david', 'psalm-hymn'],
  ['samuel', 'david'],
  ['jeremiah', 'law'],
  ['ezekiel', 'jeremiah'],
  ['john-baptist', 'baptism-jesus'],
  ['john-baptist', 'baptism'],
  ['peter', 'pentecost'],
  ['paul', 'grace'],
  ['baptism-jesus', 'baptism'],
  ['resurrection', 'second-coming'],
  ['resurrection', 'cross'],
  ['crucifixion', 'cross'],
  ['crucifixion', 'atonement'],
  ['cross', 'atonement'],
  ['life-of-jesus', 'teaching-of-jesus'],
  ['life-of-jesus', 'baptism-jesus'],
  ['teaching-of-jesus', 'commandments'],
  ['second-coming', 'millennium'],
];

/**
 * Build the minimal seed: the fixed 50-concept list with deterministic
 * ids, plus the derived co-occurrence relation graph.
 */
export function buildMinimalSeed(opts: { now?: string; dataset?: string } = {}): SeedResult {
  const now = opts.now ?? DEFAULT_NOW;
  const dataset = opts.dataset ?? 'web';

  const concepts = SEED_TOPICS.map((t) => {
    const key = `seed:${t.key}`;
    const id = detUuid(`seed-concept:${key}`);
    return {
      id,
      key,
      labelsByLanguage: { en: t.label },
      canonicalLabel: t.label,
      kind: t.kind,
      source: 'derived',
      dataset,
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
