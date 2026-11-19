#!/usr/bin/env node
/**
 * scripts/bible/repair-lsg-text.mjs — corrige le TEXTE de `data/bible/lsg.json`.
 *
 * Trois défauts constatés à l'audit (Chantier 2), tous d'origine :
 *   1. Apostrophe typographique suivie d'une espace dans 43 253 occurrences
 *      (`l’ Éternel`, `d’ avec`). En français, l'élision ne prend pas d'espace :
 *      c'est un artefact d'import USFM. On retire l'espace.
 *   2. Marqueurs USFM résiduels dans le texte affiché : `\b` (144), `\qs` /
 *      `\qs*` (74 paires), `\it` / `\it*` (3 paires), `\pi` (2). Ce sont des
 *      indications de mise en page, pas du texte : le lecteur ne doit jamais
 *      les voir. `\qs … \qs*` (Selah / « Pause ») encadre du texte réel : on
 *      garde le contenu et on retire les marqueurs.
 *   3. Guillemets droits/typographiques anglais (`“ … ”`) dans les titres de
 *      psaumes : la typographie française utilise les guillemets « … ».
 *
 * Idempotent : relancer le script ne change plus rien (`--check` le vérifie).
 * Le catalogue (`dataset-catalog.json`) est régénéré ensuite par
 * `scripts/bible/generate-dataset-catalog.ts` car le checksum change.
 *
 * Usage :
 *   node scripts/bible/repair-lsg-text.mjs            # répare + réécrit
 *   node scripts/bible/repair-lsg-text.mjs --check    # échoue si à réparer
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TARGET = resolve(root, 'data/bible/lsg.json');
const CHECK = process.argv.includes('--check');

/** Texte d'un verset → texte réparé (pur, sans I/O). */
export function repairVerseText(raw) {
  let text = raw;
  // Marqueurs USFM : d'abord les blocs qui gardent leur contenu.
  text = text.replace(/\\qs\*?/g, ' ');
  text = text.replace(/\\it\*?/g, '');
  text = text.replace(/\\pi\d*/g, ' ');
  text = text.replace(/\\b\b/g, ' ');
  // Apostrophe (élision) suivie d'une espace.
  text = text.replace(/\u2019\s+/g, '\u2019');
  // Guillemets anglais → français (paire, puis orphelins).
  text = text.replace(/\u201c\s*([^\u201d]{1,60}?)\s*\u201d/g, '\u00ab\u00a0$1\u00a0\u00bb');
  text = text.replace(/[\u201c\u201d]/g, '«');
  // Espaces multiples / bords.
  return text.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

function main() {
  const dataset = JSON.parse(readFileSync(TARGET, 'utf8'));
  let changed = 0;
  const before = [];
  for (const book of dataset.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const next = repairVerseText(verse.text);
        if (next !== verse.text) {
          if (before.length < 5) before.push({ was: verse.text, now: next });
          verse.text = next;
          changed += 1;
        }
      }
    }
  }

  if (CHECK) {
    if (changed > 0) {
      console.error(`[repair-lsg-text] ${changed} versets encore à réparer — relancer sans --check.`);
      process.exit(1);
    }
    console.log('[repair-lsg-text] texte conforme.');
    return;
  }

  console.log(`[repair-lsg-text] ${changed} versets réparés.`);
  for (const sample of before) {
    console.log(`  avant : ${sample.was.slice(0, 90)}`);
    console.log(`  après : ${sample.now.slice(0, 90)}`);
  }
  writeFileSync(TARGET, `${JSON.stringify(dataset, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
