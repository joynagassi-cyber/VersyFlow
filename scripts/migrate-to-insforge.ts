// scripts/migrate-to-insforge.ts — legacy MMKV → PowerSync migration entry point.
//
// Historically this script constructed a CloudMemorizationService wrapper
// (which no longer exists — single PowerSync write path, P0A-3). It now
// delegates to the standalone `migrateMmkvToPowerSync` from
// `@/sync/migration-mmkv-powersync`, which is idempotent and already the
// entry point used by `sync-store` on first launch.
//
// Run (Node tooling path — tsconfig-paths resolves the `@/*` aliases):
//   npx tsx -r tsconfig-paths/register -p tsconfig.app.json \
//        scripts/migrate-to-insforge.ts
//
// Credentials / user-id provider are read from `.env.local` + the shared
// `SupabaseAuthService`. This is a one-shot migration tool, not part of
// the app runtime.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { migrateMmkvToPowerSync } from '@/sync/migration-mmkv-powersync';

// Minimal in-app user-id provider (one-shot tool — no need for the full
// auth service graph here).
async function loadEnv(): Promise<{
  supabaseUrl: string;
  serviceKey: string;
}> {
  const file = path.resolve(__dirname, '..', '.env.local');
  if (!existsSync(file)) {
    throw new Error(`[migrate] .env.local not found at ${file}`);
  }
  const raw = readFileSync(file, 'utf8');
  const get = (k: string): string => {
    const m = raw.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'\\n]+)['"]?`, 'm'));
    if (!m) throw new Error(`[migrate] missing ${k} in .env.local`);
    return m[1].trim();
  };
  return { supabaseUrl: get('VITE_SUPABASE_URL'), serviceKey: get('VITE_SUPABASE_SERVICE_ROLE_KEY') };
}

async function main() {
  const { supabaseUrl, serviceKey } = await loadEnv();
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Resolve the target user. In production this is the authenticated app
  // user (SupabaseAuthService). For a one-shot migration we accept
  // SUPABASE_USER_EMAIL in .env.local; fall back to the service role's
  // first user row if unset.
  const emailMatch = readFileSync(
    path.resolve(__dirname, '..', '.env.local'),
    'utf8',
  ).match(/^SUPABASE_USER_EMAIL\s*=\s*['"]?([^'\n]+)/m);
  const email = emailMatch ? emailMatch[1].trim() : undefined;

  let targetUser;
  if (email) {
    const { data } = await admin.from('users').select('id').eq('email', email).limit(1);
    targetUser = data?.[0];
  } else {
    const { data } = await admin.from('users').select('id').limit(1);
    targetUser = data?.[0];
  }

  if (!targetUser) {
    console.error('[migrate] no target user found. Set SUPABASE_USER_EMAIL in .env.local.');
    process.exit(1);
  }

  const userIdProvider = { resolveUserId: async () => targetUser.id };

  const result = await migrateMmkvToPowerSync(userIdProvider);
  console.log(
    `[migrate] user=${targetUser.id} migratedRecords=${result.migratedRecords} migratedLogs=${result.migratedLogs} hasMore=${result.hasMore}`,
  );
}

main().catch((err) => {
  console.error('[migrate] fatal:', err);
  process.exit(1);
});
