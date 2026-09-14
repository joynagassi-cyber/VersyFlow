/**
 * Supabase Storage bootstrap for Bible datasets.
 *
 * Creates the public `bible-datasets` bucket (idempotent) and uploads every
 * built dataset JSON found in `data/bible/*.json` (excluding the catalogue
 * manifest itself). Intended to be run once when the Supabase project is
 * (re-)provisioned, or before each release that ships new datasets.
 *
 * Usage:
 *   npx tsx scripts/supabase/setup-bible-datasets.ts
 *
 * Requires env (or `.env.local`):
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (admin access)
 *   or
 *   VITE_SUPABASE_URL + SUPABASE_SECRET_KEY
 *
 * The bucket is `public`: read access is open (anyone can fetch the JSONs).
 * Writes are restricted to the service role key only — the anon key cannot
 * upload. The client app downloads via the public REST URL that
 * `BibleDatasetDistributionService` constructs (`.../storage/v1/object/
 * public/bible-datasets/<id>.json`).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const BUCKET = 'bible-datasets';
const DATA_DIR = path.resolve(__dirname, '../../data/bible');
const EXCLUDE = new Set(['dataset-catalog.json']);

/**
 * Read `VITE_SUPABASE_URL` + `SUPABASE_SECRET_KEY` from `.env.local`,
 * matching the convention of the other Supabase CLI tools in this repo.
 */
function loadEnv() {
  const file = path.resolve(__dirname, '../../.env.local');
  const raw = fs.readFileSync(file, 'utf8');
  const vars: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    vars.VITE_SUPABASE_URL ??
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    vars.SUPABASE_SECRET_KEY ??
    '';
  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials — set VITE_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local',
    );
  }
  return { url, key };
}

function getSupabaseAdmin(): SupabaseClient {
  const { url, key } = loadEnv();
  return createClient(url, key, { auth: { persistSession: false } });
}

async function ensureBucket(
  client: SupabaseClient,
): Promise<void> {
  const { data, error } = await client.storage.getBucket(BUCKET);
  if (error && error.code !== 'bucket-not-found' && !/bucket not found|not found/i.test(error.message)) {
    throw new Error(`getBucket failed: ${error.message}`);
  }
  if (!data) {
    const { error: createErr } = await client.storage.createBucket(BUCKET, {
      public: true,
    });
    if (createErr && !/already exists/i.test(createErr.message)) {
      throw new Error(`createBucket failed: ${createErr.message}`);
    }
    console.log(`✔ Created public bucket "${BUCKET}"`);
  } else {
    console.log(`✔ Bucket "${BUCKET}" already exists`);
  }
}

function listDatasetFiles(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json') && !EXCLUDE.has(f));
}

async function main(): Promise<void> {
  const client = getSupabaseAdmin();
  console.log(`▸ ${client.supabaseUrl}`);

  await ensureBucket(client);

  const files = listDatasetFiles();
  console.log(`▸ Uploading ${files.length} dataset(s) → ${BUCKET}`);

  let uploaded = 0;
  let skipped = 0;
  for (const file of files) {
    const id = file.replace(/\.json$/, '');
    const buf = fs.readFileSync(path.join(DATA_DIR, file));
    const existing = await client.storage.from(BUCKET).get(`${id}.json`);
    if (existing.error && existing.error.code !== 'file-not-found') {
      throw new Error(`get ${id}.json failed: ${existing.error.message}`);
    }
    if (!existing.error) {
      console.log(`· ${id}.json already present — skipping`);
      skipped += 1;
      continue;
    }
    const { error: upErr } = await client.storage
      .from(BUCKET)
      .upload(`${id}.json`, buf, {
        contentType: 'application/json',
        upsert: false,
      });
    if (upErr) throw new Error(`upload ${id}.json failed: ${upErr.message}`);
    console.log(`✔ ${id}.json (${(buf.length / 1_000_000).toFixed(1)} MB)`);
    uploaded += 1;
  }

  const publicUrl = client.storage
    .from(BUCKET)
    .getPublicUrl('lsg.json')
    .data.publicUrl;
  console.log(`\nDone — ${uploaded} uploaded, ${skipped} skipped.`);
  console.log(`Sample public URL: ${publicUrl}`);
}

main().catch((err) => {
  console.error('✖', err instanceof Error ? err.message : err);
  process.exit(1);
});
