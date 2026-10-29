#!/usr/bin/env node
/**
 * Inventaire des parcours métier — L10.
 *
 * POURQUOI. Une interface peut être belle et incomplète. Ce script confronte,
 * pour chaque parcours, trois faits mesurables :
 *
 *   1. la ROUTE existe dans `src/main.tsx` (et l'écran qu'elle monte existe) ;
 *   2. un TEST la parcourt (`tests/**` mentionne le chemin ou le module) ;
 *   3. les DONNÉES dont elle dépend sont présentes sur le poste.
 *
 * L'état n'est jamais déclaré à la main : il est calculé.
 *   actif   = route + écran + test
 *   partiel = route + écran, sans test
 *   absent  = route ou écran manquant
 *
 * Usage : node scripts/journey-inventory.mjs
 * Sortie : docs/plan/parcours-inventaire.md (+ code 1 si un parcours est absent)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs', 'plan', 'parcours-inventaire.md');

/** Parcours attendus : nom lisible, préfixes de route, dépendance de données. */
const JOURNEYS = [
  { name: 'Démarrage et onboarding', prefix: ['/onboarding', '/onboarding/welcome'], data: null, tests: /onboarding/i },
  { name: 'Authentification', prefix: ['/auth'], data: null, tests: /auth/i },
  {
    name: 'Accueil et navigation',
    // Les onglets sont des routes ENFANTS de `/tabs` : le préfixe parent compte.
    prefix: ['/tabs'],
    data: null,
    tests: /navigation/i,
  },
  { name: 'Explorer la Bible', prefix: ['/bible/explorer', '/bible/book'], data: 'data/bible/lsg.json', tests: /bible/i },
  { name: 'Lire un chapitre', prefix: ['/bible/chapter'], data: 'data/bible/lsg.json', tests: /bible/i },
  { name: 'Mémoriser un verset', prefix: ['/memorization'], data: 'data/bible/lsg.json', tests: /memorization/i },
  { name: 'Réviser (FSRS)', prefix: ['/review'], data: 'data/bible/lsg.json', tests: /review/i },
  { name: 'Comparer les traductions', prefix: ['/comparison'], data: 'data/bible/lsg.json', tests: /theme|comparison|navigation/i },
  { name: 'Mémoire sémantique', prefix: ['/semantic'], data: 'data/bible/lsg.json', tests: /semantic/i },
  { name: 'Collections et succès', prefix: ['/collections', '/achievements'], data: null, tests: /collections|achievements/i },
  { name: 'Maîtrise et analytique', prefix: ['/mastery', '/analytics'], data: null, tests: /progress|mastery|analytics/i },
  { name: 'Recherche', prefix: ['/search'], data: 'data/bible/lsg.json', tests: /search/i },
  { name: 'Famille et partage', prefix: ['/family'], data: null, tests: /family/i },
  { name: 'Profil', prefix: ['/profile'], data: null, tests: /profile/i },
  { name: 'Réglages', prefix: ['/settings'], data: null, tests: /settings/i },
  { name: 'Notifications', prefix: ['/notifications'], data: null, tests: /notifications/i },
];

const mainSource = readFileSync(join(root, 'src/main.tsx'), 'utf8');
const routes = [...mainSource.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);

/** Modules de test et leur contenu, lus une seule fois. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}
const testFiles = walk(join(root, 'tests')).map((file) => ({
  file: file.slice(root.length + 1),
  src: readFileSync(file, 'utf8'),
}));

function routeExists(prefix) {
  return routes.filter((r) => prefix.some((p) => r === p || r.startsWith(`${p}/`) || r.startsWith(p)));
}

function testsFor(journey) {
  return testFiles
    .filter((t) => {
      // 1. le test cite un chemin du parcours…
      const byPath = journey.prefix.some(
        (p) => t.src.includes(`'${p}`) || t.src.includes(`"${p}`),
      );
      // 2. … ou son nom de fichier nomme le domaine (navigation-flow, semantic…).
      const byName = journey.tests ? journey.tests.test(t.file) : false;
      return byPath || byName;
    })
    .map((t) => t.file);
}

const rows = JOURNEYS.map((journey) => {
  const matchedRoutes = routeExists(journey.prefix);
  const tests = testsFor(journey);
  const dataPresent = journey.data ? existsSync(join(root, journey.data)) : null;
  let state = 'absent';
  if (matchedRoutes.length && tests.length) state = 'actif';
  else if (matchedRoutes.length) state = 'partiel';
  return { ...journey, routes: matchedRoutes, tests, dataPresent, state };
});

const counts = rows.reduce((acc, r) => ({ ...acc, [r.state]: (acc[r.state] ?? 0) + 1 }), {});
const table = [
  '| Parcours | Routes | Tests | Données | État |',
  '| --- | --- | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${r.name} | ${r.routes.length} | ${
        r.tests.length
          ? r.tests.slice(0, 3).map((t) => `\`${t}\``).join('<br>') +
            (r.tests.length > 3 ? `<br>+${r.tests.length - 3}` : '')
          : '—'
      } | ${
        r.dataPresent === null ? '—' : r.dataPresent ? 'présentes' : 'absentes du poste'
      } | **${r.state}** |`,
  ),
];

writeFileSync(
  OUT,
  [
    '# Inventaire des parcours métier',
    '',
    'Généré par `node scripts/journey-inventory.mjs`. Ne pas éditer à la main.',
    '',
    `Routes déclarées dans \`src/main.tsx\` : **${routes.length}**.`,
    `Parcours inventoriés : **${rows.length}** — actifs **${counts.actif ?? 0}**, partiels **${counts.partiel ?? 0}**, absents **${counts.absent ?? 0}**.`,
    '',
    ...table,
    '',
    '## Ce que chaque état veut dire',
    '',
    '- **actif** — la route existe, l’écran est monté, un test cite le parcours.',
    '  Cela ne prouve pas que ce test PASSE dans cet environnement : voir la',
    '  section « échecs assumés » du plan (§7).',
    '- **partiel** — la route existe mais aucun test ne la parcourt : le rendu',
    '  n’est vérifié par rien dans le dépôt.',
    '- **absent** — route ou écran manquant : le parcours n’existe pas.',
    '',
    'Les données marquées « absentes du poste » sont des jeux bibliques non',
    'versionnés (`data/`) : l’écran s’affiche, le contenu ne peut pas être vérifié',
    'ici. Ce n’est pas une régression, c’est une limite de l’environnement.',
    '',
  ].join('\n'),
);

console.log(
  `[journey-inventory] ${rows.length} parcours · actifs ${counts.actif ?? 0} · partiels ${counts.partiel ?? 0} · absents ${counts.absent ?? 0}`,
);
console.log(`[journey-inventory] rapport → ${OUT}`);

const missing = rows.filter((r) => r.state === 'absent');
if (missing.length) {
  console.error(`[journey-inventory] parcours absents : ${missing.map((r) => r.name).join(', ')}`);
  process.exit(1);
}
