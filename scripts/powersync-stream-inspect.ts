/**
 * powersync-stream-inspect — capture the RAW service response for the sync
 * stream endpoint, bypassing the SDK, to see exactly what the service
 * returns for a user (buckets, status, error codes).
 */

import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

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
    anonKey: vars.VITE_SUPABASE_ANON_KEY || '',
    serviceKey: vars.SUPABASE_SECRET_KEY || '',
    powersyncUrl: vars.VITE_POWERSYNC_URL || '',
  };
}

async function main() {
  const cfg = loadEnv();
  const admin = createClient(cfg.supabaseUrl, cfg.serviceKey);
  const anon = createClient(cfg.supabaseUrl, cfg.anonKey);

  const runId = randomUUID().slice(0, 8);
  const email = `e6-probe-${runId}@versyflow.local`;
  const password = `Pb-${randomBytes(10).toString('base64url')}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(createErr?.message ?? 'no user');
  const userId = created.user.id;
  console.log(`[probe] user ${userId}`);

  try {
    // Seed two rows so the service has something to match.
    for (const [table, rows] of [
      ['settings', { user_id: userId, theme: 'dark' }],
      ['learner_profiles', { user_id: userId, display_name: 'probe' }],
    ] as const) {
      const r = await admin.from(table).insert(rows);
      if (r.error) console.warn(`[probe] seed ${table} failed: ${r.error.message}`);
    }
    await new Promise((r) => setTimeout(r, 5000)); // settle replication

    const { data: signIn } = await anon.auth.signInWithPassword({ email, password });
    const jwt = signIn.session!.access_token;
    const endpoint = cfg.powersyncUrl.replace(/\/$/, '');

    // Raw stream request — same shape the SDK makes on connect.
    const url = `${endpoint}/sync/stream`;
    console.log(`[probe] GET ${url} (no token)`);
    const r0 = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Token ${jwt}` },
    });
    const body0 = await r0.text();
    console.log(`[probe] HTTP ${r0.status}`);
    console.log(`[probe] body: ${body0.slice(0, 4000)}`);

    // Also the checkpoint endpoint.
    console.log(`\n[probe] GET ${endpoint}/write-checkpoint2.json`);
    const r1 = await fetch(`${endpoint}/write-checkpoint2.json`, {
      method: 'GET',
      headers: { Authorization: `Token ${jwt}` },
    });
    console.log(`[probe] HTTP ${r1.status} body: ${(await r1.text()).slice(0, 500)}`);
  } finally {
    await admin.from('settings').delete().eq('user_id', userId);
    await admin.from('learner_profiles').delete().eq('user_id', userId);
    await admin.from('users').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
    console.log(`[probe] cleaned up ${userId}`);
  }
}

main().catch((e) => {
  console.error('[probe]', e?.message ?? e);
  process.exit(1);
});
