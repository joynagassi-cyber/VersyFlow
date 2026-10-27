#!/usr/bin/env node
/**
 * Patch the PowerSync web SDK's `lib/worker/client.js` so its default worker
 * spawn uses a plain string URL instead of `new URL('./worker.js', import.meta.url)`.
 *
 * Why: Vite's worker plugin intercepts the `new URL('./...', import.meta.url)`
 * pattern and tries to bundle `./worker.js` as a separate worker entry. With a
 * code-splitting main build (multiple chunks) and the default `iife` worker
 * format, Rollup refuses with:
 *   "Invalid value iife for option worker.format - UMD and IIFE output
 *    formats are not supported for code-splitting builds."
 *
 * The app never actually calls the default worker: `src/infrastructure/sync/
 * powersync-database.ts` always passes `sync.worker` pointing at the pre-
 * bundled worker in `public/worker/powersync-worker.js`, so the SDK takes the
 * `customWorker` branch. The default-worker code path is dead.
 *
 * Replacing `new URL('./worker.js', import.meta.url)` with a plain string
 * `'powersync-worker.js'` is enough to make Vite's worker plugin stop trying
 * to bundle it — string-URL `new Worker('...')` calls are not intercepted.
 * The string is irrelevant at runtime because the path is never taken.
 *
 * This script is idempotent: if the patch is already applied, it no-ops.
 * It must run after `npm install` (or `npm ci`) — see the `postinstall`
 * hook in package.json.
 */

const fs = require('node:fs');
const path = require('node:path');

const CLIENT_JS = path.join(__dirname, '..', 'node_modules', '@powersync', 'web', 'lib', 'worker', 'client.js');
const PUBLIC_WORKER = path.join(__dirname, '..', 'public', 'worker', 'powersync-worker.js');
const DIST_WORKER = path.join(__dirname, '..', 'node_modules', '@powersync', 'web', 'dist', 'worker', 'worker.js');

function fail(msg) {
  console.error(`[patch-powersync-worker] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(CLIENT_JS)) {
  fail(`@powersync/web/lib/worker/client.js not found — run \`npm install\` first.`);
}

// 1) Copy the pre-bundled worker into public/ (idempotent).
if (fs.existsSync(PUBLIC_WORKER)) {
  console.log('[patch-powersync-worker] public/worker/powersync-worker.js already present.');
} else {
  if (!fs.existsSync(DIST_WORKER)) {
    fail(`Pre-bundled worker not found at ${DIST_WORKER}.`);
  }
  fs.mkdirSync(path.dirname(PUBLIC_WORKER), { recursive: true });
  fs.copyFileSync(DIST_WORKER, PUBLIC_WORKER);
  console.log('[patch-powersync-worker] Copied pre-bundled worker into public/worker/.');
}

// 2) Patch client.js: replace the `new URL('./worker.js', import.meta.url)`
// default-worker spawn with a plain string URL so Vite's worker plugin
// doesn't try to re-bundle it.
const original = fs.readFileSync(CLIENT_JS, 'utf8');
const PATCHED_MARKER = "const workerUrl = 'powersync-worker.js';";
if (original.includes(PATCHED_MARKER)) {
  console.log('[patch-powersync-worker] client.js already patched — nothing to do.');
} else {
  const patched = original
    .replace(
      /new SharedWorker\(new URL\('\.\/worker\.js', import\.meta\.url\), \{[\s\S]*?\}\)\s*:\s*new Worker\(new URL\('\.\/worker\.js', import\.meta\.url\), \{[\s\S]*?\}\);/s,
      `new SharedWorker(workerUrl, {\n            /* @vite-ignore */\n            name,\n            type: 'module'\n        })\n        : new Worker(workerUrl, {\n            /* @vite-ignore */\n            name,\n            type: 'module'\n        });`
    )
    .replace(
      'function spawnDefaultPowerSyncWorker(shared, name) {',
      `function spawnDefaultPowerSyncWorker(shared, name) {\n    const workerUrl = 'powersync-worker.js';`
    );
  if (patched === original) {
    fail('Patch pattern did not match — @powersync/web layout may have changed; please re-verify the file manually.');
  }
  fs.writeFileSync(CLIENT_JS, patched);
  console.log('[patch-powersync-worker] Patched @powersync/web/lib/worker/client.js.');
}
