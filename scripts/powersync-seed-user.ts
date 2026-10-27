/**
 * powersync-seed-user — create a PERSISTENT witness user + seed rows on
 * Production, WITHOUT deleting them afterwards. Intentionally the inverse of
 * the wire-check cleanup: we need the rows to exist while the PowerSync
 * Cloud service builds its buckets.
 *
 * Usage:
 *   npx tsx scripts/powersync-seed-user.ts            # create + seed + print ids
 *   npx tsx scripts/powersync-seed-user.ts --list     # list current e6-wire users
 *   npx tsx scripts/powersync-seed-user.ts --cleanup  # delete all e6-wire users + their rows
 *
 * This is a manual/interactive tool (no auto-cleanup): always run --cleanup
 * when you are done investigating.
 */

import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

const WITNESS_DISPLAY_NAME = 'E6 Wire Check';
const SEED_TABLES = ['settings', 'streaks', 'learner_profiles', 'collections'] as const;

function loadEnv() {
  const file = path.resolve(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(file, 'utf8');
  const vars: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return {
    supabaseUrl: vars.VITE_SUPABASE_URL || '',
    serviceKey: vars.SUPABASE_SECRET_KEY || '',
  };
}

function adminClient() {
  const cfg = loadEnv();
  return createClient(cfg.supabaseUrl, cfg.serviceKey);
}

async function list(): Promise<void> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('users')
    .select('id, email, display_name, created_at')
    .eq('display_name', WITNESS_DISPLAY_NAME);
  if (error) throw new Error(error.message);
  console.log(`persistent e6-wire users: ${data?.length ?? 0}`);
  for (const u of data ?? []) {
    console.log(`  ${u.id}  ${u.email}  created=${u.created_at}`);
  }
}

async function cleanupAll(): Promise<void> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('users')
    .select('id')
    .eq('display_name', WITNESS_DISPLAY_NAME);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((u) => u.id);
  for (const table of SEED_TABLES) {
    if (!ids.length) break;
    const { error: e } = await admin.from(table).delete().in('user_id', ids);
    if (e) console.warn(`cleanup ${table}: ${e.message}`);
  }
  for (const id of ids) {
    const { error: e } = await admin.from('users').delete().eq('id', id);
    if (e) console.warn(`cleanup users: ${e.message}`);
    const { error: ea } = await admin.auth.admin.deleteUser(id);
    if (ea) console.warn(`cleanup auth: ${ea.message}`);
  }
  console.log(`cleaned up ${ids.length} persistent witness user(s)`);
}

async function create(): Promise<void> {
  const admin = adminClient();
  const runId = randomUUID().slice(0, 8);
  const email = `e6-wire-${runId}@versyflow.local`;
  const password = `E6w-${randomBytes(10).toString('base64url')}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: WITNESS_DISPLAY_NAME },
  });
  if (createErr || !created.user) {
    throw new Error(`createUser: ${createErr?.message ?? 'no user'}`);
  }
  const userId = created.user.id;
  console.log(`created persistent witness user ${userId} (email ${email})`);

  await admin.from('settings').insert({ user_id: userId, theme: 'dark' });
  await admin.from('streaks').insert({
    user_id: userId,
    streak_date: new Date().toISOString().slice(0, 10),
  });
  await admin.from('learner_profiles').insert({ user_id: userId, display_name: 'E6 Witness' });
  await admin.from('collections').insert({ user_id: userId, name: 'E6 Wire Check' });

  console.log(
    `seeded settings/streaks/learner_profiles/collections for ${userId}\n` +
      `password (for a Supabase sign-in): ${password}\n` +
      'KEEP this user while the PowerSync service builds its buckets; ' +
      'run `npx tsx scripts/powersync-seed-user.ts --cleanup` when done.',
  );
}

const mode = process.argv[2];
if (mode === '--list') void list();
else if (mode === '--cleanup') void cleanupAll();
else if (mode === undefined) void create();
else console.error(`unknown mode ${mode}`);
