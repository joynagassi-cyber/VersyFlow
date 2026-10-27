/**
 * powersync-pg-auth-test — non-invasive check: can `powersync_role`
 * authenticate to the Supabase Postgres with the password currently stored
 * in .env.local (`PS_POWERSYNC_ROLE_PASSWORD`)?
 *
 * If YES  → the repo's password IS the live DB password, and the Cloud
 *           `default_password` secret is stale (must be re-pushed).
 * If NO   → the live DB password differs from the repo's value; we must
 *           realign the DB before pushing the secret.
 *
 * Read-only (a single `SELECT 1`). Prints only ok/fail, never the password.
 */

import fs from 'node:fs';
import path from 'node:path';

import pg from 'pg';

function loadEnvVar(name: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    if (t.slice(0, i).trim() === name) return t.slice(i + 1).trim();
  }
  return '';
}

const user = 'powersync_role';
const database = 'postgres';
const password = loadEnvVar('PS_POWERSYNC_ROLE_PASSWORD');

console.log(`[pg-auth] user=${user} password-present=${!!password}`);
if (!password) {
  console.log('[pg-auth] ✗ PS_POWERSYNC_ROLE_PASSWORD missing from .env.local');
  process.exit(2);
}

// The direct DB host (`db.<ref>.supabase.co:5432`) does not resolve in this
// sandbox. Supabase's *transaction pooler* (`<ref>.supabase.co:6543`) DOES
// resolve and authenticates the same role+password, so use it as the auth
// oracle. A `SELECT 1` over the pooler proves the password without any
// replication capability (which only matters on the direct host).
const host = 'dspqvyesfngxuwqhceog.supabase.co';
const port = 6543;
const client = new pg.Client({
  host,
  port,
  user,
  database,
  password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

client
  .connect()
  .then(async () => {
    const r = await client.query('SELECT 1 AS ok, current_user AS who');
    console.log(`[pg-auth] ✓ AUTH OK via pooler ${host}:${port} as ${r.rows[0].who}`);
    await client.end();
    process.exit(0);
  })
  .catch((e: pg.Client) => {
    console.log(`[pg-auth] ✗ AUTH FAILED via pooler: ${e?.message ?? e}`);
    process.exit(1);
  });
