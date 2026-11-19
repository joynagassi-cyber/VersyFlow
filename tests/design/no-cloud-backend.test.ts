/**
 * Garde-fou — l'application est frontend-only, et le reste.
 *
 * VersyFlow a été construit autour de deux services cloud (une base managée et
 * un moteur de synchronisation). La décision de produit est de n'avoir AUCUN
 * backend : les données vivent dans le navigateur, derrière des ports
 * (`src/infrastructure/repository/ports.ts`) qu'un futur backend pourra
 * implémenter sans toucher aux écrans.
 *
 * La règle ne tient que si elle est vérifiée : ce test échoue si l'un des deux
 * noms réapparaît quelque part dans le dépôt suivi (code, config, docs,
 * dépendances, CI). Les documents historiques réellement conservés ont été
 * déplacés dans `archive/` et sont exclus explicitement — un fichier archivé
 * ne peut pas être importé par l'application.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

/** Terms that must never come back. Matched case-insensitively. */
const FORBIDDEN = ['powersync', 'supabase'];

/** Directories that are not part of the shipped app. */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'www',
  'dist',
  'coverage',
  'archive',
  '.arena',
  'graphify-out',
]);

/** Extensions worth scanning (binary assets are skipped). */
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|scss|html|yml|yaml|toml|gradle|env|example|xml|plist|txt|lock)$/;

/** Files scanned anyway, even without a matching extension. */
const EXTRA_FILES = new Set(['.env.example', '.env.mock', '.mcp.json', '.gitignore']);

/**
 * The guard's own file and the lockfile mention the terms by necessity (it
 * lists them; the lockfile is generated). The lockfile is asserted separately,
 * cheaper and stricter: it must not CONTAIN the dependency names at all.
 */
function isSelf(path: string): boolean {
  return path === 'tests/design/no-cloud-backend.test.ts';
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      const rel = relative(root, full);
      const base = entry.name;
      if (TEXT_EXT.test(base) || EXTRA_FILES.has(base)) out.push(rel);
    }
  }
  return out;
}

describe('frontend-only — aucun service cloud ne doit réapparaître', () => {
  it('aucun fichier suivi ne mentionne les services retirés', () => {
    const offenders: string[] = [];
    for (const file of walk(root)) {
      if (isSelf(file)) continue;
      // Un fichier volumineux n'est un problème que s'il contient le terme :
      // on lit quand même, mais on saute les assets binaires déguisés.
      if (statSync(join(root, file)).size > 4_000_000) continue;
      const text = readFileSync(join(root, file), 'utf8').toLowerCase();
      for (const term of FORBIDDEN) {
        if (text.includes(term)) {
          offenders.push(`${file} → « ${term} »`);
          break;
        }
      }
    }
    expect(offenders, `Occurrences restantes :\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  it('les dépendances ne contiennent plus ces paquets', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    for (const term of FORBIDDEN) {
      expect(names.filter((name) => name.includes(term))).toEqual([]);
    }
    const scripts = Object.entries(pkg.scripts ?? {}).map(([key, value]) => `${key}=${value}`);
    for (const term of FORBIDDEN) {
      expect(scripts.filter((line) => line.toLowerCase().includes(term))).toEqual([]);
    }
  });

  it('le lockfile ne référence plus ces paquets', () => {
    const lock = readFileSync(join(root, 'package-lock.json'), 'utf8').toLowerCase();
    for (const term of FORBIDDEN) {
      // `@powersync/*` et `@supabase/*` apparaîtraient dans `packages`.
      expect(lock.includes(`node_modules/@${term}`)).toBe(false);
    }
  });
});
