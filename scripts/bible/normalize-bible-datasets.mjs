#!/usr/bin/env node
/**
 * normalize-bible-datasets.mjs — corrige le TEXTE des jeux bibliques déjà construits.
 *
 * Contexte (constat du 2026-10-30) : les versets français affichaient des
 * lettres orphelines (« l », « j », « qu ») parce que les corpus USFM portent
 * une espace après l'apostrophe d'élision (`l' abîme`, `j' ai`, `qu' il`).
 * Sur `lsg.json` : 21 128 versets sur 31 170 étaient touchés (41 594 élisions).
 *
 * Le correctif de fond est dans `src/infrastructure/bible/adapters/usfm-adapter.ts`
 * (les jeux reconstruits naissent propres). Ce script répare les fichiers DÉJÀ
 * construits, sans avoir à re-télécharger les sources USFM.
 *
 * Règles appliquées (idempotentes) :
 *   1. normalisation Unicode NFC ;
 *   2. soudure des élisions : `l’ abîme` → `l’abîme` (tokens l, d, j, qu, s,
 *      n, c, m, t, jusqu, lorsqu, puisqu, quoiqu — jamais une apostrophe de
 *      citation) ;
 *   3. suppression des espaces avant ponctuation ;
 *   4. espaces multiples réduits, bords nettoyés.
 *
 * Met aussi à jour `data/bible/dataset-catalog.json` (checksum + taille) pour
 * que le cache navigateur (clé = checksum) recharge la version corrigée.
 *
 * Usage :
 *   node scripts/bible/normalize-bible-datasets.mjs            # répare
 *   node scripts/bible/normalize-bible-datasets.mjs --check    # ne modifie rien, sort 1 si à réparer
 *   node scripts/bible/normalize-bible-datasets.mjs --copy-public  # + copie vers public/data/bible
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DIR = join(ROOT, 'data', 'bible');
const PUBLIC_DIR = join(ROOT, 'public', 'data', 'bible');
const CATALOG = join(DIR, 'dataset-catalog.json');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const COPY_PUBLIC = args.includes('--copy-public');

const ELISION_TOKENS = 'jusqu|lorsqu|puisqu|quoiqu|qu|l|d|j|s|n|c|m|t';
const ELISION_RE = new RegExp(`(^|[\\s(«“"'])((?:${ELISION_TOKENS})’)[ ]+(?=[\\p{L}])`, 'giu');

export function normalizeVerse(text) {
  let out = text.normalize('NFC');
  out = out.replace(ELISION_RE, '$1$2');
  out = out.replace(/\s+([,;:.!?»])/g, '$1');
  out = out.replace(/[ \t]+/g, ' ').trim();
  return out;
}

function sha256(buf) {
  return 'sha256:' + createHash('sha256').update(buf).digest('hex');
}

/** Applique la normalisation à un document `{ id, books: [...] }`. */
function normalizeDocument(doc) {
  let changed = 0;
  let verses = 0;
  for (const book of doc.books ?? []) {
    for (const chapter of book.chapters ?? []) {
      for (const verse of chapter.verses ?? []) {
        if (typeof verse.text !== 'string') continue;
        verses += 1;
        const next = normalizeVerse(verse.text);
        if (next !== verse.text) {
          verse.text = next;
          changed += 1;
        }
      }
    }
  }
  return { changed, verses };
}

const files = existsSync(DIR)
  ? readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'dataset-catalog.json')
  : [];

if (!files.length) {
  console.log('Aucun jeu de données dans data/bible — rien à faire.');
  process.exit(0);
}

const catalog = existsSync(CATALOG) ? JSON.parse(readFileSync(CATALOG, 'utf8')) : [];
let catalogChanged = false;
let pending = 0;

for (const file of files) {
  const path = join(DIR, file);
  const id = basename(file, '.json');
  const before = readFileSync(path);
  const doc = JSON.parse(before.toString('utf8'));
  const { changed, verses } = normalizeDocument(doc);

  if (!changed) {
    console.log(`= ${file} : ${verses} versets, déjà propre`);
    if (COPY_PUBLIC && !CHECK) syncPublic(path, file);
    continue;
  }

  pending += 1;
  // Indentation 2 espaces : même forme que les fichiers du dépôt, pour que
  // le diff git ne touche que les versets réellement corrigés.
  const out = Buffer.from(JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(
    `${CHECK ? '!' : '+'} ${file} : ${changed}/${verses} versets corrigés` +
      ` (${before.length} → ${out.length} octets)`,
  );

  if (CHECK) continue;

  writeFileSync(path, out);
  const entry = catalog.find((e) => e.id === id);
  if (entry) {
    entry.checksum = sha256(out);
    entry.sizeBytes = out.length;
    entry.builtAt = new Date().toISOString();
    catalogChanged = true;
  }
  if (COPY_PUBLIC) syncPublic(path, file);
}

function syncPublic(path, file) {
  const dest = join(PUBLIC_DIR, file);
  copyFileSync(path, dest);
  console.log(`  → public/data/bible/${file} (${statSync(dest).size} octets)`);
}

if (catalogChanged && !CHECK) {
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`dataset-catalog.json : ${catalog.length} entrées, checksums mis à jour`);
}

if (CHECK && pending) {
  console.error(`${pending} jeu(x) de données à corriger — relancer sans --check.`);
  process.exit(1);
}
console.log(CHECK ? 'OK — tous les jeux sont propres.' : 'Terminé.');
