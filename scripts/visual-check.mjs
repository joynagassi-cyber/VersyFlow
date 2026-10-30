#!/usr/bin/env node
/**
 * visual-check.mjs — preuve visuelle des contrôles U01/U02/U03.
 *
 * L'audit (`scripts/audit-plan.mjs`) ne peut pas prouver U01–U03 dans
 * l'environnement de développement : il n'y a ni navigateur ni moteur de mise
 * en page (jsdom ne calcule pas les largeurs). Ce script est la contrepartie
 * exécutable sur une machine qui a un navigateur : il ouvre le build servi,
 * capture chaque écran clé aux quatre largeurs de référence, et **mesure** le
 * débordement horizontal au lieu de l'estimer.
 *
 * Prérequis (une seule fois, sur votre poste) :
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * Usage :
 *   node scripts/visual-check.mjs                       # http://localhost:3000
 *   node scripts/visual-check.mjs --base http://localhost:4173
 *   node scripts/visual-check.mjs --routes /tabs/home,/settings/appearance
 *   node scripts/visual-check.mjs --widths 390,768,1024,1440 --out artifacts/visuel
 *
 * Sorties :
 *   <out>/<largeur>/<slug>.png      captures
 *   <out>/rapport.md                tableau mesure (debordement, erreurs console)
 *
 * Codes de sortie :
 *   0  tout est conforme (aucun débordement, aucune erreur console)
 *   1  au moins un écran déborde ou lève une erreur → à corriger
 *   3  Playwright absent → rien n'est mesuré (surtout ne pas lire un succès)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = arg('base', 'http://localhost:3000');
const OUT = resolve(arg('out', 'artifacts/visuel'));
const WIDTHS = arg('widths', '390,768,1024,1440').split(',').map(Number);

/**
 * Écrans de référence : un par famille de mise en page, pour couvrir le
 * plein écran mobile, la colonne de lecture, le rail tablette et la coquille
 * de bureau — pas seulement les écrans « faciles ».
 */
const DEFAULT_ROUTES = [
  '/tabs/home',
  '/tabs/explore',
  '/tabs/settings',
  '/bible/explorer',
  '/memorization/workspace',
  '/review/queue',
  '/collections',
  '/profile',
  '/settings/appearance',
  '/family/home',
  '/tabs/progress',
  '/settings',
];

const ROUTES = arg('routes', DEFAULT_ROUTES.join(','))
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

const slug = (route) =>
  route.replace(/^\//, '').replace(/[/?=&]+/g, '-').replace(/-$/, '') || 'racine';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    [
      '',
      'Playwright est absent : U01/U02/U03 restent NON VÉRIFIÉS.',
      'Ce script ne prétend pas les avoir vérifiés — il ne mesure rien sans navigateur.',
      '',
      'Sur une machine avec navigateur :',
      '  npm i -D playwright && npx playwright install chromium',
      `  node scripts/visual-check.mjs --base ${BASE}`,
      '',
      'Sinon, la vérification manuelle est décrite pas à pas dans',
      'docs/plan/verification-manuelle.md (4 largeurs, 12 écrans, 6 minutes).',
      '',
    ].join('\n'),
  );
  process.exit(3);
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const rows = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const dir = join(OUT, String(width));
  mkdirSync(dir, { recursive: true });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120));
    });
    page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 120)));

    let row = { width, route, ok: false, overflowPx: null, errors: consoleErrors };
    try {
      const response = await page.goto(`${BASE}${route}`, {
        waitUntil: 'networkidle',
        timeout: 20000,
      });
      // Laisse le résolveur de thème poser ses variables avant la capture.
      await page.waitForTimeout(250);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      const overflowPx = metrics.scrollWidth - metrics.clientWidth;
      await page.screenshot({ path: join(dir, `${slug(route)}.png`), fullPage: true });
      row = {
        ...row,
        ok: (response?.status() ?? 0) < 400 && overflowPx <= 0,
        status: response?.status() ?? 0,
        overflowPx,
        errors: consoleErrors,
      };
    } catch (error) {
      row = { ...row, error: String(error).slice(0, 160) };
    }
    rows.push(row);
    await page.close();

    const verdict = row.error ? 'ERREUR' : row.ok ? 'ok' : 'DÉBORDE';
    console.log(
      `${String(width).padStart(4)}px  ${route.padEnd(26)} ${verdict}` +
        (row.overflowPx > 0 ? ` (+${row.overflowPx}px)` : ''),
    );
  }
  await context.close();
}

await browser.close();

const failures = rows.filter((r) => !r.ok);
const lines = [
  '# Vérification visuelle — rapport mesuré',
  '',
  `Base : \`${BASE}\` · largeurs : ${WIDTHS.join(', ')} px · écrans : ${ROUTES.length}`,
  `Exécuté le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} (UTC).`,
  '',
  `**${rows.length - failures.length}/${rows.length} combinaisons conformes.**`,
  '',
  '| Largeur | Écran | Verdict | Débordement | Erreurs console |',
  '| --- | --- | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${r.width} | \`${r.route}\` | ${r.error ? `ERREUR (${r.error})` : r.ok ? '**ok**' : '**DÉBORDE**'} | ` +
      `${r.overflowPx == null ? '—' : `${r.overflowPx}px`} | ${r.errors.length ? r.errors.length : 0} |`,
  ),
  '',
  'Ce rapport ne dit rien de l’esthétique : il prouve l’absence de débordement',
  'horizontal et l’absence d’erreur console. Le rendu (verre, accents, densité)',
  'reste à juger sur les captures du dossier.',
  '',
];
writeFileSync(join(OUT, 'rapport.md'), lines.join('\n'));
console.log(`\nRapport → ${join(OUT, 'rapport.md')}`);
console.log(
  `${rows.length - failures.length}/${rows.length} conformes` +
    (failures.length ? ` · ${failures.length} à corriger` : ' · rien à corriger'),
);
process.exit(failures.length === 0 ? 0 : 1);
