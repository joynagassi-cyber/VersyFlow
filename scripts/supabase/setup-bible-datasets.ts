/**
 * scripts/supabase/setup-bible-datasets.ts
 *
 * Creates the public Supabase Storage bucket `bible-datasets` (if missing)
 * and uploads every `data/bible/*.json` top-level translation file
 * (skipping `dataset-catalog.json` and subdirectories).
 *
 * Idempotent: re-runs only re-upload files whose remote size differs.
 *
 * Credentials: reads `VITE_SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or
 * `SUPABASE_SERVICE_ROLE_KEY`) from `.env.local` — the secret key acts as
 * the storage admin key. Never hardcode keys.
 *
 * Run: `npx tsx scripts/supabase/setup-bible-datasets.ts`
 */

import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.resolve(__dirname, '../../data/bible');
const BUCKET = 'bible-datasets';

function loadEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  const envPath = path.resolve(__dirname, '../../.env.local');
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* .env.local missing — fall back to process env */
  }
  return vars;
}

function humanSize(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function main(): Promise<void> {
  const vars = loadEnv();
  const url = vars.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    vars.SUPABASE_SECRET_KEY ??
    vars.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.error('[bible:deploy] Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
    process.exit(1);
  }

  console.log(`▸ ${url}`);
  const client = createClient(url, key, { auth: { persistSession: false } });

  // 1. Ensure the bucket exists and is public.
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    console.error(`[bible:deploy] listBuckets failed: ${listError.message}`);
    process.exit(1);
  }
  const existing = (buckets ?? []).find((b) => b.name === BUCKET);
  if (!existing) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error(`[bible:deploy] Failed to create bucket: ${error.message}`);
      process.exit(1);
    }
    console.log(`✔ Created public bucket "${BUCKET}"`);
  } else {
    console.log(`✔ Bucket "${BUCKET}" already exists (public: ${existing.public})`);
  }

  // 2. List remote objects so we can skip unchanged files (idempotent re-runs).
  const { data: remoteFiles } = await client.storage.from(BUCKET).list('', { limit: 1000 });
  const remoteSizes = new Map<string, number>();
  for (const file of remoteFiles ?? []) {
    if (typeof file.name === 'string') {
      remoteSizes.set(file.name, (file.metadata as { size?: number })?.size ?? 0);
    }
  }

  // 3. Upload each dataset (buffered, so Node's global fetch can stream it).
  const files = readdirSync(DATA_DIR).filter(
    (f) => f.endsWith('.json') && f !== 'dataset-catalog.json',
  );
  console.log(`▸ Uploading ${files.length} dataset(s) → ${BUCKET}`);

  let uploaded = 0;
  let skipped = 0;
  for (const file of files) {
    const id = path.basename(file, '.json');
    const filePath = path.join(DATA_DIR, file);
    const size = statSync(filePath).size;

    // Skip when the remote copy already has the same byte size.
    if (remoteSizes.get(`${id}.json`) === size) {
      skipped += 1;
      console.log(`= ${file} already up to date (${humanSize(size)})`);
      continue;
    }

    const content = readFileSync(filePath);
    const { error } = await client.storage
      .from(BUCKET)
      .upload(`${id}.json`, content, {
        contentType: 'application/json',
        upsert: true,
      });
    if (error) {
      console.error(`[bible:deploy] Failed to upload ${file}: ${error.message}`);
      process.exit(1);
    }
    uploaded += 1;
    console.log(`✔ ${file} (${humanSize(size)})`);
  }

  console.log(`\nDone — ${uploaded} uploaded, ${skipped} skipped.`);
  console.log(`Sample public URL: ${url}/storage/v1/object/public/${BUCKET}/lsg.json`);
}

main().catch((error: unknown) => {
  console.error('[bible:deploy] Unexpected error:', error);
  process.exit(1);
});
