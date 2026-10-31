/**
 * Contrat de résolution des clés i18n — le complément de `parity.test.ts`.
 *
 * `parity.test.ts` collecte les clés par expression régulière et ne retient
 * que les formes à UN point (`ns.key`). Les clés à deux points
 * (`settings.backupScreen.exported`, `weeklyReminders.title`…) échappaient
 * donc au contrat : une clé inexistante y restait invisible, et l'écran
 * affichait sa valeur de repli française dans les 44 autres langues.
 *
 * Ici, les locales sont évaluées puis aplaties comme le fait
 * `i18next-init.ts` (`keySeparator: false`), et TOUTE clé littérale — quel que
 * soit son nombre de segments — doit exister en `fr` et en `en`.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fr } from '@/i18n/locales/fr';
import { en } from '@/i18n/locales/en';

const ROOT = path.resolve(__dirname, '../../..');

/** Aplatit les objets imbriqués en clés pointées, comme le fait l'init. */
function flatten(value: unknown, prefix = '', out = new Set<string>()): Set<string> {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object') flatten(child, next, out);
      else out.add(next);
    }
  }
  return out;
}

const FR = flatten(fr);
const EN = flatten(en);

/** Toutes les clés littérales passées à `t()` / `tFor()`, tous segments. */
function usedKeys(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir))) {
      const rel = `${dir}/${entry}`;
      if (fs.statSync(path.join(ROOT, rel)).isDirectory()) {
        if (!['node_modules', 'dist', '__dev'].includes(entry)) walk(rel);
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        for (const m of src.matchAll(/(?:\bt|tFor)\s*\(\s*['"]([a-zA-Z][\w.]*)['"]/g)) {
          if (m[1].includes('.')) found.push({ key: m[1], file: rel });
        }
      }
    }
  };
  for (const dir of ['app', 'src']) if (fs.existsSync(path.join(ROOT, dir))) walk(dir);
  return found;
}

describe('clés i18n — toute clé littérale existe', () => {
  const used = usedKeys();

  it('collecte un volume crédible de clés', () => {
    expect(new Set(used.map((u) => u.key)).size).toBeGreaterThan(300);
  });

  it('chaque clé existe en `fr`', () => {
    const missing = [...new Set(used.filter((u) => !FR.has(u.key)).map((u) => `${u.key} (${u.file})`))];
    expect(missing.sort()).toEqual([]);
  });

  it('chaque clé existe en `en`', () => {
    const missing = [...new Set(used.filter((u) => !EN.has(u.key)).map((u) => `${u.key} (${u.file})`))];
    expect(missing.sort()).toEqual([]);
  });

  it('aucune clé orpheline dans les deux locales dorées', () => {
    // Une clé déclarée mais jamais utilisée n'est pas une erreur : certaines
    // sont résolues dynamiquement (`t(item.labelKey)`). On surveille seulement
    // l'inflation : le stock ne doit pas dépasser de plus de 25 % l'usage.
    const declared = FR.size;
    const usedCount = new Set(used.map((u) => u.key)).size;
    expect(declared).toBeLessThan(usedCount * 1.25);
  });
});
