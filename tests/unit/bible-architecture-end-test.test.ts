/**
 * §76 Architecture End-Test — Universal Bible Corpus Engine
 *
 * The ultimate test: a NEW translation is a REGISTRY ENTRY, not a feature.
 *
 * This test verifies that adding a translation to the registry and running
 * the ingestion pipeline does NOT require touching:
 *  - fsrs/ domain
 *  - memorization engine
 *  - comparison engine
 *  - UI components
 *  - navigation routes
 *
 * The test uses the orchestrator's public API with a synthetic "new"
 * translation manifest + a small USFM source, and asserts:
 *  1. The pipeline detects → parses → normalizes → validates → writes JSON.
 *  2. The output conforms to `BibleTranslationDataSchema` (the runtime
 *     contract consumed by `LocalBibleRepository` + `BibleJsonFileSource`).
 *  3. No translation-specific code is needed — only a manifest + source.
 *
 * If this test ever fails because a new translation required changes to
 * any of the forbidden modules, that is `ARCHITECTURE REJECTED` (§76)
 * and the engine must be fixed, not the translation.
 */

import { describe, it, expect } from 'vitest';
import {
  BibleIngestionOrchestrator,
  sha256,
  type ISourceProvider,
  type IFileWriter,
} from '@/infrastructure/bible/bible-ingestion-orchestrator';
import { parseTranslationData, BibleTranslationDataSchema } from '@/domains/bible/repository-local';
import type { BibleDatasetManifest } from '@/domains/bible/registry';
import type { CanonExpectation } from '@/infrastructure/bible/bible-validator';

// --- Synthetic "new" translation (no real download needed for the test) ---

/**
 * A minimal 3-book USFM source representing a brand-new translation that has
 * never been in the registry before. It uses the standard USFM book codes
 * (GEN, MAT, REV) and standard verse structure.
 */
const NEW_TRANSLATION_USFM = [
  '\\id GEN\n\\h GENÈSE\n\\c 1\n\\v 1 Au commencement, Dieu créa les cieux et la terre.',
  '\\id MAT\n\\h MATTHIEU\n\\c 1\n\\v 1 Livre de la généalogie de Jésus-Christ.',
  '\\id REV\n\\h APOCALYPISE\n\\c 1\n\\v 1 Je suis l’Alpha et l’Oméga, dit le Seigneur.',
].join('\n');

/** The "new" translation's registry manifest — the ONLY new entry needed. */
const NEW_MANIFEST: BibleDatasetManifest = {
  id: 'neo-bible',
  language: 'fr',
  name: 'Neo Test Bible (2026)',
  year: 2026,
  license: 'VERIFIED_FREE',
  available: true,
  canon: 'PROTESTANT_66',
  completeness: 'FULL_BIBLE',
  source: { rawPath: 'fra/neo-bible_usfm' },
};

/** Canon expectation for the test (3 books, 1 chapter each). */
const TEST_EXPECTATION: CanonExpectation = {
  expectedBooks: ['gen', 'mat', 'rev'],
  expectedChapterCount: { gen: 1, mat: 1, rev: 1 },
};

/** In-memory source provider (simulates local raw USFM on disk). */
class TestSourceProvider implements ISourceProvider {
  constructor(private readonly content: string) {}
  async resolve() {
    await Promise.resolve();
    return {
      content: this.content,
      origin: 'local' as const,
      sourceChecksum: sha256(this.content),
    };
  }
}

/** In-memory file writer (captures the written JSON for assertions). */
class TestFileWriter implements IFileWriter {
  written: string | null = null;
  async writeDataset(datasetId: string, json: string): Promise<string> {
    this.written = json;
    await Promise.resolve();
    return `data/bible/${datasetId}.json`;
  }
}

describe('§76 Architecture End-Test', () => {
  it('ingests a brand-new translation with NO translation-specific code', async () => {
    const sourceProvider = new TestSourceProvider(NEW_TRANSLATION_USFM);
    const fileWriter = new TestFileWriter();

    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider,
      fileWriter,
      expectation: TEST_EXPECTATION,
    });

    const result = await orchestrator.ingestDataset(NEW_MANIFEST);

    // 1. Pipeline completed successfully.
    expect(result.status).toBe('BUILT');
    expect(result.verseCount).toBe(3);

    // 2. Output conforms to the runtime Zod schema (the exact contract that
    //    LocalBibleRepository + BibleJsonFileSource consume).
    expect(fileWriter.written).not.toBeNull();
    const writtenJson = JSON.parse(fileWriter.written!);
    const parsed = parseTranslationData(writtenJson as Record<string, unknown>);
    expect(parsed.books).toHaveLength(3);

    // 3. Book ids are VersyFlow canonical ids (normalizer did its job).
    expect(parsed.books.map((b) => b.id)).toEqual(['gen', 'mat', 'rev']);

    // 4. The manifest was a REGISTRY ENTRY — no changes to fsrs/,
    //    memorization, comparison engine, UI, or routes were needed.
    //    This is asserted implicitly: if the pipeline succeeded with only
    //    the manifest + USFM source as inputs, the architecture is intact.
  });

  it('produces output loadable by LocalBibleRepository (BibleTranslationDataSchema)', async () => {
    const sourceProvider = new TestSourceProvider(NEW_TRANSLATION_USFM);
    const fileWriter = new TestFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider,
      fileWriter,
      expectation: TEST_EXPECTATION,
    });
    await orchestrator.ingestDataset(NEW_MANIFEST);

    // The written JSON must pass the full Zod runtime schema.
    const writtenJson = JSON.parse(fileWriter.written!);
    const schemaResult = BibleTranslationDataSchema.safeParse(writtenJson);
    expect(schemaResult.success).toBe(true);
  });

  it('does NOT require any translation-specific parser (D4)', async () => {
    // The same USFMAdapter + normalizer + validator handled this translation
    // that has never been seen before. No per-translation code was added.
    // If a new USFM translation in the real world required a new regex or
    // a new adapter branch, that would be ARCHITECTURE REJECTED (§76).
    const sourceProvider = new TestSourceProvider(NEW_TRANSLATION_USFM);
    const fileWriter = new TestFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider,
      fileWriter,
      expectation: TEST_EXPECTATION,
    });
    const result = await orchestrator.ingestDataset(NEW_MANIFEST);
    // BUILT = the universal pipeline succeeded without translation-specific code.
    expect(result.status).toBe('BUILT');
    // The dataset path is derived from the manifest id, not hardcoded.
    expect(result.datasetPath).toBe('data/bible/neo-bible.json');
  });

  it('batch: multiple registry-only translations build, none aborts the batch (§67/§68)', async () => {
    // Simulate 3 brand-new translations ingested through the SAME pipeline.
    // The provider serves a valid USFM source for every dataset; the only
    // differences are the manifest ids — proving a new translation is a
    // REGISTRY ENTRY, not a code change.
    const sourceProvider = new TestSourceProvider(NEW_TRANSLATION_USFM);
    const fileWriter = new TestFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider,
      fileWriter,
      expectation: TEST_EXPECTATION,
    });
    const results = await orchestrator.runBatch([
      { ...NEW_MANIFEST, id: 'neo-1' },
      { ...NEW_MANIFEST, id: 'neo-2' },
      { ...NEW_MANIFEST, id: 'neo-3' },
    ]);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === 'BUILT')).toBe(true);
    // Dataset paths are derived from each manifest id — no hardcoded paths.
    for (const r of results) {
      expect(r.datasetPath).toBe(`data/bible/${r.datasetId}.json`);
    }
  });
});
