#!/usr/bin/env node
/**
 * `npm run dev:mock` — start the frontend-only stack in one command:
 *
 *   1. the local test API            → http://localhost:4000  (dashboard)
 *   2. Vite in `mock` mode           → http://localhost:3000  (the app)
 *
 * Vite loads `.env.mock` (VITE_DATA_MODE=mock) and proxies `/api` +
 * `/mock-dashboard` to the API, so everything is same-origin in the browser
 * (also works behind an HTTPS preview proxy).
 *
 * Extra CLI args are forwarded to Vite, e.g. `npm run dev:mock -- --port 5173`.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const extraArgs = process.argv.slice(2);

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

function run(label, command, args) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[dev:mock] ${label} s'est arrêté (code ${code}).`);
      shutdown(code);
    }
  });
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
  }
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('');
console.log('  VersyFlow — démarrage en mode MOCK');
console.log('  ─────────────────────────────────────────');
console.log('   App        : http://localhost:3000');
console.log('   API tests  : http://localhost:4000');
console.log('   Panneau dev: http://localhost:3000/dev');
console.log('');

const apiScript = path.join(ROOT, 'server', 'mock-api.mjs');
const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

run('api', process.execPath, [apiScript]);
run('vite', process.execPath, [viteBin, '--mode', 'mock', ...extraArgs]);
