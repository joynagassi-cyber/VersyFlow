#!/usr/bin/env node
/**
 * screen-coverage — chaque prototype Stitch a-t-il un écran réel ?
 *
 * Le kit `stitch_monochrome_pink_ui_kit/` compte un dossier par écran
 * (`code.html` + `screen.png`). Ce script vérifie, **pour chaque dossier**,
 * trois choses mesurables, et rien d'autre :
 *
 *   1. une correspondance est déclarée ci-dessous (prototype → destination) ;
 *   2. la destination existe vraiment dans le dépôt (route déclarée dans
 *      `src/main.tsx` et/ou fichier d'écran présent, export par défaut) ;
 *   3. le prototype n'a pas été supprimé du dépôt (référence de design).
 *
 * Il réécrit ensuite `docs/design/stitch-mapping.md` à partir de ces
 * vérifications : la documentation ne peut pas dériver du code, elle en sort.
 *
 * Sortie : 0 si tout est couvert, 1 sinon (avec la liste exacte des écarts).
 * Usage : `npm run screens:coverage`.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KIT = 'stitch_monochrome_pink_ui_kit';
const MAIN = 'src/main.tsx';

/**
 * `route` : chaîne exacte passée à `<Route path="…">` dans `src/main.tsx`.
 * `file`  : écran React correspondant (doit exister et exporter par défaut).
 * `kind: 'component'` : brique montée par la coquille (pas de route propre).
 * `kind: 'tokens'` : le prototype ne définit que des jetons (pas d'écran).
 */
const MAP = {
  // ── c · tableaux de bord modifiés ────────────────────────────────────────
  c1_modifi_accueil: { route: '/tabs/home', file: 'app/(tabs)/index.tsx' },
  c2_modifi_r_sum_de_session: { route: '/review/summary', file: 'app/review/summary.tsx' },
  c3_modifi_progr_s_famille: { route: '/tabs/progress', file: 'app/(tabs)/progress.tsx' },
  c4_modifi_r_glages: { route: '/tabs/settings', file: 'app/(tabs)/settings.tsx' },

  // ── g · réglages ─────────────────────────────────────────────────────────
  g1_r_glages_profil: { route: '/profile', file: 'app/profile/index.tsx' },
  g2_r_glages_apparence: { route: '/settings/appearance', file: 'app/settings/appearance.tsx' },
  g3_r_glages_personnaliser_la_barre_de_navigation: {
    route: '/settings/navigation',
    file: 'app/settings/navigation.tsx',
  },
  g4_navigation_menu_plus_feuille_modale_3_points: {
    kind: 'component',
    file: 'src/components/navigation/HamburgerMenu.tsx',
  },

  // ── m · famille (22 prototypes) ──────────────────────────────────────────
  m1_famille_hub: { route: '/family/home', file: 'app/family/home.tsx' },
  m2_famille_pr_sentation: { route: '/family/presentation', file: 'app/family/presentation.tsx' },
  m3_famille_cr_ation: { route: '/family/create', file: 'app/family/create.tsx' },
  m4_famille_profil_de_membre: { route: '/family/profile', file: 'app/family/profile.tsx' },
  m5_famille_s_lecteur_de_profil: {
    route: '/family/select-profile',
    file: 'app/family/select-profile.tsx',
  },
  m6_famille_membres: { route: '/family/members', file: 'app/family/members.tsx' },
  m7_famille_d_tail_d_un_membre: {
    route: '/family/member/:accountId',
    file: 'app/family/member.tsx',
  },
  m8_famille_classement: { route: '/family/leaderboard', file: 'app/family/leaderboard.tsx' },
  m9_famille_points_et_niveaux: { route: '/family/points', file: 'app/family/points.tsx' },
  m10_famille_d_fis_d_quipe: { route: '/family/challenges', file: 'app/family/challenges/index.tsx' },
  m11_famille_cr_er_un_d_fi: {
    route: '/family/challenges/new',
    file: 'app/family/challenges/new.tsx',
  },
  m12_famille_d_tail_d_un_d_fi: {
    route: '/family/challenges/:challengeId',
    file: 'app/family/challenges/detail.tsx',
  },
  m13_famille_r_sultats_d_un_d_fi: {
    route: '/family/challenges/:challengeId/results',
    file: 'app/family/challenges/results.tsx',
  },
  m14_famille_r_glages_famille: { route: '/family/settings', file: 'app/family/settings.tsx' },
  m15_famille_pr_paration_de_s_ance: {
    route: '/family/session/prepare',
    file: 'app/family/session/prepare.tsx',
  },
  m16_famille_s_ance_en_direct_en_ligne: {
    route: '/family/session/live',
    file: 'app/family/session/live.tsx',
  },
  m16b_famille_s_ance_hors_ligne: {
    route: '/family/session/live',
    file: 'app/family/session/live.tsx',
    note: 'même écran : le mode hors ligne est lu par useSyncStatus',
  },
  m17_famille_r_sum_de_session_de_groupe: {
    route: '/family/session/summary',
    file: 'app/family/session/summary.tsx',
  },
  m18_famille_inviter: { route: '/family/invite', file: 'app/family/invite.tsx' },
  m19_famille_rejoindre: { route: '/family/join', file: 'app/family/join.tsx' },
  m20_famille_fil_d_activit: { route: '/family/activity', file: 'app/family/activity.tsx' },
  m21_famille_synchronisation: { route: '/family/sync', file: 'app/family/sync.tsx' },

  // ── r · mémorisation, révisions, Bible, notes ────────────────────────────
  r1_r_v_lation_progressive: { route: '/memorization/session', file: 'app/memorization/session.tsx' },
  r2_masquage_mots_manquants: {
    route: '/memorization/workspace',
    file: 'app/memorization/workspace.tsx',
  },
  r3_flashcard_recto: { route: '/memorization/flashcard', file: 'app/memorization/flashcard.tsx' },
  r4_flashcard_verso: { route: '/memorization/flashcard', file: 'app/memorization/flashcard.tsx' },
  r5_criture_saisie: { route: '/memory/recall-writing', file: 'app/memory/recall-writing.tsx' },
  r6_criture_diff_note_fsrs: { route: '/memory/recall-writing', file: 'app/memory/recall-writing.tsx' },
  r7_lecteur_s_lection_feuille_d_actions: {
    route: '/bible/chapter/:bookId/:chapterNumber',
    file: 'app/bible/chapter.tsx',
  },
  r8_lecteur_feuille_tendue_m_moriser: {
    route: '/bible/chapter/:bookId/:chapterNumber',
    file: 'app/bible/chapter.tsx',
  },
  r9_accueil: { route: '/tabs/home', file: 'app/(tabs)/index.tsx' },
  r10_r_sum_de_session: { route: '/review/summary', file: 'app/review/summary.tsx' },
  r11_file_de_r_vision: { route: '/review/queue', file: 'app/review/queue.tsx' },
  r12_session_de_r_vision: { route: '/review/session', file: 'app/review/session.tsx' },
  r13_d_tail_du_verset: {
    route: '/bible/chapter/:bookId/:chapterNumber',
    file: 'app/bible/chapter.tsx',
  },
  r14_progr_s_activit: { route: '/tabs/progress', file: 'app/(tabs)/progress.tsx' },
  r15_r_glages: { route: '/tabs/settings', file: 'app/(tabs)/settings.tsx' },
  r16_bible_liste_des_livres: { route: '/bible/explorer', file: 'app/bible/explorer.tsx' },
  r17_bible_chapitres: { route: '/bible/book/:bookId', file: 'app/bible/book.tsx' },
  r18_lecteur_chapitre: {
    route: '/bible/chapter/:bookId/:chapterNumber',
    file: 'app/bible/chapter.tsx',
  },
  r20_enregistr_notes: { route: '/notes', file: 'app/notes.tsx' },
  r21_rappels_et_notifications: { route: '/settings/reminders', file: 'app/settings/reminders.tsx' },
  r21_s_lection_des_versions_de_la_bible: {
    route: '/settings/available-translations',
    file: 'app/settings/available-translations.tsx',
  },

  // ── t · arbres sémantiques ──────────────────────────────────────────────
  t1_arbre_mes_tags: { route: '/semantic/tags', file: 'app/semantic/tags.tsx' },
  t2_arbre_ajouter_des_tags: { route: '/semantic/tags/new', file: 'app/semantic/tags/new.tsx' },
  t3_arbre_arbre_d_un_tag_react_flow: { route: '/semantic/tree', file: 'app/semantic/tree.tsx' },
  t4_arbre_d_tail_d_un_n_ud: { route: '/semantic/node', file: 'app/semantic/node.tsx' },
  t5_arbre_suggestions: { route: '/semantic/suggestions', file: 'app/semantic/suggestions.tsx' },
  t6_arbre_r_viser_une_branche: { route: '/semantic/review', file: 'app/semantic/review.tsx' },
  t7_arbre_rattacher_un_tag: { route: '/semantic/attach', file: 'app/semantic/attach.tsx' },
  t8_arbre_donn_es_s_mantiques: { route: '/semantic/data', file: 'app/semantic/data.tsx' },

  // ── prototype sans écran : il ne définit que le langage visuel ──────────
  sacred_focus_scripture: {
    kind: 'tokens',
    file: 'src/styles/globals.css',
    note: 'le prototype ne contient que le langage visuel (jetons)',
  },
};

const main = readFileSync(MAIN, 'utf8');

/**
 * Chemins réellement déclarés, **imbrication comprise** : react-router monte
 * `<Route path="home">` sous `<Route path="/tabs">`, donc le chemin utile est
 * `/tabs/home`. L'analyse est ligne à ligne (chaque `<Route>` occupe une ligne
 * dans `src/main.tsx`), ce qui évite de se faire piéger par les `>` des
 * éléments JSX passés en `element={…}`.
 */
function declaredRoutePaths(source) {
  const paths = new Set();
  const stack = [];
  for (const line of source.split('\n')) {
    if (!line.includes('<Route')) {
      if (line.includes('</Route>')) stack.pop();
      continue;
    }
    const own = /\bpath="([^"]*)"/.exec(line)?.[1] ?? null;
    const selfClosing = /\/\s*>\s*$/.test(line.trim());
    if (own !== null && own !== '*') {
      const resolved = [...stack, own]
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/');
      paths.add(resolved.startsWith('/') ? resolved : `/${resolved}`);
    }
    if (!selfClosing) stack.push(own ?? '');
  }
  return paths;
}

const declaredRoutes = declaredRoutePaths(main);

const kitFolders = readdirSync(KIT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const rows = [];
const problems = [];

for (const folder of kitFolders) {
  const entry = MAP[folder];
  const html = existsSync(join(KIT, folder, 'code.html'));
  const png = existsSync(join(KIT, folder, 'screen.png'));

  if (!entry) {
    problems.push(`${folder} — aucune correspondance déclarée`);
    rows.push({ folder, target: '—', status: 'manquant' });
    continue;
  }

  const fileOk = existsSync(entry.file);
  const isDefaultExport =
    fileOk &&
    entry.kind !== 'tokens' &&
    /export default/.test(readFileSync(entry.file, 'utf8'));
  const routeOk =
    entry.kind === 'tokens' ? true : entry.kind === 'component' ? true : declaredRoutes.has(entry.route);

  const ok = fileOk && routeOk && (entry.kind === 'tokens' || isDefaultExport);
  const target =
    entry.kind === 'tokens'
      ? `jetons · \`${entry.file}\``
      : entry.kind === 'component'
        ? `brique · \`${entry.file}\``
        : `\`${entry.route}\` · \`${entry.file}\``;

  if (!ok) {
    const reasons = [
      !fileOk && 'fichier absent',
      !routeOk && 'route non déclarée dans src/main.tsx',
      fileOk && entry.kind !== 'tokens' && !isDefaultExport && 'pas d’export par défaut',
    ].filter(Boolean);
    problems.push(`${folder} — ${reasons.join(', ')}`);
  }

  rows.push({
    folder,
    target,
    status: ok ? 'couvert' : 'écart',
    note: entry.note ?? '',
    html,
    png,
  });
}

// ── Documentation générée ───────────────────────────────────────────────────
const covered = rows.filter((r) => r.status === 'couvert').length;
const table = rows
  .map(
    (r) =>
      `| \`${r.folder}\` | ${r.target} | ${r.status}${r.note ? ` · ${r.note}` : ''} |`,
  )
  .join('\n');

const doc = `# Correspondance prototypes Stitch → écrans réels

Généré par \`node scripts/screen-coverage.mjs\` — **ne pas éditer à la main**.
Ce fichier est réécrit à chaque exécution de \`npm run screens:coverage\`, à
partir de la vérification réelle du dépôt : la documentation ne peut donc pas
diverger du code.

- Prototypes dans \`${KIT}/\` : **${kitFolders.length}**
- Couverts (route déclarée **et** écran existant avec export par défaut) : **${covered}**
- Écarts : **${problems.length}**

Les prototypes restent dans le dépôt : ce sont les références de design. Le
HTML Stitch (Tailwind CDN, \`material-symbols\`) n'est **pas** copié : chaque
écran est traduit en composants du design system (jetons de \`src/styles/globals.css\`,
\`DuoIcon\` pour les icônes, \`FullScreenPage\` pour la coquille).

| Prototype | Destination réelle | État |
|---|---|---|
${table}

## Vérifier soi-même

\`\`\`bash
npm run screens:coverage          # ce rapport, code de sortie 0 si 100 % couvert
grep -c '<Route path=' src/main.tsx
\`\`\`
`;

writeFileSync('docs/design/stitch-mapping.md', doc, 'utf8');

console.log(`[screens:coverage] prototypes: ${kitFolders.length}`);
console.log(`[screens:coverage] couverts: ${covered}/${kitFolders.length}`);
console.log(`[screens:coverage] routes déclarées dans ${MAIN}: ${declaredRoutes.size}`);
if (problems.length) {
  console.log(`[screens:coverage] ÉCARTS (${problems.length}) :`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('[screens:coverage] rapport → docs/design/stitch-mapping.md');
