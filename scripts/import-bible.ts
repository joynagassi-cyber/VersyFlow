/**
 * import-bible.ts — Normalise & validates a local Bible dataset.
 *
 * Reads a source JSON corpus (`data/bible/<id>.json`), normalises it to the
 * canonical domain shape (deriving `orderIndex` from the 66-book canon,
 * validating verse/chapter structure), and writes a normalised copy to
 * `data/bible/normalized/<id>.json` WITHOUT touching the source.
 *
 * The normalised output is the exact shape the local repository
 * (`LocalBibleRepository`) expects. Later, when the SQLite local dataset
 * (Phase F) is wired up, this same normalized JSON is the seed that gets
 * imported into SQLite — so the domain contract stays stable.
 *
 * Run with:  npx vite-node scripts/import-bible.ts [translationId]
 *
 * IMPORTANT (data provenance):
 *   This pipeline normalises and validates whatever source corpus you point
 *   it at. It does NOT verify that the verse *texts* are actually LSG 1910 —
 *   the bundled `data/bible/lsg.json` is currently a generated placeholder
 *   (see scripts/generate-lsg.js). Point the pipeline at a real,
 *   licence-verified corpus before relying on the texts in production.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import {
  parseTranslationData,
  BIBLE_BOOKS,
  DEFAULT_BIBLE_TRANSLATIONS,
} from '@/domains/bible';

interface ImportReport {
  translationId: string;
  sourcePath: string;
  outputPath: string;
  ok: boolean;
  books: number;
  chapters: number;
  verses: number;
  /** Canon book codes present in the source (expected 66). */
  canonCoverage: string[];
  /** Canon codes MISSING from the source. */
  missingCanon: string[];
  /** Structural inconsistencies detected (chapter count vs. declared). */
  warnings: string[];
}

function defaultRoot(): string {
  // vite-node runs from the project root; allow CWD override.
  return cwd();
}

function readFile(root: string, translationId: string): string {
  const sourcePath = join(root, 'data', 'bible', `${translationId}.json`);
  if (!existsSync(sourcePath)) {
    throw new Error(`Source corpus not found: ${sourcePath}`);
  }
  return readFileSync(sourcePath, 'utf-8');
}

export function runImport(
  translationId: string,
  root: string = defaultRoot(),
): ImportReport {
  const sourcePath = join(root, 'data', 'bible', `${translationId}.json`);
  const raw = readFile(root, translationId);
  const data: unknown = JSON.parse(raw);

  // Validate + normalize (throws on structural invalidity).
  const normalized = parseTranslationData(data);

  // Write the normalized copy; keep the source untouched.
  const outDir = join(root, 'data', 'bible', 'normalized');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outputPath = join(outDir, `${translationId}.json`);
  writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf-8');

  // --- report / provenance checks -------------------------------------
  const present = new Set(normalized.books.map((b) => b.id));
  const canonCodes = BIBLE_BOOKS.map((b) => b.id);
  const missingCanon = canonCodes.filter((c) => !present.has(c));
  const canonCoverage = canonCodes.filter((c) => present.has(c));

  const chapters = normalized.books.reduce((s, b) => s + b.chapters.length, 0);
  const verses = normalized.books.reduce(
    (s, b) => s + b.chapters.reduce((cs, c) => cs + c.verses.length, 0),
    0,
  );

  const warnings: string[] = [];
  for (const book of normalized.books) {
    if (book.chapterCount !== book.chapters.length) {
      warnings.push(
        `${book.id}: declared chapterCount=${book.chapterCount} but has ${book.chapters.length} chapters`,
      );
    }
  }

  const manifest = DEFAULT_BIBLE_TRANSLATIONS.find((m) => m.id === translationId);
  if (!manifest || !manifest.license) {
    warnings.push(`no licence metadata for "${translationId}" — verify before shipping`);
  } else if (manifest.license !== 'VERIFIED_FREE') {
    warnings.push(
      `"${translationId}" licence is ${manifest.license} — do NOT ship to production yet`,
    );
  }

  const report: ImportReport = {
    translationId,
    sourcePath,
    outputPath,
    ok: missingCanon.length === 0 && normalized.books.length > 0,
    books: normalized.books.length,
    chapters,
    verses,
    canonCoverage,
    missingCanon,
    warnings,
  };
  return report;
}

// `import-bible.ts` is a pure library (testable, no CLI side effects).
// Run it as a script through `scripts/import-bible-cli.ts`:
//   npx vite-node scripts/import-bible-cli.ts
//   BIBLE_IMPORT_ID=kujv npx vite-node scripts/import-bible-cli.ts

export default runImport;
