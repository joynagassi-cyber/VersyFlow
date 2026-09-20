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

  entries.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(OUT_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`[bible] Wrote ${entries.length} entries → ${OUT_FILE}`);
}

main();
