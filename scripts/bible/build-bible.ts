/**
 * Bible Build CLI — `npm run bible:build`
 *
 * Dev/build-time pipeline: reads the registry seed, iterates datasets,
 * runs the centralized `BibleIngestionOrchestrator`, writes reports.
 *
 * Usage:
 *   npm run bible:build
 *   npm run bible:build -- lsg ostervald darby
 *
 * All dataset ingestion goes through the SAME orchestrator (§64: parallelize
 * DATASETS, not architecture). This script is the single entry point.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import * as zlib from 'node:zlib';
import { resolve, join, dirname } from 'node:path';
import {
  BibleIngestionOrchestrator,
  type ISourceProvider,
  type IFileWriter,
  sha256,
  type IngestionResult,
} from '../../src/infrastructure/bible/bible-ingestion-orchestrator';
import {
  validateDocument,
  type CanonExpectation,
} from '../../src/infrastructure/bible/bible-validator';
import type { BibleDatasetManifest, Completeness } from '../../src/domains/bible/registry';
import {
  DEFAULT_BIBLE_TRANSLATIONS,
} from '../../src/domains/bible/registry';

// ---------------------------------------------------------------------------
// ISourceProvider implementation (Node fs)
// ---------------------------------------------------------------------------

class NodeFsSourceProvider implements ISourceProvider {
  private readonly rawBaseDir: string;

  constructor(rawBaseDir: string = 'data/bible/raw') {
    this.rawBaseDir = rawBaseDir;
  }

  async resolve(manifest: BibleDatasetManifest): Promise<{
    content: string;
    origin: 'local' | 'downloaded' | 'unknown';
    sourceChecksum: string;
  }> {
    // §72: reuse local raw USFM when available (no re-download).
    const rawPath = manifest.source?.rawPath;
    if (rawPath) {
      const absRaw = resolve(this.rawBaseDir, rawPath.replace(/^data\/bible\/raw\//, ''));
      if (existsSync(absRaw)) {
        return this.readUsfmDir(absRaw, 'local');
      }
      // rawPath is set but the files are missing — fall through to eBible download.
    }

    // No local source — the caller must use `EbiblleDownloadProvider` (§44).
    throw new Error(
      `No raw USFM source found for "${manifest.id}" in ${this.rawBaseDir}. ` +
      'Use --download (eBible discovery, §44) or set source.rawPath in the registry.',
    );
  }

  readUsfmDir(dir: string, origin: 'local' | 'downloaded'): {
    content: string;
    origin: 'local' | 'downloaded';
    sourceChecksum: string;
  } {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.usfm'))
      .sort();
    if (files.length === 0) {
      throw new Error(`No .usfm files found in ${dir}`);
    }
    const content = files
      .map((f) => readFileSync(join(dir, f), 'utf-8'))
      .join('\n');
    return { content, origin, sourceChecksum: sha256(content) };
  }
}

/**
 * USFM-aware source provider (§64): reads the per-book `.usfm` files fetched
 * by `scripts/bible/ebible_fetch.py` into `data/bible/raw/{lang}/{id}_usfm/`.
 *
 * Unlike the legacy `EbiblleDownloadProvider` (mobile-HTML archives), this
 * provider never parses HTML — the downloaded archives are native USFM, which
 * the single centralized `USFMAdapter` (§46/§50) already consumes. §64: we
 * parallelize the DATASETS, never the architecture — one source-provider
 * seam, one parser.
 */
class RawUsfmSourceProvider implements ISourceProvider {
  private readonly fs: NodeFsSourceProvider;

  constructor(rawBaseDir: string = 'data/bible/raw') {
    this.fs = new NodeFsSourceProvider(rawBaseDir);
  }

  async resolve(manifest: BibleDatasetManifest): Promise<{
    content: string;
    origin: 'local' | 'downloaded' | 'unknown';
    sourceChecksum: string;
  }> {
    const rawPath = manifest.source?.rawPath;
    if (!rawPath) {
      throw new Error(
        `No source.rawPath for "${manifest.id}". Run scripts/bible/ebible_fetch.py first.`,
      );
    }
    const resolved = await this.fs.resolve(manifest);
    return {
      content: this.filterNonCanonical(resolved.content),
      origin: 'local' as const,
      sourceChecksum: resolved.sourceChecksum,
    };
  }

  /**
   * Filter out lines belonging to non-canonical eBible books (apocrypha,
   * front/back matter such as `FRT`, `GLO`, `ESG`). eBible USFM corpora
   * sometimes ship these files alongside the 66 canon books; the
   * orchestrator would otherwise parse them and trip the MISSING_BOOK check
   * on the apocryphal book codes. The book-code derivation mirrors
   * `EBIBLE_NON_CANONICAL` above (the raw USFM filename stem is
   * `{NN}-{CODE}{slug}.usfm`).
   */
  private filterNonCanonical(raw: string): string {
    const NON_CANONICAL_STEMS = new Set(
      [...EBIBLE_NON_CANONICAL].map((c) => c.toLowerCase()),
    );
    const lines = raw.split(/\r?\n/);
    const out: string[] = [];
    let skipCurrentBook = false;
    for (const line of lines) {
      // Match the same code-shape the adapter uses (`\id CODE …`).
      const idMatch = line.match(/^\\id\s+([A-Z0-9]{1,3})(\s|$)/);
      if (idMatch) {
        skipCurrentBook = NON_CANONICAL_STEMS.has(idMatch[1].toLowerCase());
      }
      if (!skipCurrentBook) out.push(line);
    }
    return out.join('\n');
  }
}

// ---------------------------------------------------------------------------
// eBible discovery + download provider (§41–§44)
// ---------------------------------------------------------------------------

/**
 * eBible "zipped mobile HTML" archive URL. This is the ONLY I/O seam that
 * downloads: every language, every translation goes through this single URL
 * pattern (§64: parallelize datasets, never the architecture).
 *
 * The archive contains one `.htm` per book-chapter (eBible book codes,
 * e.g. `GEN01.htm`, `JHN03.htm`) plus an `index.htm` book list. Verse text is
 * plain HTML: `<span class="verse" id="V1">1&nbsp;</span>Text...`. Non-canonical
 * matter (apocrypha, preface, glossary, psalm 151) is detected from the
 * index and excluded so the 66-book PROTESTANT_66 canon stays clean.
 */
export function ebibleHtmlUrl(slug: string): string {
  return `https://ebible.org/Scriptures/${slug}_html.zip`;
}

/**
 * Non-canonical eBible book codes (apocrypha + front/back matter).
 *
 * Note: `OBA` (Obadiah), `NAM` (Nahum) and `SNG` (Song of Songs) are
 * canonical USFM codes present in the PROTESTANT_66 set — the eBible
 * USFM corpus reuses these same codes, so they are deliberately NOT
 * excluded here. eBible's *HTML* archive only, `OBA`/`NAM`/`SNG` are
 * outside the eBible HTML canon (its 66 excludes the three minor prophets
 * and the Song of Songs as separate book entries); `EBIBLE_TO_VFLOW`
 * maps all 66 PROTESTANT_66 codes including these.
 */
const EBIBLE_NON_CANONICAL = new Set([
  'FRT', 'GLO', 'TOB', 'BAR', 'JDT', 'SIR', 'WIS', 'MAN', 'PS2',
  '2MA', '3MA', '4MA', '1ES', '2ES',
]);

/**
 * Parse an eBible mobile-HTML archive directory into the USFM-equivalent
 * stream (`\id` / `\c` / `\v`) the ingest pipeline expects.
 *
 * eBible archive structure (verified on eng-web / World English Bible):
 *   - `index.htm` — book list (each book's 1st-chapter file, e.g. `GEN01.htm`)
 *   - `{CODE}.htm` — per-book chapter-list page (NOT content)
 *   - `{CODE}{NN}.htm` — chapter content: `<div class="main">…` then
 *     `<div class='chapterlabel'>N</div>` + `<div class='p'>…` lines
 *     containing `<span class="verse" id="VN">N&nbsp;</span>` markers,
 *     `<a href="#FNx" class="notemark">…</a>` inline popups, and a
 *     trailing `<div class="footnote">` block.
 *
 * Strategy:
 *   1. Read index.htm, extract each book's FIRST-chapter filename
 *      (regex `href='([A-Z0-9]+)\d+\.htm'`), drop non-canonical codes.
 *   2. For each book, enumerate chapter files by trying both
 *      `{CODE}{NN}.htm` (2-digit) and `{CODE}{NNN}.htm` (3-digit, Psalms).
 *   3. For each chapter file, extract verses from the main div, strip
 *      notemarks + all HTML tags, decode entities, collapse whitespace.
 *   4. Emit `\id {CODE}` / `\c {N}` / `\v {n} {text}` lines.
 *
 * NOTE: The book-code derivation from the first chapter filename (e.g.
 * `GEN01.htm` → `GEN`) works because eBible uses 3-letter book codes
 * padded with 2-digit (or 3-digit for Psalms) chapter numbers, with NO
 * other files sharing the same `{CODE}.htm` prefix pattern in the
 * index book list.
 */
function parseEbibleHtml(dir: string): string {
  const files = readdirSync(dir).filter((f) => f.endsWith('.htm'));

  // 1. Discover book codes from the index book list. Each book entry links to
  //    its chapter-list page (`GEN.htm`), which in turn lists chapter files
  //    (`GEN01.htm` … `GEN50.htm`). Canonical book codes appear exactly once
  //    per `<a href='CODE.htm'>Name</a>` entry.
  const indexHtml = readFileSync(join(dir, 'index.htm'), 'utf-8');
  const codes: string[] = [];
  const seen = new Set<string>();
  // Each book entry in index.htm links to its chapter-list page `{CODE}.htm`
  // (e.g. `GEN.htm`), which is distinct from the chapter files `GEN01.htm`.
  for (const m of indexHtml.matchAll(/href='([A-Z][A-Z0-9]{2,4})\.htm'/g)) {
    const code = m[1];
    if (EBIBLE_NON_CANONICAL.has(code)) continue;
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }

  const decode = (s: string) =>
    s
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&nbsp;/g, '\u00A0')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&rsquo;/g, '’')
      .replace(/&lsquo;/g, '‘')
      .replace(/&ldquo;/g, '“')
      .replace(/&rdquo;/g, '”');

  const lines: string[] = [];
  let bookCount = 0;
  for (const code of codes) {
    // Enumerate this book's chapter files directly from the archive:
    // `{CODE}{NN}.htm` (2-digit) or `{CODE}{NNN}.htm` (3-digit, Psalms).
    const prefix = `${code}.htm`;
    const chFiles = files
      .filter((f) => f.startsWith(`${code}`) && f !== prefix)
      .map((f) => ({ file: f, chapter: Number(f.slice(code.length, -4)) }))
      .filter((e) => Number.isInteger(e.chapter) && e.chapter >= 1)
      .sort((a, b) => a.chapter - b.chapter)
      .map((e) => e.file);

    if (chFiles.length === 0) continue;
    lines.push(`\\id ${code}`);
    bookCount += 1;
    for (const chFile of chFiles) {
      const chapter = Number(chFile.slice(code.length, -4));
      const html = readFileSync(join(dir, chFile), 'utf-8');
      lines.push(`\\c ${chapter}`);
      // Each verse marker is: `<span class="verse" id="V1">1&nbsp;</span>Text`.
      // The `V1` id number IS the verse number. Text runs up to the NEXT
      // verse marker (or the end of the main div).
      const verseRe = /<span class="verse" id="V(\d+)">\d+\s*(?:&nbsp;)?\s*<\/span>([\s\S]*?)(?=<span class="verse"|<\/div>|$)/g;
      let m: RegExpExecArray | null;
      let vcount = 0;
      while ((m = verseRe.exec(html)) !== null) {
        const num = Number(m[1]);
        let text = m[2];
        // Strip notemarks († popups) and inline markup.
        text = text.replace(/<a href="#FN\d+"[^>]*>[\s\S]*?<\/a>/g, '');
        text = text.replace(/<[^>]+>/g, '');
        text = decode(text).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text) text = ''; // §53: EMPTY verse → warning, not blocking
        lines.push(`\\v ${num} ${text}`);
        vcount += 1;
      }
      if (vcount === 0) {
        // A chapter file without verse markers (shouldn't happen); keep it empty.
      }
    }
  }
  if (bookCount < 20) {
    throw new Error(
      `Only ${bookCount} canonical books parsed from ${dir} (expected ~66). ` +
      'index.htm book list may not match this archive.',
    );
  }
  return lines.join('\n');
}

class EbibleDownloadProvider implements ISourceProvider {
  private readonly rawBaseDir: string;
  private readonly fs: NodeFsSourceProvider;

  constructor(rawBaseDir: string = 'data/bible/raw') {
    this.rawBaseDir = rawBaseDir;
    this.fs = new NodeFsSourceProvider(rawBaseDir);
  }

  async resolve(manifest: BibleDatasetManifest): Promise<{
    content: string;
    origin: 'local' | 'downloaded' | 'unknown';
    sourceChecksum: string;
  }> {
    // 1. Local raw USFM first (§72: no re-download when files already exist).
    const rawPath = manifest.source?.rawPath;
    if (rawPath) {
      const absRaw = resolve(this.rawBaseDir, rawPath.replace(/^data\/bible\/raw\//, ''));
      if (existsSync(absRaw) && readdirSync(absRaw).some((f) => f.endsWith('.usfm'))) {
        return this.fs.resolve(manifest);
      }
    }

    // 2. Already downloaded + parsed? Reuse the parsed USFM-equivalent stream.
    const downloadsDir = join(this.rawBaseDir, 'downloads');
    const cachedStream = join(downloadsDir, `${manifest.id}_stream.txt`);
    if (existsSync(cachedStream)) {
      const content = readFileSync(cachedStream, 'utf-8');
      return { content, origin: 'local', sourceChecksum: sha256(content) };
    }

    // 3. Download from eBible (§41–§44) — mobile-HTML archive.
    mkdirSync(downloadsDir, { recursive: true });
    const slug = manifest.source?.files?.[0]?.url?.match(/Scriptures\/([a-zA-Z0-9_-]+?)_html\.zip/)?.[1]
      ?? manifest.id;
    const url = manifest.source?.files?.[0]?.url ?? ebibleHtmlUrl(slug);
    const zipPath = join(downloadsDir, `${manifest.id}.zip`);
    console.log(`    ↓ ${manifest.id}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`eBible download failed for "${manifest.id}": HTTP ${res.status} (${url})`);
    }
    const zipBuf = Buffer.from(await res.arrayBuffer());
    writeFileSync(zipPath, zipBuf);

    // 4. Unzip + parse into a USFM-equivalent stream (cached for §62 incremental).
    const outDir = join(downloadsDir, manifest.id);
    unzip(zipPath, outDir);
    const content = parseEbibleHtml(outDir);
    writeFileSync(cachedStream, content, 'utf-8');
    return { content, origin: 'downloaded', sourceChecksum: sha256(content) };
  }
}
function unzip(zipPath: string, outDir: string): number {
  const buf = readFileSync(zipPath);
  mkdirSync(outDir, { recursive: true });
  let offset = 0;
  let count = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break; // end of local entries
    const compressionMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString('utf-8');
    const dataStart = offset + 30 + nameLen + extraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const data =
      compressionMethod === 0 ? raw : zlib.inflateRawSync(raw);
    if (!name.endsWith('/')) {
      const target = join(outDir, name.replace(/\\/g, '/'));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, data);
      count += 1;
    }
    offset = dataStart + compSize;
  }
  return count;
}

// ---------------------------------------------------------------------------
// IFileWriter implementation (Node fs)
// ---------------------------------------------------------------------------

class NodeFsFileWriter implements IFileWriter {
  private readonly outDir: string;
  private readonly manifestDir: string;

  constructor(outDir: string = 'data/bible', manifestDir?: string) {
    this.outDir = outDir;
    this.manifestDir = manifestDir ?? join(outDir, 'manifests');
  }

  async writeDataset(datasetId: string, json: string): Promise<string> {
    mkdirSync(this.outDir, { recursive: true });
    const path = join(this.outDir, `${datasetId}.json`);
    writeFileSync(path, json, 'utf-8');

    // Also write the manifest with the checksum (§65).
    mkdirSync(this.manifestDir, { recursive: true });
    const manifest = {
      datasetId,
      checksum: sha256(json),
      builtAt: new Date().toISOString(),
    };
    writeFileSync(
      join(this.manifestDir, `${datasetId}.json`),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    return `data/bible/${datasetId}.json`;
  }
}

// ---------------------------------------------------------------------------
// Canon expectation factory
// ---------------------------------------------------------------------------

function buildExpectation(completeness: Completeness = 'FULL_BIBLE'): CanonExpectation {
  // The 66-book PROTESTANT_66 canon (VersyFlow ids).
  const fullCanon = [
    'gen','exo','lev','num','deb','jos','jug','rut','1sam','2sam','1roi','2roi','1chron','2chron',
    'esai','neh','est','job','psa','prov','eccl','cant','isa','jer','lament','ezek','dan',
    'os','joel','amos','abdj','jon','mich','nah','hab','sep','ag','zach','mal',
    'mat','mar','luk','joh','act','rom','1cor','2cor','gal','eph','phil','col',
    '1thes','2thes','1tim','2tim','tit','philem','heb','jac','1pet','2pet',
    '1joh','2joh','3joh','jud','rev',
  ];
  const ntBooks = fullCanon.slice(39);
  // §53: a NEW_TESTAMENT corpus must be expected as NEW_TESTAMENT — the
  // canonical book list is the 27 NT books, not the 66-book canon.
  const expectedBooks =
    completeness === 'NEW_TESTAMENT' ? ntBooks :
    completeness === 'OLD_TESTAMENT' ? fullCanon.slice(0, 39) :
    fullCanon;
  return { expectedBooks, completeness };
}

// ---------------------------------------------------------------------------
// World-corpus manifests (§39/§40) — seeded from BIBLE_TRANSLATION_CATALOG.json
// ---------------------------------------------------------------------------

/**
 * The world corpus, grouped by §39 priority language. Every eBible slug below
 * is VERIFIED against the live eBible catalogue (§41–§43, 2026-09-13):
 * each `{slug}_usfm.zip` returned HTTP 200. A new translation stays a
 * registry entry, never a code change (§76).
 *
 * Note: eBible ids are per-translation catalogue entries (e.g. `russyn`),
 * NOT per-language "web" slugs. Only the English WEB family uses per-locale
 * slugs (`eng-web`, `engwebu`, …).
 */
const WORLD_CORPUS_DATASETS: BibleDatasetManifest[] = [
  // FR — LSG (local + eBible), Ostervald (local), Néo-Crampon (eBible)
  { id: 'lsg', language: 'fr', name: 'Louis Segond (1910)', year: 1910, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'fra/fraLSG_usfm'} },
   { id: 'ostervald', language: 'fr', name: 'Ostervald (1930)', year: 1930, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'fra/fra_fob_usfm' } },
   { id: 'francrampon', language: 'fr', name: 'Néo-Crampon Libre', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'fr/francl_usfm' } },
   { id: 'frlsg-eb', language: 'fr', name: 'Louis Segond 1910 (eBible edition)', year: 1910, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'fr/fraLSG_usfm' } },
   // EN — 2
  { id: 'web', language: 'en', name: 'World English Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'en/engwebp_usfm'} },
  { id: 'webu', language: 'en', name: 'World English Bible Updated', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'en/engwebu_usfm'} },
  { id: 'kujv', language: 'en', name: 'KJV Cambridge Paragraph Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'en/engkjvcpb_usfm'} },
  // ES — 3 (slugs verified 2026-09-13)
  { id: 'rv1909', language: 'es', name: 'Reina-Valera 1909', year: 1909, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'es/spaRV1909_usfm'} },
  { id: 'es-onbv', language: 'es', name: 'Spanish ONBV', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'es/spaonbv_usfm'} },
  { id: 'es-godword', language: 'es', name: "God's Word for You (Spanish)", license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'es/spapddpt_usfm'} },
  // PT — 1
  { id: 'pt-onbv', language: 'pt', name: 'Portuguese ONBV', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'pt/poronbv_usfm'} },
  // DE — 2
  { id: 'luther1912', language: 'de', name: 'German Luther Bible 1912', year: 1912, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'de/deu1912_usfm'} },
  { id: 'schlatter1951', language: 'de', name: 'German Schlachter Bible 1951', year: 1951, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'de/deu1951_usfm'} },
  // RU — 1
  { id: 'ru-synodal', language: 'ru', name: 'Russian Synodal Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'ru/russyn_usfm'} },
  // UK — 2
  { id: 'uk-bju1996', language: 'uk', name: 'Ukrainian Bible, BJU 1996', year: 1996, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'uk/ukr1996_usfm'} },
  { id: 'uk-kulish1871', language: 'uk', name: 'Ukrainian Bible by P. Kulish', year: 1871, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'uk/ukr1871_usfm'} },
  // IT — 2
  { id: 'it-diodati1885', language: 'it', name: 'Italian Diodati Bible 1885', year: 1885, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'it/ita1885_usfm'} },
  { id: 'it-riveduta1927', language: 'it', name: 'Italian Riveduta Bible 1927', year: 1927, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'it/ita1927_usfm'} },
  // AR — 1
  { id: 'ar-nav', language: 'ar', name: 'New Arabic Version (Book of Life)', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', direction: 'rtl', source: { rawPath: 'ar/arbnav_usfm'} },
  // ZH — 2
  { id: 'cmn-uvs', language: 'zh', name: 'Chinese Union Version (simplified)', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'zh/cmncbs_usfm'} },
  { id: 'cmnswcb', language: 'zh', name: 'World Chinese Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'zh/cmnswcb_usfm'} },
  // KO — 1
  { id: 'ko-1910', language: 'ko', name: 'Korean Bible 1910', year: 1910, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'ko/kor_usfm'} },
  // JA — 1 (jp-freedom: 66 book files = FULL_BIBLE; jpn1965 NT-only dropped)
  { id: 'jp-freedom', language: 'ja', name: 'Japanese Freedom Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'ja/jpnm_usfm'} },
  // FA — 1
  { id: 'fa-opcb', language: 'fa', name: 'Open Persian Contemporary Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', direction: 'rtl', source: { rawPath: 'fa/pesopcb_usfm'} },
  // TL — 1
  { id: 'tl-ulb', language: 'tl', name: 'Tagalog Unlocked Literal Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'tl/tglulb_usfm'} },
  // SW — 1 (sw-1850 dropped: NT-only corpus with 26 files)
  { id: 'sw-ulb', language: 'sw', name: 'Swahili Unlocked Literal Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'sw/swhulb_usfm'} },
  // NL — 2
  { id: 'nl-1917', language: 'nl', name: 'Dutch Bible 1917', year: 1917, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'nl/nld_usfm'} },
  { id: 'nl-nbg1951', language: 'nl', name: 'Dutch NBG 1951 Bible', year: 1951, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'nl/nldnbg_usfm'} },
  // ID — 1
  { id: 'id-tsi', language: 'id', name: 'Indonesian Bible (TSI)', license: 'VERIFIED_FREE', available: false, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'id/ind_usfm'} },
  // HI — 1
  { id: 'hi-irv', language: 'hi', name: 'Hindi Indian Revised Version', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'hi/hin2017_usfm'} },
  // ML — 1
  { id: 'ml-irv', language: 'ml', name: 'Malayalam Indian Revised Version', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'ml/mal_usfm'} },
  // NO — 0 (no-living dropped: NT-only corpus)
  // SV — 1
  { id: 'sv-ntplus', language: 'sv', name: 'Swedish NT+', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'sv/swe_usfm'} },
  // DA — 1
  { id: 'da-1931', language: 'da', name: 'Danish Bible 1931', year: 1931, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'da/dan1931_usfm'} },
  // FI — 0 (fin-aen dropped: NT-only corpus)
  // IS — 0 (is-oln dropped: NT+ corpus)
  // SO — 1
  { id: 'so-bible', language: 'so', name: 'Somali Bible', license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'so/som_usfm'} },
  // EL — 0 (el-majority + el-solrock dropped: NT-only Greek corpora)
  // HE — 0 (heb-living dropped: NT-only Hebrew corpus)
  // LA — 1
  { id: 'la-vulgate', language: 'la', name: 'Clementine Vulgate 1598', year: 1598, license: 'VERIFIED_FREE', available: true, canon: 'PROTESTANT_66', completeness: 'FULL_BIBLE', source: { rawPath: 'la/latVUC_usfm' } },
];

/**
 * Local raw USFM paths per translation id (LSG/Ostervald/Darby already on
 * disk §72 — no re-download).
 */
function buildManifests(): BibleDatasetManifest[] {
  // §53: corpora whose source is known-incomplete (incomplete eBible
  // archive, e.g. `id/ind_usfm` = 48/66 books) are excluded from the
  // batch instead of surfacing `MISSING_BOOK` errors. Set `available:
  // false` on the entry and it drops out of every build.
  return WORLD_CORPUS_DATASETS.filter((m) => m.available);
}

// ---------------------------------------------------------------------------
// Report writers
// ---------------------------------------------------------------------------

function writeReports(results: IngestionResult[], outDir = 'docs/bible/reports') {
  mkdirSync(outDir, { recursive: true });

  // build-summary.md
  const md = [
    '# Bible Build Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Dataset | Status | Verses | Checksum |',
    '|---------|--------|--------|----------|',
    ...results.map((r) =>
      `| ${r.datasetId} | ${r.status} | ${r.verseCount ?? '—'} | ${(r.checksum ?? '').slice(0, 12) + '…'} |`
    ),
    '',
    ...results
      .filter((r) => r.status === 'FAILED')
      .map((r) => `- **${r.datasetId}**: ${r.error}`),
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'build-summary.md'), md, 'utf-8');

  // dataset-status.json
  writeFileSync(
    join(outDir, 'dataset-status.json'),
    JSON.stringify(results, null, 2),
    'utf-8',
  );

  console.log(`Reports written to ${outDir}/`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const downloadMode = argv.includes('--download');
  const cliArgs = argv.filter((a) => !a.startsWith('-'));
  const allManifests = buildManifests();
  const manifests = cliArgs.length > 0
    ? allManifests.filter((m) => cliArgs.includes(m.id))
    : allManifests;

  if (manifests.length === 0) {
    console.error('No datasets selected. Available:', allManifests.map((m) => m.id).join(', '));
    process.exit(1);
  }

  // §64: both paths go through the single centralized orchestrator.
  // Default: local raw USFM (fetched by `scripts/bible/ebible_fetch.py`).
  // Legacy `--download`: eBible mobile-HTML archive → parsed to USFM stream.
  const sourceProvider = downloadMode
    ? new EbibleDownloadProvider()
    : new RawUsfmSourceProvider();

  const orchestrator = new BibleIngestionOrchestrator({
    sourceProvider,
    fileWriter: new NodeFsFileWriter(),
    expectation: buildExpectation(),
  });

  console.log(
    `Building ${manifests.length} dataset(s) [${downloadMode ? 'eBible download' : 'local raw'}]: ` +
    `${manifests.map((m) => m.id).join(', ')}\n`,
  );

  orchestrator.runBatch(manifests).then((results) => {
    writeReports(results);

    const built = results.filter((r) => r.status === 'BUILT');
    const failed = results.filter((r) => r.status === 'FAILED');
    const skipped = results.filter((r) => r.status === 'SKIPPED');

    console.log(`\n  Built:   ${built.length}`);
    for (const r of built) {
      console.log(`    ✓ ${r.datasetId}: ${r.verseCount} verses, ${r.datasetPath}`);
    }
    if (skipped.length) {
      console.log(`  Skipped: ${skipped.length}`);
      for (const r of skipped) console.log(`    ↷ ${r.datasetId}`);
    }
    if (failed.length) {
      console.log(`  Failed:  ${failed.length}`);
      for (const r of failed) console.log(`    ✗ ${r.datasetId}: ${r.error}`);
    }

    process.exit(failed.length > 0 && built.length === 0 ? 1 : 0);
  });
}

main();
