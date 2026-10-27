/**
 * Cross-platform runner for `npm run cypress:run` on VersyFlow.
 *
 * Mirrors the Lumina runner pattern (no bash-only `VAR=cmd` prefixes that
 * Windows rejects). Forwards every CYPRESS_* env var to the Cypress
 * process. Override any default with a real env var:
 *
 *   Windows PowerShell:
 *     $env:CYPRESS_BASE_URL='https://versyflow.onrender.com'
 *     node cypress/run.mjs --spec cypress/e2e/smoke.cy.ts
 *
 *   Linux/macOS:
 *     CYPRESS_BASE_URL=https://versyflow.onrender.com node cypress/run.mjs
 *
 * The runner spawns `cypress` (the npm dev-dependency's bin) via
 * `npx`-style resolution: it locates the real binary under
 * `node_modules/cypress/node_modules/.bin` or `.bin/cypress` at the
 * project root, avoiding the ESM `exports` map that blocks direct
 * `require('cypress/bin/cypress')`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const DEFAULTS = {
  CYPRESS_BASE_URL: 'https://versyflow.onrender.com',
};

// Forward CYPRESS_* from the environment (or defaults) to the Cypress
// process. Cypress reads them at startup via `env` + its config.
const env = { ...process.env };
for (const [k, v] of Object.entries(DEFAULTS)) {
  if (!env[k]) env[k] = v;
}

// Locate the cypress bin script. On Windows the .bin/cypress entry is a
// POSIX shell wrapper and cannot be executed via node directly — we need
// the real Node entry at node_modules/cypress/bin/cypress.
const candidateBins = [
  path.join(projectRoot, 'node_modules', 'cypress', 'bin', 'cypress'),
  path.join(projectRoot, 'node_modules', '.bin', 'cypress'),
];
const cypressBin = candidateBins.find((p) => existsSync(p));
if (!cypressBin) {
  console.error(
    '[cypress:run] could not locate the cypress binary. Tried:\n  ' +
      candidateBins.join('\n  '),
  );
  process.exit(1);
}

const args = ['run', ...process.argv.slice(2)];

console.log(
  `[cypress:run] ${process.execPath} ${cypressBin} ${args.join(' ')} (baseUrl=${env.CYPRESS_BASE_URL})`,
);
const res = spawnSync(process.execPath, [cypressBin, ...args], {
  env,
  cwd: projectRoot,
  stdio: 'inherit',
});

if (res.error) {
  console.error('[cypress:run] spawn failed:', res.error.message);
  process.exit(1);
}
process.exit(res.status ?? 0);
