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
import { resolve, join } from 'node:path';
import {
  BibleIngestionOrchestrator,
  type ISourceProvider,
  type IFileWriter,
  sha256,
  type IngestionResult,
} from '../../src/infrastructure/bible/bible-ingestion-orchestrator';
import type { CanonExpectation } from '../../src/infrastructure/bible/bible-validator';
import type { BibleDatasetManifest } from '../../src/domains/bible/registry';
import {
  DEFAULT_BIBLE_TRANSLATIONS,
} from '../../src/domains/bible/registry';

// ---------------------------------------------------------------------------
// ISourceProvider implementation (Node fs)
// ---------------------------------------------------------------------------

class NodeFsSourceProvider implements ISourceProvider {
  private readonly rawBaseDir: string;

  constructor(rawBaseDir: string = 'data/bible/raw/fra') {
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
      const absRaw = resolve(this.rawBaseDir.replace(/\/fra$/, ''), rawPath.replace(/^data\/bible\/raw\//, ''));
      if (existsSync(absRaw)) {
        return this.readUsfmDir(absRaw, 'local');
      }
      // rawPath is set but the files are missing — fall through to eBible download.
    }

    // Try to find a raw USFM directory by dataset id (auto-discovery).
    const guessDir = resolve(this.rawBaseDir, `${manifest.id}_usfm`);
    if (existsSync(guessDir)) {
      return this.readUsfmDir(guessDir, 'local');
    }

    // No local source — download from eBible (§44 discovery engine).
    // The download is done by the orchestrator's source provider; here we
    // just report that the source is unavailable and let the caller decide.
    throw new Error(
      `No raw USFM source found for "${manifest.id}" in ${this.rawBaseDir}. ` +
      'Run eBible discovery (§44) to download it, or set source.rawPath in the registry.',
    );
  }

  private readUsfmDir(dir: string, origin: 'local' | 'downloaded'): {
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

function buildExpectation(): CanonExpectation {
  // The 66-book PROTESTANT_66 canon (VersyFlow ids).
  const expectedBooks = [
    'gen','exo','lev','num','deb','jos','jug','rut','1sam','2sam','1roi','2roi','1chron','2chron',
    'esai','neh','est','job','psa','prov','eccl','cant','isa','jer','lament','ezek','dan',
    'os','joel','amos','abdj','jon','mich','nah','hab','sep','ag','zach','mal',
    'mat','mar','luk','joh','act','rom','1cor','2cor','gal','eph','phil','col',
    '1thes','2thes','1tim','2tim','tit','philem','heb','jac','1pet','2pet',
    '1joh','2joh','3joh','jud','rev',
  ];
  return { expectedBooks };
}

// ---------------------------------------------------------------------------
// Manifest seed (from registry + raw source discovery)
// ---------------------------------------------------------------------------

function buildManifests(): BibleDatasetManifest[] {
  return DEFAULT_BIBLE_TRANSLATIONS.map((t) => ({
    ...t,
    canon: 'PROTESTANT_66' as const,
    completeness: 'FULL_BIBLE' as const,
    source: t.id === 'lsg' ? { rawPath: 'fra/fraLSG_usfm' } :
           t.id === 'ostervald' ? { rawPath: 'fra/fra_fob_usfm' } :
           t.id === 'darby' ? { rawPath: 'fra/frajnd_usfm' } : undefined,
  }));
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
  const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const allManifests = buildManifests();
  const manifests = cliArgs.length > 0
    ? allManifests.filter((m) => cliArgs.includes(m.id))
    : allManifests;

  if (manifests.length === 0) {
    console.error('No datasets selected. Available:', allManifests.map((m) => m.id).join(', '));
    process.exit(1);
  }

  const orchestrator = new BibleIngestionOrchestrator({
    sourceProvider: new NodeFsSourceProvider(),
    fileWriter: new NodeFsFileWriter(),
    expectation: buildExpectation(),
  });

  console.log(`Building ${manifests.length} dataset(s): ${manifests.map((m) => m.id).join(', ')}\n`);

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
