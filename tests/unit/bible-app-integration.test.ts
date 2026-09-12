/**
 * App integration check (§76, task 9) — runtime consumption of engine output.
 *
 * Proves that a dataset written by the ingestion pipeline is loadable by the
 * app's existing runtime path: `InMemoryBibleTextSource` →
 * `LocalBibleRepository`. No UI, navigation, FSRS or comparison-engine
 * change is involved — the runtime contract is unchanged.
 */

import { describe, it, expect } from 'vitest';
import {
  BibleIngestionOrchestrator,
  sha256,
  type ISourceProvider,
  type IFileWriter,
} from '@/infrastructure/bible/bible-ingestion-orchestrator';
import {
  LocalBibleRepository,
  InMemoryBibleTextSource,
  type BibleTranslationData,
} from '@/domains/bible/repository-local';
import type { BibleDatasetManifest } from '@/domains/bible/registry';
import type { CanonExpectation } from '@/infrastructure/bible/bible-validator';

const USFM = [
  '\\id GEN\n\\h GENÈSE\n\\c 1\n\\v 1 Au commencement, Dieu créa les cieux et la terre.\n\\v 2 La terre était informe.',
  '\\id JHN\n\\h JEAN\n\\c 1\n\\v 1 Au commencement était la Parole.',
].join('\n');

const MANIFEST: BibleDatasetManifest = {
  id: 'lsg',
  language: 'fr',
  name: 'Louis Segond (1910)',
  year: 1910,
  license: 'VERIFIED_FREE',
  available: true,
  canon: 'PROTESTANT_66',
  completeness: 'FULL_BIBLE',
};

const EXPECTATION: CanonExpectation = {
  expectedBooks: ['gen', 'joh'],
  expectedChapterCount: { gen: 1, joh: 1 },
};

class MemorySourceProvider implements ISourceProvider {
  resolve() {
    return { content: USFM, origin: 'local' as const, sourceChecksum: sha256(USFM) };
  }
}

class MemoryFileWriter implements IFileWriter {
  written: Record<string, string> = {};
  writeDataset(id: string, json: string): Promise<string> {
    this.written[id] = json;
    return `data/bible/${id}.json`;
  }
}

describe('engine output → app runtime (LocalBibleRepository)', () => {
  it('a built dataset loads and answers verse lookups', async () => {
    const writer = new MemoryFileWriter();
    const orchestrator = new BibleIngestionOrchestrator({
      sourceProvider: new MemorySourceProvider(),
      fileWriter: writer,
      expectation: EXPECTATION,
    });
    const result = await orchestrator.ingestDataset(MANIFEST);
    expect(result.status).toBe('BUILT');

    // Feed the written JSON into the app's runtime source + repository.
    const dataset = JSON.parse(writer.written.lsg) as BibleTranslationData;
    const repo = new LocalBibleRepository(new InMemoryBibleTextSource({ lsg: dataset }));

    const books = await repo.getBooks('lsg');
    expect(books.map((b) => b.id)).toEqual(['gen', 'joh']);

    const verse = await repo.getVerse('lsg', 'joh', 1, 1);
    expect(verse?.text).toBe('Au commencement était la Parole.');

    const count = await repo.getVerseCount('lsg');
    expect(count).toBe(3);
  });
});
