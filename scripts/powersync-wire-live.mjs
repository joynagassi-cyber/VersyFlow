/**
 * Cross-platform launcher for `powersync:wire:live` — sets
 * `TSX_TSCONFIG_PATH` so tsx resolves the `@/*` aliases, then runs
 * `tsx scripts/powersync-wire-check.ts --live` as a child process.
 *
 * (A plain `VAR=value tsx …` shell prefix would only work on bash —
 * this project targets Windows cmd/PowerShell too.)
 *
 * `npx` is resolved via `require.resolve('tsx/cli')` → the tsx CLI entry
 * `dist/cli.mjs` inside `node_modules` (project-local or global). Running
 * it with the current Node binary keeps the launcher working no matter
 * how tsx was installed (npm global, local, or npx-cached).
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let tsxCli;
try {
  tsxCli = require.resolve('tsx/cli');
} catch {
  console.error('[powersync:wire:live] cannot resolve tsx — run `npm install` first.');
  process.exit(1);
}

process.env.TSX_TSCONFIG_PATH = 'tsconfig.scripts.json';
try {
  execFileSync(
    process.execPath,
    [tsxCli, 'scripts/powersync-wire-check.ts', '--live'],
    { stdio: 'inherit', env: process.env },
  );
} catch (e) {
  // execFileSync throws on non-zero child exit — re-exit with the same code.
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
