/**
 * Bible Infrastructure — Ingestion Orchestrator tests (§45, §62, §67/§68)
 *
 * Uses in-memory source provider + file writer (mocks) to verify:
 *  - the full pipeline (parse → normalize → validate → write)
 *  - fault-tolerant batch (one failing dataset does NOT abort the rest)
 *  - incremental skip (§62)
 *  - unknown-format rejection
 */

import { describe, it, expect } from 'vitest';
import {
  BibleIngestionOrchestrator,
  sha256,
  type ISourceProvider,
  type IFileWriter,
  type IngestionResult,
} from '@/infrastructure/bible/bible-ingestion-orchestrator';
import type { CanonExpectation } from '@/infrastructure/bible/bible-validator';
import type { BibleDatasetManifest } from '@/domains/bible/registry';
import type { BibleDocument } from '@/domains/bible/document';

/** Minimal 2-book USFM source (VersyFlow ids via the canonical seed map). */
const LSG_CONTENT = [
  '\\id GEN\n\\h GENÈSE\n\\c 1\n\\v 1 Au commencement, Dieu créa les cieux et la terre.\n\\v 2 La terre était informe.',
  '\\id MAT\n\\h MATTHIEU\n\\c 1\n\\v 1 Généalogie de Jésus-Christ.',
].join('\n');

const OST_CONTENT = [
  '\\id GEN\n\\h GENÈSE\n\\c 1\n\\v 1 Au commencement Dieu créa les cieux et la terre.',
  '\\id JHN\n\\h JEAN\n\\c 1\n\\v 1 Au commencement était la Parole.',
].join('\n');

/** 2-book canon (gen + mat) with 1 chapter each. */
const expectation: CanonExpectation = {
  expectedBooks: ['gen', 'mat'],
  expectedChapterCount: { gen: 1, mat: 1 },
};

function makeManifest(overrides: Partial<BibleDatasetManifest> = {}): BibleDatasetManifest {
  return {
    id: 'lsg',
    language: 'fr',
    name: 'Louis Segond (1910)',
    license: 'VERIFIED_FREE',
    available: true,
    canon: 'PROTESTANT_66',
    completeness: 'FULL_BIBLE',
    ...overrides,
  };
}

class MemorySourceProvider implements ISourceProvider {
  private readonly contentByDataset: Record<string, string>;
  private readonly failDatasets: Set<string>;
  constructor(contentByDataset: Record<string, string>, failDatasets: string[] = []) {
    this.contentByDataset = contentByDataset;
    this.failDatasets = new Set(failDatasets);
  }
  async resolve(manifest: BibleDatasetManifest) {
    if (this.failDatasets.has(manifest.id)) {
      throw new Error(`source unavailable for ${manifest.id}`);
    }
    const content = this.contentByDataset[manifest.id];
    if (content == null) {
      throw new Error(`no source content registered for ${manifest.id}`);
    }
    return { content, origin: 'local' as const, sourceChecksum: sha256(content) };
  }
}

class MemoryFileWriter implements IFileWriter {
  readonly written: Record<string, string> = {};
  async writeDataset(datasetId: string, json: string): Promise<string> {
    this.written[datasetId] = json;
    return `data/bible/${datasetId}.json`;
  }
}

describe('BibleIngestionOrchestrator', () => {
  it('runs the full pipeline: parse → normalize → validate → write', async () => {
    const writer = new MemoryFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider({ lsg: LSG_CONTENT }),
      fileWriter: writer,
      expectation,
    });
    const result = await orchestrator.ingestDataset(makeManifest());
    expect(result.status).toBe('BUILT');
    expect(result.datasetPath).toBe('data/bible/lsg.json');
    expect(result.verseCount).toBe(3); // gen:2 + mat:1
    expect(result.checksum).toBeDefined();
    expect(result.validation?.pass).toBe(true);
    // Warning-severity issues (empty verse, etc.) do not block the build (§53).
    const written: BibleDocument = JSON.parse(writer.written.lsg) as unknown as {
      books: Array<{ id: string }>;
    };
    expect(written.books.map((b) => b.id)).toEqual(['gen', 'mat']);
  });

  it('is fault-tolerant: a failing dataset does not abort the batch (§67/§68)', async () => {
    const writer = new MemoryFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider(
        { lsg: LSG_CONTENT, ostervald: OST_CONTENT },
        ['ostervald'], // this one fails at source resolution
      ),
      fileWriter: writer,
      expectation,
    });
    const results = await orchestrator.runBatch([
      makeManifest(), // lsg
      makeManifest({ id: 'ostervald', language: 'fr', name: 'Ostervald' }),
    ]);
    expect(results.map((r) => r.datasetId)).toEqual(['lsg', 'ostervald']);
    const lsg = results.find((r) => r.datasetId === 'lsg');
    const ost = results.find((r) => r.datasetId === 'ostervald');
    expect(lsg?.status).toBe('BUILT');
    expect(ost?.status).toBe('FAILED');
    expect(ost?.error).toContain('source unavailable');
    // LSG was still written even though Ostervald failed.
    expect(writer.written.lsg).toBeDefined();
  });

  it('skips a rebuild when the source checksum matches the manifest (§62)', async () => {
    const writer = new MemoryFileWriter();
    const manifest = makeManifest({ checksum: sha256(LSG_CONTENT) });
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider({ lsg: LSG_CONTENT }),
      fileWriter: writer,
      expectation,
    });
    const results = await orchestrator.runBatch([manifest], {
      lsg: sha256(LSG_CONTENT),
    });
    expect(results[0].status).toBe('SKIPPED');
    // Nothing was written — the rebuild was skipped.
    expect(Object.keys(writer.written)).toHaveLength(0);
  });

  it('rebuilds when the source checksum differs from the manifest (§62)', async () => {
    const writer = new MemoryFileWriter();
    const manifest = makeManifest({ checksum: 'stale-checksum' });
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider({ lsg: LSG_CONTENT }),
      fileWriter: writer,
      expectation,
    });
    const results = await orchestrator.runBatch([manifest], {
      lsg: sha256(LSG_CONTENT), // current ≠ manifest.checksum
    });
    expect(results[0].status).toBe('BUILT');
    expect(writer.written.lsg).toBeDefined();
  });

  it('rejects an unrecognised source format', async () => {
    const writer = new MemoryFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider({ web: '<?xml version="1.0"?><usfx/>' }),
      fileWriter: writer,
      expectation,
    });
    await expect(
      orchestrator.ingestDataset(makeManifest({ id: 'web', language: 'en', name: 'WEB' })),
    ).rejects.toThrow(/USFXAdapter is not implemented/);
  });

  it('exposes a pure sha256 helper', () => {
    const h = sha256('abc');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(sha256('abc'));
  });
});
