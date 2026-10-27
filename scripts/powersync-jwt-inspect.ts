/**
 * powersync-jwt-inspect — isolate the `auth.user_id()` resolution question.
 *
 * E6 symptom: a brand-new Supabase user with confirmed server rows + a healthy
 * replication slot + a successful `connected` PowerSync session still yields
 * `ps_buckets = 0` (no buckets built). The prime suspect is that the service
 * accepts the JWT signature but `auth.user_id()` does not resolve to the
 * user's uuid — most commonly a **JWT signing-key-type mismatch** between
 * what the Supabase project issues and what the PowerSync service is
 * configured to verify (`supabase: true` auto-detect vs a legacy HS256
 * `supabase_jwt_secret`).
 *
 * This script decides that question WITHOUT a PowerSync connection:
 *   1. Create a throwaway Supabase user.
 *   2. Sign in via the anon client → obtain a real user JWT.
 *   3. Print the JWT **header** (`alg`, `kid`) + payload (`sub`, `aud`).
 *   4. Fetch the project's JWKS and check whether the token's `kid` is
 *      actually present in it (i.e. verifiable via the asymmetric path).
 *   5. Clean up the user.
 *
 * Read-only against PowerSync. Safe.
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
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (k) vars[k] = v;
  }
  return {
    supabaseUrl: vars.VITE_SUPABASE_URL || vars.SUPABASE_URL || '',
    anonKey: vars.VITE_SUPABASE_ANON_KEY || vars.SUPABASE_ANON_KEY || '',
    serviceKey: vars.SUPABASE_SECRET_KEY || '',
  };
}

function b64urlDecode(input: string): Buffer {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(s, 'base64');
}

async function main(): Promise<void> {
  const cfg = loadEnv();
  const admin = createClient(cfg.supabaseUrl, cfg.serviceKey);
  const anon = createClient(cfg.supabaseUrl, cfg.anonKey);

  const runId = randomUUID().slice(0, 8);
  const email = `e6-jwt-${runId}@versyflow.local`;
  const password = `JwT-${randomBytes(12).toString('base64url')}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    console.error(`[JWT] createUser failed: ${createErr?.message ?? 'no user'}`);
    process.exit(1);
  }
  const userId = created.user.id;
  console.log(`[JWT] created ${userId}`);

  try {
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr || !signIn.session) {
      console.error(`[JWT] sign-in failed: ${signInErr?.message ?? 'no session'}`);
      return;
    }
    const jwt = signIn.session.access_token;
    const [hB64, pB64] = jwt.split('.');
    const header = JSON.parse(b64urlDecode(hB64).toString('utf8'));
    const payload = JSON.parse(b64urlDecode(pB64).toString('utf8'));

    console.log('\n--- JWT header ---');
    console.log(JSON.stringify(header, null, 2));
    console.log('\n--- JWT payload (claims) ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log(`\n[JWT] sub === created user id?  ${payload.sub === userId}`);

    // Fetch the JWKS the service SHOULD use (auto-detect path).
    const jwksUrl = `${cfg.supabaseUrl}/auth/v1/.well-known/jwks.json`;
    console.log(`\n[JWT] fetching JWKS: ${jwksUrl}`);
    const res = await fetch(jwksUrl);
    if (!res.ok) {
      console.log(`[JWT] JWKS fetch failed: HTTP ${res.status}`);
      return;
    }
    const jwks = (await res.json()) as {
      keys: Array<{ kid?: string; kty: string; alg?: string }>;
    };
    const keys = jwks.keys;
    console.log(`[JWT] JWKS keys: ${keys.length}`);
    for (const k of keys) {
      console.log(
        `     kid=${k.kid ?? '(none)'} kty=${k.kty} alg=${k.alg ?? '(implicit by kty)'}`,
      );
    }
    const kid = header.kid;
    const match = keys.find((k) => k.kid === kid);
    console.log(
      `\n[JWT] token kid=${kid ?? '(none)'} present in JWKS? ${
        match ? 'YES' : 'NO'
      }`,
    );
    if (match) {
      console.log(`[JWT] matched key: kty=${match.kty} alg=${match.alg ?? n/a}`);
    }
    console.log(
      `\n[JWT] VERDICT:\n` +
        `  token signed with alg=${header.alg}.\n` +
        (header.alg === 'HS256'
          ? "  -> Symmetric. A 'supabase_jwt_secret' (HS256) config is correct."
          : `  -> Asymmetric (${header.alg}). The service must verify via JWKS auto-detect; a\n` +
            "    'supabase_jwt_secret' HS256 entry would be the WRONG key type."),
    );
  } finally {
    const { error: delPub } = await admin.from('users').delete().eq('id', userId);
    if (delPub) console.warn(`[JWT] cleanup public.users warn: ${delPub.message}`);
    const { error: delAuth } = await admin.auth.admin.deleteUser(userId);
    if (delAuth) console.warn(`[JWT] cleanup auth.users warn: ${delAuth.message}`);
    console.log(`[JWT] cleaned up ${userId}`);
  }
}

main().then(
  () => {
    process.exitCode = 0;
  },
  (e) => {
    console.error(`[JWT] ${e?.message ?? e}`);
    process.exitCode = 1;
  },
);
