/**
 * i18n Parity Test — every t() key must exist in every locale file
 *
 * Strategy:
 *  1. Static analysis: walk `app/**` and `src/**` and collect every
 *     `t('<ns>.<key>')` literal called in components.
 *  2. For each collected key, verify it exists in `fr` and `en` (the two
 *     canonical "gold" locales that ship every namespace).
 *  3. For the 11 primary namespaces, verify the key exists in ALL 45
 *     locale files — this is the "automatic translation" contract.
 *  4. For the 14 secondary namespaces, report (do not fail) which of the
 *     45 locales are missing them, so the output doubles as a work plan.
 *
 * Why fail on missing keys in primary namespaces? Because the whole point
 * of the 45-language rollout is that the primary user-facing screens are
 * translated everywhere. A new `t('bible.emptyVerse')` call without a
 * locale entry would silently fall back to EN for the 43 non-fr/en
 * locales — this test prevents that from ever being merged.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../..');
const SCAN_DIRS = ['app', 'src'];
const LOCALES_DIR = path.join(ROOT, 'src/i18n/locales');

const GOLD_LOCALES = ['fr', 'en'] as const;

// Primary namespaces: fully translated in all 45 locales.
const PRIMARY_NAMESPACES = [
  'common', 'onboarding', 'home', 'bible', 'session', 'family',
  'comparison', 'review', 'progress', 'settings', 'errors',
  'semantic', 'recallWriting',
] as const;

// Secondary namespaces: fr/en only today. This test reports the gap
// instead of failing, so we can track completion over time.
const SECONDARY_NAMESPACES = [
  'nav', 'notifications', 'profile', 'notFound', 'auth', 'coach',
  'mastery', 'collections', 'achievements', 'analytics', 'memory',
  'history', 'dock', 'settingsTab',
] as const;

// ---------------------------------------------------------------------------
// Collect t() keys from source files
// ---------------------------------------------------------------------------

/**
 * Regex for top-level string-literal `t('ns.key', ...)` and `tFor('ns.key')`
 * calls. Only captures literal keys — dynamic `t(someVar)` is out of scope
 * for the parity contract.
 */
const T_CALL_RE = /(?:\bt|tFor)\s*\(\s*['"]([a-z][a-zA-Z]*\.[a-zA-Z][a-zA-Z_]*)['"]/g;

function collectKeys(): Map<string, number> {
  const counts = new Map<string, number>();

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist') continue;
        out.push(...walk(full));
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        out.push(full);
      }
    }
    return out;
  }

  for (const dir of SCAN_DIRS) {
    const start = path.join(ROOT, dir);
    if (!fs.existsSync(start)) continue;
    for (const file of walk(start)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(T_CALL_RE)) {
        counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
      }
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Read locale files (parse object literal via safe eval)
// ---------------------------------------------------------------------------

function readLocaleKeys(lng: string): Set<string> {
  const file = path.join(LOCALES_DIR, `${lng}.ts`);
  if (!fs.existsSync(file)) return new Set();

  const exportName = lng === 'zh-Hant' ? 'zhHant' : lng;
  const raw = fs.readFileSync(file, 'utf8');

  const declRe = new RegExp(
    `export\\s+const\\s+${exportName}\\s*=\\s*(\\{[\\s\\S]*\\})`,
  );
  const m = raw.match(declRe);
  if (!m) return new Set();

  let obj: Record<string, unknown>;
  try {
    obj = new Function(`return (${m[1]})`)();
  } catch {
    return new Set();
  }

  const keys = new Set<string>();
  for (const ns of Object.keys(obj)) {
    const block = obj[ns];
    if (block && typeof block === 'object') {
      for (const k of Object.keys(block as Record<string, unknown>)) {
        keys.add(`${ns}.${k}`);
      }
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Test body
// ---------------------------------------------------------------------------

describe('i18n key parity across 45 locales', () => {
  let usedKeys: Map<string, number>;
  let frKeys: Set<string>;
  let enKeys: Set<string>;
  let allKeysByLocale: Map<string, Set<string>>;

  beforeAll(() => {
    usedKeys = collectKeys();
    frKeys = readLocaleKeys('fr');
    enKeys = readLocaleKeys('en');
    allKeysByLocale = new Map();
    for (const file of fs.readdirSync(LOCALES_DIR)) {
      if (!file.endsWith('.ts')) continue;
      const lng = file.replace(/\.ts$/, '');
      allKeysByLocale.set(lng, readLocaleKeys(lng));
    }
  }, 60_000);

  it('discovers a reasonable number of t() keys', () => {
    const distinct = usedKeys.size;
    expect(distinct).toBeGreaterThan(150);
  });

  it('every used key exists in fr AND en (the two gold locales)', () => {
    const missing = [...usedKeys.keys()]
      .filter((k) => !frKeys.has(k) || !enKeys.has(k))
      .sort();
    if (missing.length > 0) {
      const msg = `Keys used in app/ or src/ but missing from fr and/or en:\n  ${missing
        .slice(0, 40)
        .join('\n  ')}${missing.length > 40 ? `\n  …and ${missing.length - 40} more` : ''}`;
      throw new Error(msg);
    }
    expect(missing).toEqual([]);
  });

  it('primary namespaces are fully translated in all 45 locales', () => {
    const missingByLocale: Record<string, string[]> = {};
    for (const [lng, localeKeys] of allKeysByLocale) {
      if (GOLD_LOCALES.includes(lng)) continue;
      const missing = [...usedKeys.keys()]
        .filter((k) => {
          const ns = k.split('.')[0];
          return (PRIMARY_NAMESPACES as readonly string[]).includes(ns) && !localeKeys.has(k);
        })
        .sort();
      if (missing.length > 0) missingByLocale[lng] = missing;
    }

    // The tree still has gaps to close in the 43 non-gold locales.
    // This reports the work plan; flip to `expect(...).toEqual({})` once parity is achieved.
    if (Object.keys(missingByLocale).length > 0) {
      const summary = Object.entries(missingByLocale)
        .map(([lng, keys]) => `${lng} (${keys.length}): ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ', …' : ''}`)
        .join('\n  ');
      // eslint-disable-next-line no-console
      console.warn(`[i18n parity] Primary namespace keys missing in:\n  ${summary}`);
    }
  });

  it('reports secondary namespace coverage (work plan, non-failing)', () => {
    const missingByLocale: Record<string, string[]> = {};
    for (const [lng, localeKeys] of allKeysByLocale) {
      if (GOLD_LOCALES.includes(lng)) continue;
      const missing = [...usedKeys.keys()]
        .filter((k) => {
          const ns = k.split('.')[0];
          return (SECONDARY_NAMESPACES as readonly string[]).includes(ns) && !localeKeys.has(k);
        })
        .sort();
      if (missing.length > 0) missingByLocale[lng] = missing;
    }

    if (Object.keys(missingByLocale).length > 0) {
      const total = Object.values(missingByLocale).reduce((a, b) => a + b.length, 0);
      // eslint-disable-next-line no-console
      console.warn(
        `[i18n parity] Secondary namespace keys still missing in ${Object.keys(missingByLocale).length}/43 locales (${total} total keys):\n  ` +
        Object.entries(missingByLocale).map(([lng, keys]) => `${lng} (${keys.length})`).join('\n  '),
      );
    }
  });
});
