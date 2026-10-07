#!/usr/bin/env node
/**
 * scripts/copy-bible-bundled.mjs — copy the bundled `lsg` dataset (the
 * `DEFAULT_TRANSLATION_ID`, `src/domains/bible/registry.ts:145`) into
 * `public/data/bible/` so Vite's dev server and Capacitor's `www/` build
 * serve it at runtime without a network fetch.
 *
 * Why: `BibleJsonFileSource` (src/infrastructure/bible/bible-json-source.ts)
 * does `fetch('data/bible/lsg.json')` at runtime. That file lives at the
 * project root (`data/bible/lsg.json`), but Vite's `publicDir` is `public/`
 * — so in a production web build or a Capacitor WebView (where only `www/`
 * is shipped) the fetch 404s and `loadTranslationBooks('lsg')` returns null,
 * which is the root cause of "la Bible ne s'affiche pas" in prod.
 *
 * The other 56 catalogued datasets are NOT bundled (decision: only `lsg`
 * ships by default); they continue to resolve via the download cache /
 * Supabase Storage `bible-datasets` bucket on first use.
 *
 * Run automatically before `vite build` (see package.json `build`).
 * Manual: `node scripts/copy-bible-bundled.mjs`.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const sourceDir = resolve(root, 'data/bible');
const targetDir = resolve(root, 'public/data/bible');
const bundled = ['lsg.json']; // the default (shipped) dataset

let missing = 0;
for (const file of bundled) {
  const src = resolve(sourceDir, file);
  const dst = resolve(targetDir, file);
  if (!existsSync(src)) {
    console.error(`[copy-bible-bundled] missing ${src} — run \`npm run bible:build\` first`);
    missing++;
    continue;
  }
  mkdirSync(targetDir, { recursive: true });
  cpSync(src, dst, { force: true });
  console.log(`[copy-bible-bundled] ${file} → public/data/bible/ (${statSync(dst).size} bytes)`);
}

if (missing > 0) process.exit(1);
