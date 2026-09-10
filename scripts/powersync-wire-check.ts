/**
 * powersync-wire-check — E6 proof-of-wire for the PowerSync G4 Cloud deploy.
 *
 * Proves end-to-end that the provisioned PowerSync Cloud `Production`
 * instance (`6aa1b9078453e7cf8335b22d`) actually syncs data DOWN to a local
 * SQLite database. The round-trip exercises the REAL path the app will use:
 *
 *   1. Create a throwaway Supabase user (service-role admin, `email_confirm`).
 *      Migration 005's `auth.users → public.users` mirror trigger inserts the
 *      witness row automatically.
 *   2. Assert the witness row exists SERVER-side (decouples "trigger broken"
 *      from "stream lag"), then sign the user in through the anon (publishable)
 *      client to obtain a REAL Supabase JWT — the same token shape the app
 *      presents.
 *   3. Connect a headless `@powersync/node` database to the Cloud endpoint
 *      with that JWT + the app's REAL schema (`buildPowerSyncSchema`).
 *   4. Poll the local SQLite `users` view until the witness row lands (the
 *      initial bucket snapshot may precede our just-inserted row, which then
 *      arrives on a later incremental push). On a miss, dump the `ps_*`
 *      internals so the failure is visible, not a silent hang.
 *   5. Clean up: delete `public.users` (service-key) + `auth.users` (admin).
 *      No `auth → public` cascade, so both are removed explicitly.
 *
 * SAFE-BY-DEFAULT: without `--live` this is a dry run — it validates the
 * schema, loads the credentials, and prints the plan, but does NOT create any
 * user or connect to the Cloud instance. Pass `--live` to run the real
 * round-trip.
 *
 * GUARANTEED CLEANUP: the witness is deleted on every exit path (normal
 * failure, SIGINT/SIGTERM) and a next run also pre-cleans any witness a
 * previously-interrupted run left behind (idempotent, keyed on display_name).
 * No witness should accumulate on Production.
 *
 * Run:
 *   npx tsx scripts/powersync-wire-check.ts          # dry run (no mutation)
 *   npx tsx scripts/powersync-wire-check.ts --live    # real round-trip
 *
 * Credentials are read from `.env.local` (git-ignored). No secret is ever
 * printed. Exit codes: 0 = PASS / dry-run ok, 1 = FAIL / missing config.
 */

import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PowerSyncDatabase } from '@powersync/node';
import type {
  CommonPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/common';

import { buildPowerSyncSchema } from '../src/infrastructure/sync/powersync-schema';

// ---------------------------------------------------------------------------
// .env.local loader (Node tooling path — `import.meta.env` is Vite-only)
// ---------------------------------------------------------------------------

interface EnvConfig {
  supabaseUrl: string;
  anonKey: string;
  serviceKey: string;
  powersyncUrl: string;
}

function loadEnv(): EnvConfig {
  const file = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) {
    throw new Error(
      `[E6] .env.local not found at ${file} — cannot read Supabase/PowerSync credentials.`,
    );
  }
  const raw = fs.readFileSync(file, 'utf8');
  const vars: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key) vars[key] = val;
  }
  const cfg: EnvConfig = {
    supabaseUrl: vars.VITE_SUPABASE_URL || vars.SUPABASE_URL || '',
    anonKey: vars.VITE_SUPABASE_ANON_KEY || vars.SUPABASE_ANON_KEY || '',
    serviceKey: vars.SUPABASE_SECRET_KEY || '',
    powersyncUrl: vars.VITE_POWERSYNC_URL || vars.POWERSYNC_URL || '',
  };
  return cfg;
}

function assertConfig(cfg: EnvConfig): void {
  const missing: string[] = [];
  if (!cfg.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!cfg.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!cfg.serviceKey) missing.push('SUPABASE_SECRET_KEY');
  if (!cfg.powersyncUrl) missing.push('VITE_POWERSYNC_URL');
  if (missing.length) {
    throw new Error(`[E6] missing required env keys in .env.local: ${missing.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Minimal static connector — pins a { endpoint, token } for a read-only test.
// uploadData is a no-op: we only want to observe DOWN-sync, not replay writes.
// ---------------------------------------------------------------------------

class StaticTokenConnector implements PowerSyncBackendConnector {
  private readonly endpoint: string;
  private readonly token: string;

  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint;
    this.token = token;
  }

  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    return { endpoint: this.endpoint, token: this.token };
  }

  async uploadData(_database: CommonPowerSyncDatabase): Promise<void> {
    /* no-op — read-only wire check */
  }
}

// ---------------------------------------------------------------------------
// Idempotent cleanup — delete the witness from public.users (service-key,
// bypasses RLS) then auth.users (admin API). Safe to run repeatedly.
// ---------------------------------------------------------------------------

async function cleanupWitness(
  admin: SupabaseClient,
  userId: string,
  seedRows: Array<{ table: string; id: string }>,
): Promise<void> {
  // FK-safe order: children (seed rows) first, then public.users, then auth.
  for (const row of [...seedRows].reverse()) {
    const { error } = await admin.from(row.table).delete().eq('id', row.id);
    if (error) console.warn(`[E6] cleanup ${row.table} warn: ${error.message}`);
  }
  const { error: delPub } = await admin.from('users').delete().eq('id', userId);
  if (delPub) console.warn(`[E6] cleanup public.users warn: ${delPub.message}`);
  const { error: delAuth } = await admin.auth.admin.deleteUser(userId);
  if (delAuth) console.warn(`[E6] cleanup auth.users warn: ${delAuth.message}`);
  console.log(`[E6] cleaned up witness user ${userId} (+${seedRows.length} seed rows)`);
}

// ---------------------------------------------------------------------------
// Schema check
// ---------------------------------------------------------------------------

function validateSchema(): number {
  const schema = buildPowerSyncSchema();
  schema.validate(); // throws if a table still declares an explicit `id`
  const names = Object.keys(schema.props);
  console.log(`[E6] schema OK — ${schema.tables.length} tables: ${names.join(', ')}`);
  return schema.tables.length;
}

// ---------------------------------------------------------------------------
// Diagnostics — dump les `ps_*` internes du base SQLite local. Les colonnes
// exactes sont compilées dans le binaire Rust (non visibles en source), donc
// on lit le schéma dynamiquement : `SELECT *` + `sqlite_master`, jamais de
// colonnes devinées.
// ---------------------------------------------------------------------------

async function dumpDiagnostics(
  db: InstanceType<typeof PowerSyncDatabase>,
): Promise<void> {
  console.log('[E6] WITNESS NOT DELIVERED locally — dumping sync internals:');
  const allTables: string[] = [];
  try {
    const rows = await db.getAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type IN ('table','view') " +
        "AND (name LIKE 'ps_%' OR name = 'users') ORDER BY name",
    );
    for (const r of rows) allTables.push(r.name);
  } catch (e) {
    console.log(`   (cannot list tables: ${(e as Error).message})`);
  }

  for (const t of allTables) {
    if (t === 'users') {
      // C'est la VUE du dessus du `ps_data__users`. On compte les deux.
      const raw = t.replace('users', 'ps_data__users');
      if (!allTables.includes(raw)) allTables.push(raw);
      allTables.push(t);
      continue;
    }
    // Pour chaque table interne, dump le nombre de lignes + les colonnes.
    try {
      const c = (await db.get<{ c: number }>(`SELECT count(*) AS c FROM "${t}"`)).c;
      const cols = await db.getAll<{ name: string }>(
        `PRAGMA table_info("${t}")`,
      );
      const colNames = cols.map((x) => x.name).join(', ');
      console.log(`   ${t}: ${c} row(s) [cols: ${colNames || '(view)'}]`);
    } catch (e) {
      console.log(`   ${t}: (query failed: ${(e as Error).message})`);
    }
  }

  // État de synchronisation explicit (les colonnes varient selon versions).
  for (const stateTable of ['ps_sync_state', 'ps_stream_subscriptions']) {
    if (!allTables.includes(stateTable)) continue;
    try {
      const rows = await db.getAll(stateTable);
      console.log(
        `   ${stateTable}:\n` +
          rows
            .map((r) => '     ' + JSON.stringify(r))
            .join('\n'),
      );
    } catch (e) {
      console.log(`   ${stateTable}: (dump failed: ${(e as Error).message})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Seed rows — all SYNCED tables are empty in Production, so a brand-new
// witness user has NOTHING in any stream: PowerSync Cloud assigns no bucket
// (ps_buckets stays 0) and the initial snapshot is empty. To make the proof
// deterministic we insert small clearly-marked rows for the witness user in
// several SYNCED tables (settings, streaks, learner_profiles, collections).
// No fabricated Bible text. They are removed by cleanupWitness (FK-safe).
// ---------------------------------------------------------------------------

type SeedRow = { table: string; id: string };

async function seedWitnessData(
  admin: SupabaseClient,
  userId: string,
): Promise<SeedRow[]> {
  const seed: SeedRow[] = [];

  const settingsId = randomUUID();
  let r = await admin.from('settings').insert({
    user_id: userId,
    id: settingsId,
    theme: 'light',
    notification_enabled: false,
  });
  if (r.error) throw new Error(`[E6] seed settings failed: ${r.error.message}`);
  seed.push({ table: 'settings', id: settingsId });

  const streakId = randomUUID();
  r = await admin.from('streaks').insert({
    user_id: userId,
    id: streakId,
    streak_date: new Date().toISOString().slice(0, 10),
    verses_memorized: 1,
    reviews_completed: 1,
  });
  if (r.error) throw new Error(`[E6] seed streaks failed: ${r.error.message}`);
  seed.push({ table: 'streaks', id: streakId });

  const profileId = randomUUID();
  r = await admin.from('learner_profiles').insert({
    user_id: userId,
    id: profileId,
    display_name: 'E6 Witness',
  });
  if (r.error) throw new Error(`[E6] seed learner_profiles failed: ${r.error.message}`);
  seed.push({ table: 'learner_profiles', id: profileId });

  const collectionId = randomUUID();
  r = await admin.from('collections').insert({
    user_id: userId,
    id: collectionId,
    name: 'E6 Wire Check',
    icon: 'folder',
  });
  if (r.error) throw new Error(`[E6] seed collections failed: ${r.error.message}`);
  seed.push({ table: 'collections', id: collectionId });

  console.log(`[E6] seeded ${seed.length} rows across settings/streaks/learner_profiles/collections`);
  return seed;
}

// ---------------------------------------------------------------------------
// Live round-trip
// ---------------------------------------------------------------------------

async function runLive(cfg: EnvConfig): Promise<void> {
  const admin: SupabaseClient = createClient(cfg.supabaseUrl, cfg.serviceKey);
  const anon: SupabaseClient = createClient(cfg.supabaseUrl, cfg.anonKey);

  // One-shot identity — unique per run so re-runs never collide.
  const runId = randomUUID();
  const email = `e6-wire-${runId.slice(0, 8)}@versyflow.local`;
  const password = `E6wire-${randomBytes(10).toString('base64url')}`;
  const tmpDb = path.join(os.tmpdir(), `versyflow-e6-${runId.slice(0, 8)}.sqlite`);

  let createdUserId: string | undefined;
  let seedRows: SeedRow[] = [];
  // A signal handler can fire the moment we create the user; it references
  // these so an interrupted run still cleans up.
  let db: InstanceType<typeof PowerSyncDatabase> | null = null;

  const onSignal = async (sig: string): Promise<void> => {
    console.log(`\n[E6] received ${sig} — cleaning up before exit …`);
    if (createdUserId) {
      try {
        await cleanupWitness(admin, createdUserId, seedRows);
      } catch {
        /* best-effort */
      }
    }
    if (db) {
      try {
        await db.close();
      } catch {
        /* best-effort */
      }
    }
    if (fs.existsSync(tmpDb)) fs.rmSync(tmpDb, { force: true });
    process.exit(130);
  };
  process.once('SIGINT', () => void onSignal('SIGINT'));
  process.once('SIGTERM', () => void onSignal('SIGTERM'));

  try {
    // Idempotent pre-clean: remove any witness + its seed rows a previous
    // interrupted run left behind (keyed on display_name). No-op when there is
    // nothing stale. Seeds are swept by user_id so no orphans accumulate.
    {
      const { data: stalePub } = await admin
        .from('users')
        .select('id')
        .eq('display_name', 'E6 Wire Check');
      const staleIds = (stalePub ?? []).map((row) => (row as { id: string }).id);
      for (const table of ['settings', 'streaks', 'learner_profiles', 'collections']) {
        if (staleIds.length) {
          const { error } = await admin.from(table).delete().in('user_id', staleIds);
          if (error) console.warn(`[E6] pre-clean ${table} warn: ${error.message}`);
        }
      }
      for (const staleId of staleIds) {
        try {
          await cleanupWitness(admin, staleId, []);
        } catch {
          /* may already be gone */
        }
      }
    }

    // 1. Create the witness user (mirror trigger populates public.users).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'E6 Wire Check' },
    });
    if (createErr || !created.user) {
      throw new Error(`[E6] createUser failed: ${createErr?.message ?? 'no user returned'}`);
    }
    createdUserId = created.user.id;
    console.log(`[E6] created witness user ${createdUserId} (mirror → public.users)`);

    // 1b. Server-side assertion: prove the mirror trigger actually inserted
    //     the public.users row (decouples "trigger broken" from "stream lag").
    {
      const { data: serverRow, error: serverErr } = await admin
        .from('users')
        .select('id, email, display_name')
        .eq('id', createdUserId)
        .maybeSingle();
      if (serverErr) {
        throw new Error(`[E6] server assertion query failed: ${serverErr.message}`);
      }
      if (!serverRow) {
        throw new Error(
          `[E6] MIRROR TRIGGER MISSING — public.users has no row for ${createdUserId}. ` +
            'The auth.users → public.users trigger did not fire.',
        );
      }
      console.log(`[E6] server-side witness confirmed: ${JSON.stringify(serverRow)}`);
      // All SYNCED tables are empty in Production, so seed the witness user's
      // data now — before the client connects — so the initial snapshot has
      // something to deliver (a cold user with zero rows gets no bucket).
      seedRows = await seedWitnessData(admin, createdUserId);
      // Let logical replication + the publication slot absorb the INSERTs so
      // the PowerSync stream can pick them up.
      const settleMs = 6_000;
      console.log(`[E6] settling ${settleMs / 1000}s for replication …`);
      await new Promise((r) => setTimeout(r, settleMs));
    }

    // 2. Real user JWT via the anon (publishable) client — same shape as the app.
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr || !signIn.session) {
      throw new Error(
        `[E6] signInWithPassword failed: ${signInErr?.message ?? 'no session'}`,
      );
    }
    const jwt = signIn.session.access_token;
    console.log('[E6] obtained real user JWT (anon client signInWithPassword)');

    // 2b. Proving the auth chain: decode the JWT we are about to send and
    //     confirm `sub` (what `auth.user_id()` resolves to) equals the
    //     witness user id. If they differ, every stream filter on
    //     `user_id = auth.user_id()` matches 0 rows → 0 buckets → this exact
    //     symptom. Also re-confirm the server rows are still present.
    const payloadB64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    // Node's base64 decoder tolerates missing '=' padding.
    const jwtClaims = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    console.log(
      `[E6] JWT claims: sub=${jwtClaims.sub} aud=${JSON.stringify(jwtClaims.aud)} iss=${jwtClaims.iss} exp=${jwtClaims.exp}`,
    );
    console.log(
      `[E6] sub matches witness user: ${jwtClaims.sub === createdUserId}`,
    );
    {
      const { data: checkRows } = await admin
        .from('settings')
        .select('id, user_id')
        .eq('user_id', createdUserId);
      console.log(
        `[E6] server settings rows for ${createdUserId}: ${JSON.stringify(checkRows)}`,
      );
    }

    // 3. Headless PowerSync connection to the Cloud endpoint.
    const schema = buildPowerSyncSchema();
    schema.validate();
    db = new PowerSyncDatabase({
      schema,
      database: { dbFilename: tmpDb, implementation: { type: 'better-sqlite3' } },
    });
    const connector = new StaticTokenConnector(cfg.powersyncUrl, jwt);
    console.log(`[E6] connecting to ${cfg.powersyncUrl} …`);
    await db.connect(connector);

    // 4. Attendre le premier sync COMPLET (bucket initial) en utilisant le bon
    //    type d'argument. `waitForFirstSync` prend un `AbortSignal` ou un objet
    //    `{ signal, priority }` — jamais un nombre (ça serait ignoré et le
    //    processus hanguerait). Pour un user vierge il peut ne « se » faire
    //    qu'une fois que Cloud a calculé le premier snapshot — on borne la
    //    fenêtre et on laisse le polling final porter le verdict.
    const firstSyncWindowMs = 60_000;
    let firstSyncSettled = false;
    try {
      await db.waitForFirstSync({ signal: AbortSignal.timeout(firstSyncWindowMs) });
      firstSyncSettled = true;
      console.log(`[E6] first sync settled within ${firstSyncWindowMs / 1000}s`);
    } catch (e) {
      console.log(`[E6] firstSync did not settle in window: ${(e as Error).message}`);
    }

    // 4b. Poller la ligne témoin dans le SQLite local (vue `users`).
    // Le service materialise les buckets par user sur un cycle de compactor
    // en arrière-plan, pas à chaque change WAL — la fenêtre de polling est
    // donc généreuse (300 s). `powersync compact` peut forcer un pass immédiat.
    const pollDeadlineMs = 300_000;
    const pollIntervalMs = 3_000;
    const startedAt = Date.now();
    let witness: Record<string, unknown> | null = null;
    for (;;) {
      witness = await db.getOptional<Record<string, unknown>>(
        'SELECT * FROM users WHERE id = ?',
        [createdUserId],
      );
      if (witness) break;
      if (Date.now() - startedAt > pollDeadlineMs) break;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    const status = db.currentStatus;
    const bucketCount = (
      await db.get<{ c: number }>('SELECT count(*) AS c FROM ps_buckets')
    ).c;
    console.log(
      `[E6] status connected=${status.connected} lastSyncedAt=${
        status.lastSyncedAt ? status.lastSyncedAt.toISOString() : 'n/a'
      } buckets=${bucketCount} after ${Math.round((Date.now() - startedAt) / 1000)}s of polling`,
    );

    if (!witness) {
      // Diagnostics robustes : on lit le schéma interne dynamique (les colonnes
      // exactes de `ps_*` sont compilées dans le binaire Rust, donc on ne
      // devine pas — `SELECT *` et `sqlite_master`).
      await dumpDiagnostics(db);
      throw new Error(
        `[E6] WITNESS MISSING — local SQLite has no users row for ${createdUserId} ` +
          `after ${pollDeadlineMs / 1000}s. Server-side row existed (asserted above), ` +
          'so the Cloud→stream→local path did not deliver it.',
      );
    }

    console.log('[E6] witness row read from local SQLite:');
    console.log(
      '     ' +
        JSON.stringify(
          {
            id: witness.id,
            email: witness.email,
            display_name: witness.display_name,
            default_translation: witness.default_translation,
            ui_language: witness.ui_language,
          },
          null,
          2,
        ),
    );

    if (witness.id !== createdUserId || witness.email !== email) {
      throw new Error('[E6] witness row identity mismatch (id/email)');
    }
    console.log('[E6] ✅ PASS — Cloud → PowerSync stream → local SQLite round-trip OK');
  } finally {
    // 5. Teardown the PowerSync connection + local db file.
    if (db) {
      try {
        await db.close();
      } catch {
        /* best-effort */
      }
    }
    if (fs.existsSync(tmpDb)) fs.rmSync(tmpDb, { force: true });
    // 6. Always clean up the witness user + its seed rows (idempotent).
    if (createdUserId) {
      try {
        await cleanupWitness(admin, createdUserId, seedRows);
      } catch (e) {
        console.warn(`[E6] final cleanup warn: ${(e as Error).message}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cfg = loadEnv();
  assertConfig(cfg);
  const live = process.argv.includes('--live');

  console.log(`[E6] config loaded: ${cfg.supabaseUrl} → ${cfg.powersyncUrl}`);
  validateSchema();

  if (!live) {
    console.log('[E6] DRY RUN — no mutation. Re-run with `--live` to execute the round-trip.');
    console.log(
      '      npx tsx scripts/powersync-wire-check.ts --live   ' +
        '(creates + deletes one throwaway Supabase user on Production)',
    );
    return;
  }

  await runLive(cfg);
}

main().then(
  () => {
    process.exitCode = 0;
  },
  (err: Error) => {
    console.error(`[E6] ${err.message}`);
    process.exitCode = 1;
  },
);
