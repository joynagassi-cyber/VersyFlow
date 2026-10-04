/**
 * scripts/bible/generate-dataset-catalog.ts
 *
 * Regenerates `data/bible/dataset-catalog.json` from the built dataset
 * files under `data/bible/*.json` (top-level translation files only).
 *
 * Entry shape: { id, checksum, sizeBytes, builtAt }
 *  - checksum: `sha256:<hex>` of the on-disk file bytes — the exact value
 *    the app's distribution service uses to detect stale downloads.
 *
 * Run: `npx tsx scripts/bible/generate-dataset-catalog.ts`
 */

import { createHash } from 'node:crypto';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(__dirname, '../../data/bible');
const OUT_FILE = path.join(DATA_DIR, 'dataset-catalog.json');

interface CatalogEntry {
  id: string;
  checksum: string;
  sizeBytes: number;
  builtAt: string;
}

/** Superset shape of a pending stub (added by `ebible_catalog.py --update-catalog`). */
interface PendingStubEntry extends Partial<CatalogEntry> {
  language?: string;
  name?: string;
  year?: number;
  license?: string;
  books?: number;
  status?: string;
  ebibleId?: string;
  url?: string;
  rawPath?: string;
  notes?: string;
}

function main(): void {
  const files = readdirSync(DATA_DIR).filter(
    (f) => f.endsWith('.json') && f !== 'dataset-catalog.json',
  );

  const entries: CatalogEntry[] = [];
  for (const file of files) {
    const id = path.basename(file, '.json');
    const buf = readFileSync(path.join(DATA_DIR, file));
    const checksum = `sha256:${createHash('sha256').update(buf).digest('hex')}`;
    const stat = statSync(path.join(DATA_DIR, file));
    entries.push({
      id,
      checksum,
      sizeBytes: stat.size,
      builtAt: stat.mtime.toISOString(),
    });
  }

  // Preserve pending stubs from the existing catalog (added by
  // `ebible_catalog.py --update-catalog`). A stub is dropped only when
  // a built JSON dataset with the same id now exists.
  let prior: PendingStubEntry[] = [];
  try {
    const priorBuf = readFileSync(OUT_FILE, 'utf-8');
    const parsed = JSON.parse(priorBuf) as PendingStubEntry[];
    prior = Array.isArray(parsed) ? parsed : [];
  } catch {
    // no existing catalog — first run
  }
  const builtIds = new Set(entries.map((e) => e.id));
  const stubs = prior.filter(
    (e) => e.id && e.id !== 'dataset-catalog.json' && !builtIds.has(e.id),
  );

  const out: Array<CatalogEntry | (CatalogEntry & PendingStubEntry)> = [
    ...entries,
    ...stubs.map((s) => ({
      ...s,
      checksum: s.checksum ?? 'sha256:pending',
      sizeBytes: s.sizeBytes ?? 0,
      builtAt: s.builtAt ?? s.id,
      status: 'pending',
    })),
  ];

  out.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(
    `[bible] Wrote ${entries.length} built + ${stubs.length} pending stubs → ${OUT_FILE}`,
  );
}

main();
