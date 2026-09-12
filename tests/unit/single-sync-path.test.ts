/**
 * single-sync-path — Invariant: PowerSync is the single sync write path.
 *
 * `CloudMemorizationService` was a legacy double-sync wrapper that coexisted
 * with `PowerSyncSyncService` + the PowerSync repositories. It has zero
 * production callers (audit D: "no production importer"), so after P0A-3 no
 * module anywhere may import it.
 *
 * The test scans `src/` and `scripts/` for any `from '@/sync/CloudMemorizationService'`
 * import and asserts there are zero. `tests/` is excluded: the legacy test
 * file is removed in P0A-3 and no other test may import the wrapper.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage') continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('single-sync-path invariant', () => {
  it(
    'no module anywhere imports CloudMemorizationService',
    () => {
      const offenders: string[] = [];
      for (const dir of ['src', 'scripts']) {
        const files = walk(join(ROOT, dir));
        for (const f of files) {
          const rel = f.replace(/\\/g, '/');
          // The legacy wrapper file itself is the only allowed self-reference;
          // it was deleted in P0A-3, so even its own path should not match.
          if (/from\s+['"]@\/sync\/CloudMemorizationService['"]/.test(readFileSync(f, 'utf8'))) {
            offenders.push(rel);
          }
        }
      }
      expect(offenders).toEqual([]);
    },
    60_000,
  );
});
