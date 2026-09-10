/**
 * powersync-connect-existing — connect a headless PowerSync client as an
 * ALREADY-EXISTING user (no create/delete), and observe whether the service
 * builds that user's buckets + delivers rows to local SQLite.
 *
 * Usage:
 *   npx tsx scripts/powersync-connect-existing.ts <email> <password> [user_id]
 *
 * The user and its rows must persist for the whole duration (do NOT run the
 * wire-check cleanup against them concurrently). This is the tool that
 * disambiguates "bucket build latency" from "bucket build never happens":
 *   - if a fresh connect to a long-lived user shows buckets → it was latency
 *   - if it still shows 0 buckets with data present → the service's
 *     row→bucket materialisation is not running for these tables.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';
import { PowerSyncDatabase } from '@powersync/node';

import { buildPowerSyncSchema } from '../src/infrastructure/sync/powersync-schema';

class StaticConnector {
  private readonly endpoint: string;
  private readonly token: string;
  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint;
    this.token = token;
  }
  fetchCredentials() {
    return Promise.resolve({ endpoint: this.endpoint, token: this.token });
  }
  uploadData() {
    return Promise.resolve();
  }
}

function loadEnv() {
  const raw = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
  const v: Record<string, string> = {};
  for (const l of raw.split(/\r?\n/)) {
    const t = l.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    v[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return {
    supabaseUrl: v.VITE_SUPABASE_URL || '',
    anonKey: v.VITE_SUPABASE_ANON_KEY || '',
    powersyncUrl: v.VITE_POWERSYNC_URL || '',
  };
}

async function main() {
  const [email, password, providedId] = process.argv.slice(2);
  if (!email || !password) {
    console.error('usage: powersync-connect-existing <email> <password> [user_id]');
    process.exit(2);
  }
  const cfg = loadEnv();
  const anon = createClient(cfg.supabaseUrl, cfg.anonKey);
  const signIn = (await anon.auth.signInWithPassword({ email, password })).data;
  if (!signIn?.session) throw new Error('sign-in failed');
  const jwt = signIn.session.access_token;
  const userId = providedId || signIn.session.user?.id;
  console.log(`[connect] as user ${userId} (${email})`);

  const schema = buildPowerSyncSchema();
  schema.validate();
  const tmpDb = path.join(
    os.tmpdir(),
    `vs-connect-${Date.now().toString(36)}.sqlite`,
  );
  const db = new PowerSyncDatabase({
    schema,
    database: { dbFilename: tmpDb, implementation: { type: 'better-sqlite3' } },
  });
  await db.connect(new StaticConnector(cfg.powersyncUrl, jwt));

  let settled = false;
  try {
    await db.waitForFirstSync({ signal: AbortSignal.timeout(45_000) });
    settled = true;
  } catch (e) {
    console.log(`[connect] firstSync window ended: ${(e as Error).message}`);
  }

  // Poll up to 90s for the user's row to land.
  const start = Date.now();
  const deadlineMs = 90_000;
  let users = 0;
  let settings = 0;
  let streaks = 0;
  let profiles = 0;
  let collections = 0;
  let buckets = 0;
  for (;;) {
    const [b, u, s, st, p, c] = await Promise.all([
      db.get<{ c: number }>('SELECT count(*) AS c FROM ps_buckets'),
      db.get<{ c: number }>(`SELECT count(*) AS c FROM users WHERE id = ?`, [userId]),
      db.get<{ c: number }>('SELECT count(*) AS c FROM settings'),
      db.get<{ c: number }>('SELECT count(*) AS c FROM streaks'),
      db.get<{ c: number }>('SELECT count(*) AS c FROM learner_profiles'),
      db.get<{ c: number }>('SELECT count(*) AS c FROM collections'),
    ]);
    buckets = b.c;
    users = u.c;
    settings = s.c;
    streaks = st.c;
    profiles = p.c;
    collections = c.c;
    console.log(
      `[connect] +${Math.round((Date.now() - start) / 1000)}s buckets=${buckets} users=${users} settings=${settings} streaks=${streaks} profiles=${profiles} collections=${collections} connected=${db.currentStatus.connected} lastSyncedAt=${db.currentStatus.lastSyncedAt?.toISOString() ?? 'n/a'}`,
    );
    if (buckets > 0 && users > 0) break;
    if (Date.now() - start > deadlineMs) break;
    await new Promise((r) => setTimeout(r, 5_000));
  }

  // Final dump of the subscription contents (not just counts) — a stuck
  // stream shows as last_synced_at = 0 / NULL while others advance.
  try {
    const subs = await db.getAll('SELECT stream_name, active, last_synced_at FROM ps_stream_subscriptions');
    console.log('\n[connect] ps_stream_subscriptions contents:');
    for (const s of subs) console.log('  ', JSON.stringify(s));
  } catch {
    /* db may be closing */
  }
  try {
    const [b0, b1] = await Promise.all([
      db.get<{ c: number }>('SELECT count(*) AS c FROM ps_buckets'),
      db.get<{ c: number }>('SELECT count(*) AS c FROM ps_data__users'),
    ]);
    console.log(`[connect] final: buckets=${b0.c} ps_data__users=${b1.c}`);
  } catch {
    /* ignore */
  }

  await db.close().catch(() => {});
  fs.rmSync(tmpDb, { force: true });
  if (buckets > 0) {
    console.log(`[connect] ✅ BUCKETS BUILT (${buckets}) — data path works`);
  } else {
    console.log(`[connect] ❌ still 0 buckets after ${deadlineMs / 1000}s with data present`);
  }
}

main().then(
  () => {
    process.exitCode = 0;
  },
  (e) => {
    console.error('[connect]', e?.message ?? e);
    process.exitCode = 1;
  },
);
