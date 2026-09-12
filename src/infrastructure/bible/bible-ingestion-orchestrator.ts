/**
 * Bible Infrastructure — Ingestion Orchestrator (§45, §61–§68)
 *
 * The dev/build-time pipeline that turns a registered dataset manifest into a
 * bundled runtime JSON dataset:
 *
 *   read manifest → source provider yields raw USFM content →
 *   USFMAdapter.parse → normalize → validate →
 *   write runtime JSON + checksum (§65) → report entry.
 *
 * Design:
 * - `ISourceProvider` is the ONLY I/O seam: it returns raw USFM *content*
 *   (strings). Whether that content came from a local file, a download, or an
 *   in-memory cache is the provider's concern, not the orchestrator's (§72).
 * - `IFileWriter` writes the built runtime JSON + records its checksum.
 * - `USFMAdapter` is injected (D2 pivot format) so the orchestrator stays
 *   format-agnostic (§46) — add a new adapter without touching this file.
 *
 * Fault-tolerant & incremental (§62/§67/§68):
 * - `ingestDataset` throws per dataset so a single failure NEVER aborts a
 *   batch — the batch caller (`runBatch`) catches and records `FAILED`.
 * - When a manifest's checksum matches the current build checksum, the rebuild
 *   is skipped (§62, `shouldSkip`).
 *
 * All I/O goes through injectable ports so the engine stays testable and
 * never hardcodes a storage backend. The engine is dev-only; the app runtime
 * stays on the embedded JSON datasets.
 */

import { createHash } from 'node:crypto';
import { USFMAdapter } from '@/infrastructure/bible/adapters/usfm-adapter';
import { detectFormat } from '@/infrastructure/bible/bible-format-detector';
import { normalizeDocument, type NormalizerOptions } from '@/infrastructure/bible/bible-normalizer';
import {
  validateDocument,
  type CanonExpectation,
  type ValidationReport,
} from '@/infrastructure/bible/bible-validator';
import { USFM_TO_VFLOW, usfmTestament } from '@/domains/bible/canon-maps';
import type { BibleDatasetManifest } from '@/domains/bible/registry';
import type { BibleTranslationData } from '@/domains/bible/repository-local';
import type { BibleDocument } from '@/domains/bible/document';

/**
 * Port: supply the raw source content for a dataset.
 *
 * The provider decides where the content comes from (local raw path §72, or a
 * fresh download). It returns the concatenated raw USFM text of all books.
 */
export interface ISourceProvider {
  /**
   * Return raw source content for a manifest. When `manifest.source.rawPath`
   * is present and the files already exist on disk, the provider should reuse
   * them without re-downloading (§72). It returns the concatenated USFM text.
   */
  resolve(manifest: BibleDatasetManifest): Promise<{
    /** Concatenated raw USFM text of all books. */
    content: string;
    /** Where the content came from (informational, for the report). */
    origin: 'local' | 'downloaded' | 'unknown';
    /** SHA-256 of the raw content (for incremental skip, §62). */
    sourceChecksum: string;
  }>;
}

/** Port: write a built runtime dataset file; returns the path written. */
export interface IFileWriter {
  writeDataset(datasetId: string, json: string): Promise<string>;
}

/** Per-dataset result recorded in the batch report (§66). */
export interface IngestionResult {
  datasetId: string;
  status: 'BUILT' | 'SKIPPED' | 'FAILED';
  /** Runtime dataset path (when BUILT). */
  datasetPath?: string;
  /** SHA-256 of the built runtime JSON (when BUILT). */
  checksum?: string;
  /** Verse count of the built dataset (when BUILT). */
  verseCount?: number;
  /** Validation report (when BUILT). */
  validation?: ValidationReport;
  /** Failure reason (when FAILED). */
  error?: string;
}

export interface IngestionOrchestratorOptions {
  sourceProvider: ISourceProvider;
  fileWriter: IFileWriter;
  /** Canon expectation applied during validation. */
  expectation: CanonExpectation;
  /** Adapter that turns raw content into a `BibleDocument`. Defaults to USFM. */
  adapter?: { parse(content: string): BibleDocument };
  /** Normalizer options (injected codeMap / names / testament, D4). */
  normalizer?: NormalizerOptions;
}

export class BibleIngestionOrchestrator {
  private readonly opts: IngestionOrchestratorOptions;

  constructor(opts: IngestionOrchestratorOptions) {
    this.opts = opts;
  }

  /**
   * Ingest a single dataset end-to-end. Throws on any step failure so the
   * batch caller can isolate it (§67/§68).
   */
  async ingestDataset(manifest: BibleDatasetManifest): Promise<IngestionResult> {
    const { sourceProvider, fileWriter, expectation } = this.opts;
    const adapter = this.opts.adapter ?? { parse: (c: string) => USFMAdapter.parse(c) };

    // 1. Resolve raw source content (local reuse §72, or download).
    const { content, sourceChecksum } = await sourceProvider.resolve(manifest);

    // 2. Detect format (usfm is expected; the adapter handles it).
    const format = detectFormat(content);
    if (format === 'usfx') {
      throw new Error('USFXAdapter is not implemented yet (lazy extensibility, §46)');
    }
    if (format === 'json') {
      throw new Error('JSONAdapter is not implemented yet (lazy extensibility, §46)');
    }
    if (format !== 'usfm') {
      throw new Error(`Unrecognized source format for ${manifest.id} (got "${format}")`);
    }

    // 3. Parse → canonical document.
    const document = adapter.parse(content);

    // 4. Normalize → VersyFlow runtime shape (injected maps, D4).
    const normalizerOpts: NormalizerOptions = {
      codeMap: USFM_TO_VFLOW,
      testament: usfmTestament,
      ...this.opts.normalizer,
    };
    const data = normalizeDocument(
      document,
      {
        id: manifest.id,
        language: manifest.language,
        name: manifest.name,
        year: manifest.year,
        author: manifest.author,
      },
      normalizerOpts,
    );

    // 5. Validate against the canon expectation.
    const report = validateDocument(
      {
        books: (data.books ?? []).map((b) => ({
          id: b.id,
          chapters: b.chapters.map((c) => ({
            number: c.number,
            verses: c.verses.map((v) => ({ number: v.number, text: v.text })),
          })),
        })),
      },
      expectation,
    );
    // §53: only ERROR-severity issues block the build; WARNING-severity
    // issues (e.g. empty verses from incomplete source corpora) are recorded
    // in the report but do not prevent the dataset from being written.
    const blockingErrors = report.issues.filter((i) => i.severity === 'error');
    if (blockingErrors.length > 0) {
      const errors = blockingErrors.map((i) => i.message).join('; ');
      throw new Error(`Validation failed for ${manifest.id}: ${errors}`);
    }

    // 6. Write runtime dataset + checksum (§65).
    const json = JSON.stringify(data, null, 2);
    const checksum = sha256(json);
    const datasetPath = await fileWriter.writeDataset(manifest.id, json);
    const verseCount = data.books.reduce(
      (s, b) => s + b.chapters.reduce((c, ch) => c + ch.verses.length, 0),
      0,
    );

    return {
      datasetId: manifest.id,
      status: 'BUILT',
      datasetPath,
      checksum,
      verseCount,
      validation: report,
    };
  }

  /**
   * Incremental skip (§62): when the manifest's checksum matches the current
   * source checksum, the build is already up to date.
   */
  shouldSkip(manifest: BibleDatasetManifest, sourceChecksum: string | undefined): boolean {
    return manifest.checksum != null && manifest.checksum === sourceChecksum;
  }

  /**
   * Run a batch of datasets, fault-tolerant: one failure records `FAILED`
   * with the reason and the batch continues (§67/§68).
   *
   * `sourceChecksums` maps datasetId → current source checksum; when it
   * matches the manifest's checksum the dataset is skipped (§62).
   */
  async runBatch(
    manifests: BibleDatasetManifest[],
    sourceChecksums: Record<string, string> = {},
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];
    for (const manifest of manifests) {
      const sourceChecksum = sourceChecksums[manifest.id];
      if (this.shouldSkip(manifest, sourceChecksum)) {
        results.push({
          datasetId: manifest.id,
          status: 'SKIPPED',
          checksum: sourceChecksum,
        });
        continue;
      }
      try {
        results.push(await this.ingestDataset(manifest));
      } catch (error) {
        results.push({
          datasetId: manifest.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return results;
  }
}

/** SHA-256 hex of a string. */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf-8').digest('hex');
}
