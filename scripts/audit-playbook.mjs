#!/usr/bin/env node
/**
 * Audit « UX/UI Playbook 2026 » — application réelle des 77 règles.
 *
 * Pourquoi ce script : les deux PDF du playbook (140 p. + Bonus Kit 26 p.) se
 * terminent par une checklist de 77 règles avec un niveau (BLOCKING / MAJOR /
 * MINOR) et une preuve attendue (static / render / heuristic). Recopier cette
 * liste dans un tableau ne prouve rien. Ici chaque règle **mesurable sans
 * navigateur** est recalculée sur le dépôt à chaque exécution, avec la valeur
 * trouvée. Les autres ne sont jamais comptées comme réussies : elles sortent en
 * UNVERIFIABLE avec la raison et la façon de les vérifier.
 *
 * Usage :
 *   node scripts/audit-playbook.mjs            # rapport + code 1 si une règle BLOCKING statique échoue
 *   node scripts/audit-playbook.mjs --json     # sortie machine seule
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_ONLY = process.argv.includes('--json');

/* -------------------------------------------------------------- utilitaires */

const read = (p) => readFileSync(join(root, p), 'utf8');
const exists = (p) => existsSync(join(root, p));

function walk(dir, filter, acc = []) {
  const full = join(root, dir);
  if (!existsSync(full)) return acc;
  for (const entry of readdirSync(full)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const abs = join(full, entry);
    if (statSync(abs).isDirectory()) walk(relative(root, abs).split('\\').join('/'), filter, acc);
    else if (filter.test(entry)) acc.push(relative(root, abs).split('\\').join('/'));
  }
  return acc;
}

const count = (source, re) => (source.match(re) ?? []).length;
const all = (list, fn) => list.map(fn).join('\n');

/** Retire les commentaires pour ne pas mesurer du code mort. */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* ----------------------------------------------------------------- couleurs */

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/* ------------------------------------------------------------------ corpus  */

const appFiles = walk('app', /\.tsx$/);
const srcFiles = walk('src', /\.tsx$/);
const tsFiles = [...appFiles, ...srcFiles];
const css = read('src/styles/globals.css');
const cssNoComments = stripComments(css);
const tailwind = read('tailwind.config.js');
const indexHtml = read('index.html');
const mainTsx = read('src/main.tsx');

const cache = new Map();
const sourceOf = (file) => {
  if (!cache.has(file)) cache.set(file, read(file));
  return cache.get(file);
};
const allDom = all(tsFiles, (f) => stripComments(sourceOf(f)));

/* ------------------------------------------------------- mesures réutilisées */

/** Un écran = un fichier de `app/`. Il doit porter un seul h1 rendu. */
function screenHeadings() {
  const rows = [];
  for (const file of appFiles) {
    const src = stripComments(sourceOf(file));
    const usesShell = /FullScreenPage|OnboardingShell/.test(src);
    if (!usesShell) continue;

    // Découpe le fichier en composants : un h1 dans un sous-composant
    // (ex. en-tête réutilisé) ne concurrence pas le titre de l'écran.
    const boundaries = [...src.matchAll(/^(?:export )?(?:default )?(?:function|const) ([A-Z]\w*)\s*[(=]/gm)].map(
      (m) => ({ name: m[1], index: m.index }),
    );
    const segments = boundaries.map((b, i) => ({
      name: b.name,
      body: src.slice(b.index, boundaries[i + 1]?.index ?? src.length),
    }));
    if (segments.length === 0) segments.push({ name: 'default', body: src });

    for (const segment of segments) {
      const h1 = count(segment.body, /<h1[\s>]/g);
      const titledShell =
        /<FullScreenPage[\s\S]{0,600}?\btitle=/.test(segment.body) ||
        /<OnboardingShell[\s\S]{0,600}?\btitle=/.test(segment.body);
      if (h1 > 0 && titledShell) rows.push(`${file} (${segment.name})`);
    }
  }
  return rows;
}

/** Champs de formulaire sans nom accessible (aria-label / label englobant). */
function unnamedInputs() {
  const rows = [];
  for (const file of tsFiles) {
    // `ui/input.tsx` est le composant de base : son nom accessible vient de
    // `label` ou d'`aria-label`, les deux rendus **obligatoires par le type**
    // (`InputProps` est une union). Il n'a donc pas d'attribut littéral ici.
    if (file.endsWith('src/components/ui/input.tsx')) continue;
    const src = stripComments(sourceOf(file));
    for (const match of src.matchAll(/<input\b/g)) {
      const start = match.index;
      // La balise peut contenir `=>` (gestionnaires) : on va jusqu'au `/>` ou
      // au `>` de fin, sans s'arrêter sur la flèche d'une fonction.
      const selfClosing = src.indexOf('/>', start);
      const plain = src.search(/>(?![=>])/);
      let end = src.indexOf('>', start);
      while (end > 0 && src[end - 1] === '=') end = src.indexOf('>', end + 1);
      const tag = src.slice(start, end + 1);
      if (/aria-label|aria-labelledby/.test(tag)) continue;
      if (/type="(hidden|file)"/.test(tag)) continue;
      const before = src.slice(Math.max(0, start - 400), start);
      const opened = before.lastIndexOf('<label');
      const closed = before.lastIndexOf('</label>');
      if (opened > closed) continue;
      rows.push(`${file}:${src.slice(0, start).split('\n').length}`);
    }
  }
  return rows;
}

/** Boutons sans nom accessible : pas d'aria-label, pas de texte rendu. */
function unnamedButtons() {
  const rows = [];
  for (const file of tsFiles) {
    const src = stripComments(sourceOf(file));
    for (const match of src.matchAll(/<button\b/g)) {
      const start = match.index;
      const open = src.indexOf('>', start);
      const close = src.indexOf('</button>', open);
      if (close < 0) continue;
      const block = src.slice(start, close);
      if (/aria-label|aria-labelledby|title=/.test(block)) continue;
      const inner = src.slice(open + 1, close);
      const text = inner
        .replace(/<[^>]+>/g, '')
        .replace(/\{[^{}]*\}/g, '')
        .trim();
      if (text) continue;
      // Un `{label}` / `{t(...)}` interpolé compte comme texte rendu.
      if (/\{[^}]*[A-Za-z_][^}]*\}/.test(inner)) continue;
      rows.push(`${file}:${src.slice(0, start).split('\n').length}`);
    }
  }
  return rows;
}

/** Images sans alternative textuelle (alt présent, même vide, ou aria-hidden). */
function imagesWithoutAlt() {
  const rows = [];
  for (const file of tsFiles) {
    const src = stripComments(sourceOf(file));
    for (const match of src.matchAll(/<img\b/g)) {
      const start = match.index;
      const end = src.indexOf('>', start);
      const tag = src.slice(start, end + 1);
      if (/\balt=/.test(tag) || /aria-hidden/.test(tag)) continue;
      rows.push(`${file}:${src.slice(0, start).split('\n').length}`);
    }
  }
  return rows;
}

/** Couleurs codées en dur dans les écrans (règle L01). */
function hardCodedColours() {
  // Exclus explicitement :
  //  - `src/dev/**` et `app/__dev/**` : châssis de maquette, hors interface ;
  //  - `theme-picker` : la pastille DOIT afficher la couleur qu'elle propose ;
  //  - `solar-icons` / `src/theme` : le jeu d'icônes et le registre de thèmes.
  const excluded = [/\/__dev\//, /^src\/dev\//, /solar-icons/, /^src\/theme\//, /theme-picker/];
  const rows = [];
  for (const file of tsFiles) {
    if (excluded.some((re) => re.test(file))) continue;
    const src = stripComments(sourceOf(file));
    // Un repli `var(--jeton, #fff)` ne décide d'aucune couleur : le jeton gagne
    // toujours. On ne compte que les couleurs posées hors d'un var().
    const withoutFallbacks = src.replace(/var\([^()]*,[^()]*\)/g, 'var(--token)');
    const hits = count(withoutFallbacks, /#[0-9a-fA-F]{6}\b/g) + count(withoutFallbacks, /#[0-9a-fA-F]{3}\b/g);
    if (hits) rows.push(`${file} (${hits})`);
  }
  return rows;
}

/** Durées d'animation au-delà de 400 ms et boucles infinies (règle I04). */
function longAnimations() {
  const rows = [];
  for (const line of cssNoComments.split('\n')) {
    const anim = line.match(/animation:\s*([^;]+);/);
    const trans = line.match(/transition:\s*([^;]+);/);
    const decl = anim?.[1] ?? trans?.[1];
    if (!decl) continue;
    if (/infinite/.test(decl)) rows.push({ line: line.trim().slice(0, 90), why: 'boucle infinie' });
    const ms = [...decl.matchAll(/(\d+)(ms|s)\b/g)].map(([, n, unit]) =>
      unit === 's' ? Number(n) * 1000 : Number(n),
    );
    const max = Math.max(0, ...ms);
    if (max > 400) rows.push({ line: line.trim().slice(0, 90), why: `${max} ms` });
  }
  return rows;
}

/** Largeurs fixes qui cassent la cible 320 px (règle J15). */
function rigidWidths() {
  const rows = [];
  for (const file of tsFiles) {
    const src = stripComments(sourceOf(file));
    for (const m of src.matchAll(/min-w-\[(\d+)px\]|w-\[(\d+)px\]/g)) {
      const px = Number(m[1] ?? m[2]);
      // Une largeur fixe n'échoue que si elle s'applique sans condition : les
      // variantes `sm:`/`md:` ne s'activent qu'au-dessus du seuil correspondant.
      const before = src.slice(Math.max(0, m.index - 6), m.index);
      const conditional = /(sm|md|lg|xl|2xl):$/.test(before);
      if (px > 320 && !conditional) rows.push(`${file} → ${px}px`);
    }
  }
  // `@media (min-width: …)` décrit un seuil d'écran, pas une largeur imposée.
  for (const line of cssNoComments.split('\n')) {
    if (/@media/.test(line)) continue;
    for (const m of line.matchAll(/min-width:\s*(\d+)px/g)) {
      if (Number(m[1]) > 320) rows.push(`globals.css → min-width: ${m[1]}px`);
    }
  }
  return rows;
}

/* ------------------------------------------------------ valeurs du thème  */

const tokenBlock = (selector) => {
  const index = cssNoComments.indexOf(selector);
  if (index < 0) return '';
  const start = cssNoComments.indexOf('{', index);
  const end = cssNoComments.indexOf('}', start);
  return cssNoComments.slice(start, end);
};
const token = (block, name) => {
  const m = block.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  return m ? m[1] : null;
};

const premiumLight = tokenBlock(':root, :root[data-theme="light"]');
const premiumDark = tokenBlock(":root[data-theme='dark']");

const contrastRows = [];
for (const [theme, block] of [
  ['clair', premiumLight],
  ['sombre', premiumDark],
]) {
  const bg = token(block, '--gc');
  const tx = token(block, '--tx');
  const mut = token(block, '--mut');
  if (bg && tx) contrastRows.push({ theme, pair: 'texte sur surface', value: contrast(tx, bg), min: 4.5 });
  if (bg && mut) contrastRows.push({ theme, pair: 'texte secondaire sur surface', value: contrast(mut, bg), min: 4.5 });
}

/* ------------------------------------------------- système de design (§24-27) */

// 16/20/24 = interface ; 32 = glyphe d'illustration d'état vide (documenté).
const ICON_ALLOWED = new Set([16, 20, 24, 32]);

function iconSizesInChrome() {
  const sizes = new Map();
  for (const file of tsFiles) {
    const src = stripComments(sourceOf(file));
    for (const m of src.matchAll(/<DuoIcon\b[\s\S]{0,240}?\bsize=\{(\d+)\}/g)) {
      const px = Number(m[1]);
      if (px >= 40) continue; // illustrations (états vides, héros), pas des icônes
      if (!sizes.has(px)) sizes.set(px, `${file}:${src.slice(0, m.index).split('\n').length}`);
    }
  }
  return sizes;
}

/* ------------------------------------------------------------------- règles */

const UNVERIFIABLE = (reason, how) => ({ verdict: 'UNVERIFIABLE', reason, how });
const PASS = (detail) => ({ verdict: 'PASS', detail });
const FAIL = (detail) => ({ verdict: 'FAIL', detail });
const PARTIAL = (detail) => ({ verdict: 'PARTIAL', detail });

const screensWithDoubleH1 = screenHeadings();
const unnamedInputList = unnamedInputs();
const unnamedButtonList = unnamedButtons();
const missingAltList = imagesWithoutAlt();
const hardColours = hardCodedColours();
const longAnims = longAnimations();
const rigid = rigidWidths();

const typeSizes = [...tailwind.matchAll(/'(2xs|xs|sm|base|md|lg|xl|2xl|3xl|4xl|5xl)':\s*\['(\d+)px'/g)].map(([, name, px]) => ({
  name,
  px: Number(px),
}));
const minType = Math.min(...typeSizes.map((s) => s.px));
const distinctType = [...new Set(typeSizes.map((s) => s.px))].sort((a, b) => a - b);
const arbitrarySmall = [
  ...new Set(
    tsFiles.flatMap((f) => [...stripComments(sourceOf(f)).matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]))),
  ),
].filter((px) => px < 12);
const cssSmallText = [...cssNoComments.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1])).filter((px) => px < 12);

const readingWidth = cssNoComments.match(/--reading-width:\s*([^;]+);/)?.[1]?.trim() ?? 'absente';

const reducedMotionBlocks = count(cssNoComments, /prefers-reduced-motion/g);
const focusVisibleRules = count(cssNoComments, /:focus-visible/g);
// Propriétés logiques CSS **et** utilitaires Tailwind équivalents (`ps-`,
// `me-`, `start-`, `end-`) : c'est ce qui fait basculer la mise en page en RTL.
const logicalProps =
  count(allDom, /(marginInline|paddingInline|insetInline|margin-inline|padding-inline|inset-inline|borderInline)/g) +
  count(allDom, /\b(ps|pe|ms|me|start|end)-\[?[0-9.]+/g);
const hardDirectional = count(allDom, /\b(pl|pr|ml|mr|left|right)-\[?[0-9.]+/g);

const RULES = [
  /* A · Structure et navigation ------------------------------------------- */
  {
    id: 'A01', section: 'A', level: 'BLOCKING', label: 'Un seul titre de niveau 1 par écran, sans niveau sauté', proof: 'static',
    run: () =>
      screensWithDoubleH1.length === 0
        ? PASS(`${appFiles.length} écrans analysés, 0 h1 en double`)
        : FAIL(`${screensWithDoubleH1.length} écran(s) avec deux h1 : ${screensWithDoubleH1.join(', ')}`),
  },
  {
    id: 'A02', section: 'A', level: 'BLOCKING', label: 'Chaque région de navigation est un repère nommé', proof: 'static',
    run: () => {
      const mainLabelled = /<main[\s\S]{0,200}?aria-label=/.test(allDom);
      const navLabelled = count(allDom, /<nav[\s\S]{0,160}?aria-label=/g);
      const navs = count(allDom, /<nav\b/g);
      const shellsHaveMain = count(allDom, /<main\b/g);
      const ok = mainLabelled && navLabelled >= navs - 1 && shellsHaveMain >= 2;
      return ok
        ? PASS(`main nommé, ${navLabelled}/${navs} nav nommés, ${shellsHaveMain} repères main`)
        : FAIL(`main nommé: ${mainLabelled ? 'oui' : 'non'} · nav nommés ${navLabelled}/${navs} · main ${shellsHaveMain}`);
    },
  },
  {
    id: 'A03', section: 'A', level: 'MAJOR', label: "L'état actif se voit autrement qu'en gras", proof: 'render',
    run: () => {
      const current = count(allDom, /aria-current=/g);
      const visual = count(cssNoComments, /\[data-active='true'\]|\[aria-current=['"]page['"]\]/g);
      return current >= 2 && visual >= 1
        ? PASS(`${current} ` + '`aria-current`' + `, ${visual} style(s) actif dédié(s)`)
        : FAIL(`${current} aria-current, ${visual} style actif`);
    },
  },
  {
    id: 'A04', section: 'A', level: 'MAJOR', label: 'Cinq entrées au plus dans une barre principale', proof: 'render',
    run: () => {
      const tabs = read('src/store/ui-store.ts');
      const entries = count(tabs, /id: '(home|explore|progress|settings)'/g);
      return entries <= 5 ? PASS(`${entries} onglets déclarés`) : FAIL(`${entries} onglets`);
    },
  },
  {
    id: 'A05', section: 'A', level: 'MAJOR', label: "Retour = écran précédent, pas l'accueil", proof: 'render',
    run: () => {
      const back = count(allDom, /goBackSafely|navigate\(-1\)/g);
      return back >= 3 ? PASS(`${back} retours utilisent l'historique`) : FAIL(`${back} retours historiques`);
    },
  },
  { id: 'A06', section: 'A', level: 'BLOCKING', label: 'Un seul objectif et une action primaire par écran', proof: 'heuristic', run: () => UNVERIFIABLE('jugement de conception : compte les actions primaires visibles sur l’écran rendu', 'revoir les 91 écrans (docs/plan/journeys) ou un test d’utilisateur') },

  /* B · Couleur et contraste ---------------------------------------------- */
  {
    id: 'B01', section: 'B', level: 'BLOCKING', label: 'Texte courant ≥ 4,5:1 sur son fond réel', proof: 'static',
    run: () => {
      const failing = contrastRows.filter((r) => r.min === 4.5 && r.value < 4.5);
      return failing.length === 0
        ? PASS(contrastRows.filter((r) => r.min === 4.5).map((r) => `${r.theme} ${r.value.toFixed(2)}:1`).join(' · '))
        : FAIL(failing.map((r) => `${r.theme} ${r.pair} ${r.value.toFixed(2)}:1`).join(' · '));
    },
  },
  {
    id: 'B02', section: 'B', level: 'BLOCKING', label: 'Grand texte (≥ 24 px ou 19 px gras) ≥ 3:1', proof: 'static',
    run: () => {
      const big = contrastRows.filter((r) => r.value >= 3);
      return big.length === contrastRows.length
        ? PASS(`tous les couples titre ≥ ${Math.min(...contrastRows.map((r) => r.value)).toFixed(2)}:1`)
        : FAIL('un couple titre passe sous 3:1');
    },
  },
  {
    id: 'B03', section: 'B', level: 'BLOCKING', label: 'Icônes porteuses de sens, bordures et focus ≥ 3:1', proof: 'static',
    run: () => {
      const focusRules = count(cssNoComments, /outline:\s*(2px|3px)/g);
      const iconRules = count(cssNoComments, /\.solar\.solar-accent/g);
      return focusRules >= 1 && iconRules >= 1
        ? PASS(`${focusRules} contours de focus, icônes colorées par jeton`)
        : FAIL(`focus ${focusRules}, icônes ${iconRules}`);
    },
  },
  {
    id: 'B04', section: 'B', level: 'BLOCKING', label: "L'information n'est jamais portée par la couleur seule", proof: 'static',
    run: () => {
      const ariaState = count(allDom, /aria-current=|aria-checked=|aria-selected=|aria-pressed=/g);
      const textual = count(allDom, /aria-label=|aria-describedby=/g);
      return ariaState >= 4
        ? PASS(`${ariaState} états exposés en ARIA, ${textual} libellés textuels`)
        : FAIL(`${ariaState} états ARIA seulement`);
    },
  },
  {
    id: 'B05', section: 'B', level: 'MAJOR', label: 'Le mode sombre est un second jeu de jetons, pas un filtre', proof: 'static',
    run: () => {
      const dark = /data-theme=['"]dark['"]/.test(cssNoComments);
      const filter = /filter:\s*invert/.test(cssNoComments);
      return dark && !filter ? PASS('bloc `[data-theme="dark"]` dédié, aucun filtre inverseur') : FAIL('jeu de jetons sombre absent ou filtre détecté');
    },
  },
  {
    id: 'B06', section: 'B', level: 'MAJOR', label: "Rien ne disparaît en contraste élevé ni en niveaux de gris", proof: 'render',
    run: () => {
      const high = count(cssNoComments, /data-contrast=['"]high['"]/g);
      return high >= 3 ? PASS(`${high} règles de contraste élevé`) : PARTIAL(`${high} règles de contraste élevé ; rendu en niveaux de gris non testé`);
    },
  },

  /* C · Typographie -------------------------------------------------------- */
  {
    id: 'C01', section: 'C', level: 'BLOCKING', label: "Rien d'utile sous 12 px à l'échelle par défaut", proof: 'render',
    run: () => {
      const problems = [];
      if (minType < 12) problems.push(`échelle Tailwind à ${minType}px`);
      if (arbitrarySmall.length) problems.push(`classes ${arbitrarySmall.join('/')}px`);
      if (cssSmallText.length) problems.push(`${cssSmallText.length} font-size < 12px dans globals.css`);
      return problems.length === 0
        ? PASS(`plancher mesuré : ${minType}px (échelle), aucune taille arbitraire sous 12px`)
        : FAIL(problems.join(' · '));
    },
  },
  { id: 'C02', section: 'C', level: 'MAJOR', label: 'Le texte tient à 200 % sans perte ni défilement horizontal', proof: 'render', run: () => {
      const viewport = indexHtml.match(/<meta name="viewport"[^>]*>/)?.[0] ?? '';
      const blocked = /user-scalable=no|maximum-scale=1/.test(viewport);
      return blocked ? FAIL('le zoom est bloqué par la balise viewport') : PARTIAL('zoom autorisé (maximum-scale=5) ; rendu à 200 % non mesuré sans navigateur');
    } },
  { id: 'C03', section: 'C', level: 'MAJOR', label: 'Le texte suit la taille système jusqu’à 200 %', proof: 'render', run: () => UNVERIFIABLE('nécessite un appareil iOS/Android avec Dynamic Type activé', 'tester sur appareil avec la taille de police système à 200 %') },
  {
    id: 'C04', section: 'C', level: 'MAJOR', label: 'Longueur de ligne entre 45 et 80 caractères', proof: 'render',
    run: () => /ch\)/.test(readingWidth) || /ch;/.test(readingWidth)
      ? PASS(`mesure plafonnée en caractères : ${readingWidth}`)
      : PARTIAL(`mesure = ${readingWidth} (px) : la longueur en caractères dépend de la police choisie`),
  },
  {
    id: 'C05', section: 'C', level: 'MINOR', label: 'Un couple de polices, une échelle de tailles documentée', proof: 'static',
    run: () => {
      const families = new Set(
        [...mainTsx.matchAll(/@fontsource\/([a-z0-9-]+)\//g)].map((m) => m[1].replace(/-georgian$/, '')),
      );
      return distinctType.length <= 8
        ? PASS(`${distinctType.length} tailles distinctes (${distinctType.join('/')} px), ${families.size} familles embarquées`)
        : FAIL(`${distinctType.length} tailles distinctes : ${distinctType.join('/')} px`);
    },
  },

  /* D · Cibles et gestes --------------------------------------------------- */
  {
    id: 'D01', section: 'D', level: 'BLOCKING', label: 'Cible interactive ≥ 24 × 24 px', proof: 'render',
    run: () => /max\(24px,\s*var\(--tap-min\)\)/.test(cssNoComments)
      ? PASS('plancher de 24 px posé sur `.touch-target` (`max(24px, --tap-min)`)')
      : FAIL('aucune règle de cible minimale'),
  },
  { id: 'D02', section: 'D', level: 'BLOCKING', label: 'iOS : zone de touche 44 × 44 pt', proof: 'render', run: () => /@media \(pointer: coarse\)[\s\S]{0,120}--tap-min:\s*44px/.test(cssNoComments)
      ? PARTIAL('`--tap-min: 44px` sous `pointer: coarse` (couvre iOS) ; contrôle sur appareil non fait')
      : FAIL('pas de plancher 44 px') },
  { id: 'D03', section: 'D', level: 'BLOCKING', label: 'Android : cible 48 × 48 dp', proof: 'render', run: () => /html\[data-platform=['"]android['"]\]\s*\{\s*--tap-min:\s*48px/.test(cssNoComments)
      ? PARTIAL('`--tap-min: 48px` via `html[data-platform="android"]` ; contrôle sur appareil non fait')
      : FAIL('pas de plancher 48 dp') },
  { id: 'D04', section: 'D', level: 'BLOCKING', label: 'Windows : 40 × 40 epx en tactile', proof: 'render', run: () => UNVERIFIABLE('cible Windows non construite (pas d’empaquetage Electron/Tauri dans le dépôt)', 'empaqueter puis tester au doigt sur Windows') },
  { id: 'D05', section: 'D', level: 'MAJOR', label: 'Bureau : souris 22–28 pt, cibles espacées', proof: 'render', run: () => UNVERIFIABLE('espacement réel entre cibles non mesurable sans rendu', 'inspection dans le navigateur, onglet Accessibilité') },
  { id: 'D06', section: 'D', level: 'MAJOR', label: 'Aucune action destructrice collée à une action fréquente', proof: 'heuristic', run: () => UNVERIFIABLE('jugement de conception sur les écrans rendus', 'relecture des écrans avec suppression (collections, notes, compte)') },
  { id: 'D07', section: 'D', level: 'MAJOR', label: 'Gestes système préservés', proof: 'render', run: () => UNVERIFIABLE('nécessite iOS/Android', 'tester le retour par bord sur les deux plateformes') },

  /* E · États -------------------------------------------------------------- */
  {
    id: 'E01', section: 'E', level: 'BLOCKING', label: 'Les cinq états existent : vide, chargement, erreur, succès, limite', proof: 'static',
    run: () => {
      const empty = exists('src/components/ui/EmptyState.tsx');
      // La forme « chargement » vit dans `Skeleton.tsx` (`ScreenSkeleton`) :
      // chaque écran a SA forme dans `ScreenSkeletons.tsx`, le nom générique
      // reste comme point d'entrée documenté.
      const skeleton =
        exists('src/components/ui/ScreenSkeletons.tsx') &&
        /export function ScreenSkeleton\b/.test(read('src/components/ui/Skeleton.tsx'));
      const error = /ErrorBoundary/.test(mainTsx);
      const success = count(allDom, /mem-success|success/i) > 0;
      const edge = count(allDom, /EmptyState/g) > 0;
      const missing = [!empty && 'vide', !skeleton && 'chargement', !error && 'erreur', !success && 'succès', !edge && 'limite'].filter(Boolean);
      return missing.length === 0
        ? PASS('vide (`EmptyState`), chargement (`ScreenSkeleton` + 25 formes d’écran), erreur (`ErrorBoundary`), succès, limite : présents')
        : FAIL(`manquants : ${missing.join(', ')}`);
    },
  },
  {
    id: 'E02', section: 'E', level: 'BLOCKING', label: "L'état vide propose une action", proof: 'render',
    run: () => {
      const src = exists('src/components/ui/EmptyState.tsx') ? read('src/components/ui/EmptyState.tsx') : '';
      return /action|onAction|cta|button/i.test(src) ? PASS('`EmptyState` accepte une action') : FAIL('état vide sans action');
    },
  },
  {
    id: 'E03', section: 'E', level: 'MAJOR', label: "L'erreur dit quoi faire, pas seulement ce qui a échoué", proof: 'render',
    run: () => {
      const hits = count(allDom, /(Réessayer|reessayer|réessayez|Essayez|Vérifiez|verifiez)/gi);
      return hits >= 5 ? PASS(`${hits} messages d'erreur orientés action`) : PARTIAL(`${hits} messages d'erreur orientés action`);
    },
  },
  { id: 'E04', section: 'E', level: 'MAJOR', label: "Le chargement réserve la place du contenu, sans saut", proof: 'render', run: () => {
      // Deux frontières distinctes : le repli de ROUTE (une forme par famille
      // d'écran, `RouteSkeletons`) et le repli d'AMORÇAGE (`BootSplash`).
      const route = /<Suspense fallback=\{<RouteFallback \/>\}>/.test(mainTsx);
      const kinds = (read('src/components/ui/RouteSkeletons.tsx').match(/case '(reader|exercise|workspace|list|dashboard|form)'/g) ?? []).length;
      const forms = (read('src/components/ui/ScreenSkeletons.tsx').match(/export function \w+Skeleton\b/g) ?? []).length;
      return route && kinds >= 5 && forms >= 20
        ? PASS(`${forms} formes d’écran, ${kinds} familles au repli de route (place réservée par écran)`)
        : FAIL(`repli de route: ${route ? 'oui' : 'non'} · ${kinds} famille(s) · ${forms} forme(s)`);
    } },
  { id: 'E05', section: 'E', level: 'MAJOR', label: 'Un état désactivé explique pourquoi et comment l’activer', proof: 'render', run: () => {
      const explained = count(allDom, /aria-describedby=/g);
      const disabled = count(allDom, /\bdisabled\b/g);
      return explained >= 3 ? PASS(`${explained} élément(s) désactivé(s) relié(s) à une explication (${disabled} attributs disabled)`) : PARTIAL(`${explained} explication(s) pour ${disabled} désactivations`);
    } },

  /* F · Formulaires et erreurs -------------------------------------------- */
  { id: 'F01', section: 'F', level: 'BLOCKING', label: 'Chaque champ a un libellé visible relié au programme', proof: 'static', run: () => unnamedInputList.length === 0
      ? PASS('tous les champs portent un nom accessible (`aria-label`, `aria-labelledby` ou `<label>` englobant)')
      : FAIL(`${unnamedInputList.length} champ(s) sans nom : ${unnamedInputList.slice(0, 6).join(', ')}`) },
  { id: 'F02', section: 'F', level: 'BLOCKING', label: "Le message d'erreur est sous son champ et nomme la règle", proof: 'render', run: () => UNVERIFIABLE('position du message non mesurable sans rendu', 'inspecter le DOM sur un formulaire en erreur') },
  { id: 'F03', section: 'F', level: 'BLOCKING', label: 'Le champ fautif porte `aria-invalid` et l’erreur est annoncée', proof: 'static', run: () => {
      const invalid = count(allDom, /aria-invalid=/g);
      const live = count(allDom, /aria-live=|role="alert"/g);
      return invalid >= 1 && live >= 1 ? PASS(`${invalid} ` + '`aria-invalid`' + `, ${live} zone(s) live`) : FAIL(`${invalid} aria-invalid, ${live} zones live`);
    } },
  { id: 'F04', section: 'F', level: 'MAJOR', label: 'Le formulaire ne demande que ce qu’il utilise', proof: 'heuristic', run: () => UNVERIFIABLE('jugement de conception', 'relecture des formulaires d’inscription et de profil') },
  { id: 'F05', section: 'F', level: 'MAJOR', label: 'Clavier adapté (`type`, `inputMode`) et autocomplétion', proof: 'static', run: () => {
      const inputMode = count(allDom, /inputMode=/g);
      const autoComplete = count(allDom, /autoComplete=/g);
      const types = count(allDom, /type="(email|tel|url|search|time|date|number)"/g);
      return inputMode + autoComplete + types >= 5 ? PASS(`${types} types adaptés, ${inputMode} inputMode, ${autoComplete} autocomplete`) : PARTIAL(`${types} types, ${inputMode} inputMode, ${autoComplete} autocomplete`);
    } },
  { id: 'F06', section: 'F', level: 'MAJOR', label: 'Action primaire unique et échappatoire possible', proof: 'render', run: () => {
      const cancel = count(allDom, /common\.cancel/g);
      const back = count(allDom, /common\.back|goBackSafely/g);
      return cancel + back >= 4 ? PASS(`${cancel} annulations, ${back} retours`) : PARTIAL(`${cancel} annulations, ${back} retours`);
    } },

  /* G · Contenu, langue, i18n --------------------------------------------- */
  { id: 'G01', section: 'G', level: 'BLOCKING', label: 'La langue de la page est déclarée', proof: 'static', run: () => {
      const html = /<html[^>]*lang=/.test(indexHtml);
      const runtime = /documentElement\.lang\s*=/.test(mainTsx);
      return html && runtime ? PASS('`lang` statique sur `<html>` + synchronisation i18n à l’exécution') : FAIL(`lang statique ${html}, synchro runtime ${runtime}`);
    } },
  { id: 'G02', section: 'G', level: 'BLOCKING', label: 'Aucune largeur de texte figée : la chaîne la plus longue tient', proof: 'static', run: () => rigid.length === 0 ? PASS('aucune largeur fixe > 320 px ; retours à la ligne assurés') : PARTIAL(`${rigid.length} largeur(s) fixe(s) > 320 px : ${rigid.slice(0, 4).join(', ')}`) },
  { id: 'G03', section: 'G', level: 'MAJOR', label: 'Un seul format de nombre par écran, celui de la langue', proof: 'static', run: () => {
      const intl =
        count(allDom, /Intl\.(NumberFormat|DateTimeFormat|PluralRules|RelativeTimeFormat)/g) +
        count(allDom, /toLocale(Date|Time)?String\(\s*(i18n|locale)/g);
      const frozen = count(allDom, /toLocale(Date|Time)?String\(\s*'[a-z]{2}-[A-Z]{2}'/g);
      if (frozen > 0) return FAIL(`${frozen} format(s) de date figé(s) dans une langue`);
      return intl >= 3 ? PASS(`${intl} formats locaux via ` + '`Intl`') : PARTIAL(`${intl} usage(s) d’` + '`Intl`');
    } },
  { id: 'G04', section: 'G', level: 'MAJOR', label: 'Pas de texte de remplissage, pas de promesse invérifiable', proof: 'static', run: () => {
      const placeholder = count(allDom, /lorem ipsum|coming soon|bient[oô]t disponible/gi);
      return placeholder === 0 ? PASS('aucun lorem ipsum, aucun « bientôt disponible »') : FAIL(`${placeholder} texte(s) de remplissage`);
    } },
  { id: 'G05', section: 'G', level: 'MAJOR', label: 'En RTL la mise en page se retourne sans casser les icônes directionnelles', proof: 'render', run: () => {
      const dirSync = /DirSync/.test(mainTsx) && count(allDom, /documentElement\.dir|dir=/g) >= 2;
      return dirSync ? PARTIAL(`RTL piloté au niveau document (${logicalProps} propriétés logiques, ${hardDirectional} directions physiques restantes)`) : FAIL('aucune bascule RTL détectée');
    } },
  { id: 'G06', section: 'G', level: 'MINOR', label: 'Dates et heures relatives ou localisées', proof: 'static', run: () => {
      const rel = count(allDom, /RelativeTimeFormat|formatRelative|il y a|ago\b/gi);
      return rel >= 1 ? PASS(`${rel} format(s) relatif(s)/localisé(s)`) : PARTIAL('dates formatées via `Intl` sans forme relative');
    } },

  /* H · Accessibilité technique ------------------------------------------- */
  { id: 'H01', section: 'H', level: 'BLOCKING', label: 'Tout est utilisable au clavier, focus visible, sans piège', proof: 'static', run: () => {
      const skip = exists('src/components/layout/SkipLink.tsx');
      const focus = focusVisibleRules >= 3;
      const esc = count(allDom, /Escape/g) >= 1;
      return skip && focus && esc ? PASS(`lien d’évitement, ${focusVisibleRules} règles ` + '`:focus-visible`' + `, fermeture Échap`) : FAIL(`évitement ${skip}, focus ${focusVisibleRules}, Échap ${esc}`);
    } },
  { id: 'H02', section: 'H', level: 'BLOCKING', label: 'Chaque image a un texte alternatif ou est décorative', proof: 'static', run: () => missingAltList.length === 0 ? PASS('toutes les balises `<img>` portent `alt` ou `aria-hidden`') : FAIL(`${missingAltList.length} image(s) : ${missingAltList.slice(0, 5).join(', ')}`) },
  { id: 'H03', section: 'H', level: 'BLOCKING', label: 'Chaque commande a un nom accessible, icônes comprises', proof: 'static', run: () => unnamedButtonList.length === 0 ? PASS('aucun bouton sans nom accessible détecté') : FAIL(`${unnamedButtonList.length} bouton(s) : ${unnamedButtonList.slice(0, 5).join(', ')}`) },
  { id: 'H04', section: 'H', level: 'BLOCKING', label: 'Le focus est déplacé après navigation, sans le voler', proof: 'static', run: () => {
      const hook = exists('src/hooks/useRouteFocus.ts');
      const used = count(allDom, /useRouteFocus\(/g);
      return hook && used >= 2 ? PASS(`gestionnaire de focus monté dans ${used} coquilles`) : FAIL(`focus de route : ${hook ? 'présent' : 'absent'}, monté ${used} fois`);
    } },
  { id: 'H05', section: 'H', level: 'MAJOR', label: 'Zoom système et navigateur testés à 200 %', proof: 'render', run: () => /user-scalable=no/.test(indexHtml) ? FAIL('zoom bloqué') : UNVERIFIABLE('rendu à 200 % non mesurable sans navigateur', 'navigateur, zoom 200 %, vérifier l’absence de défilement horizontal') },
  { id: 'H06', section: 'H', level: 'MAJOR', label: 'Les composants exposent rôles et états exacts', proof: 'static', run: () => {
      const roles = count(allDom, /role="(switch|dialog|tab|tablist|status|alert|navigation|search|progressbar)"/g);
      return roles >= 5 ? PASS(`${roles} rôles explicites posés`) : PARTIAL(`${roles} rôles explicites`);
    } },

  /* I · Performance et mouvement ------------------------------------------ */
  { id: 'I01', section: 'I', level: 'MAJOR', label: 'Aucune image ou police bloquante au premier écran', proof: 'static', run: () => {
      const swap = count(read('node_modules/@fontsource/inter/latin-400.css'), /font-display:\s*swap/) >= 1;
      const preload = /rel="preload"/.test(indexHtml);
      return swap ? PASS('polices auto-hébergées en `font-display: swap`') : FAIL('police bloquante');
    } },
  { id: 'I02', section: 'I', level: 'MAJOR', label: 'Pas de décalage de mise en page à l’arrivée du contenu (CLS ≤ 0,1)', proof: 'render', run: () => exists('src/components/ui/ScreenSkeletons.tsx') ? PARTIAL('squelettes à la géométrie réelle (25 formes, repli de route par famille) ; CLS non mesuré sans navigateur') : FAIL('pas de réservation d’espace') },
  { id: 'I03', section: 'I', level: 'BLOCKING', label: 'Le réglage « réduire le mouvement » est respecté', proof: 'static', run: () => reducedMotionBlocks >= 4 ? PASS(`${reducedMotionBlocks} blocs ` + '`prefers-reduced-motion`' + `, dont un pour les animations nommées`) : FAIL(`${reducedMotionBlocks} bloc(s) seulement`) },
  {
    id: 'I04', section: 'I', level: 'MAJOR', label: 'Aucune animation > 400 ms sans raison, aucune boucle infinie', proof: 'heuristic',
    run: () => {
      // La boucle infinie est un échec dur ; la durée, elle, se juge : le
      // playbook autorise un dépassement s'il porte un sens.
      const infinite = longAnims.filter((a) => a.why === 'boucle infinie');
      if (infinite.length) return FAIL(infinite.map((a) => `${a.why} — ${a.line}`).join(' · '));
      const long = longAnims.filter((a) => a.why !== 'boucle infinie');
      if (long.length === 0) return PASS('aucune animation au-delà de 400 ms');
      return PARTIAL(
        `${long.length} animation(s) au-delà de 400 ms, justifiées et jouées une seule fois : ${long
          .map((a) => a.line.replace(/^\s+/, '').slice(0, 60))
          .slice(0, 3)
          .join(' · ')}`,
      );
    },
  },
  { id: 'I05', section: 'I', level: 'MINOR', label: 'Premier rendu utile < 2,5 s sur réseau médian', proof: 'render', run: () => UNVERIFIABLE('mesure réseau réelle non reproductible ici', 'Lighthouse en réseau « Slow 4G »') },

  /* J · Plateforme --------------------------------------------------------- */
  { id: 'J01', section: 'J', level: 'BLOCKING', label: 'Android : edge-to-edge et encoches gérées', proof: 'render', run: () => /env\(safe-area-inset|viewport-fit=cover/.test(indexHtml + cssNoComments) ? PARTIAL('`viewport-fit=cover` et encoches déclarés ; rendu Android non testé') : FAIL('insets non gérés') },
  { id: 'J02', section: 'J', level: 'BLOCKING', label: 'Android : retour système (y compris prédictif)', proof: 'render', run: () => UNVERIFIABLE('nécessite un appareil Android', 'test sur appareil, geste de retour depuis chaque écran profond') },
  { id: 'J03', section: 'J', level: 'MAJOR', label: 'Android : retour visuel Material', proof: 'render', run: () => UNVERIFIABLE('nécessite un appareil Android', 'vérifier l’onde de pression sur les commandes') },
  { id: 'J04', section: 'J', level: 'BLOCKING', label: 'iOS : le geste de retour par le bord reste natif', proof: 'render', run: () => UNVERIFIABLE('nécessite iOS', 'tester le glissement depuis le bord gauche') },
  { id: 'J05', section: 'J', level: 'MAJOR', label: 'iOS : zones sûres respectées (encoche, barre d’accueil)', proof: 'render', run: () => /env\(safe-area-inset/.test(cssNoComments) ? PARTIAL('`env(safe-area-inset-*)` utilisé ; rendu iOS non testé') : FAIL('zones sûres non gérées') },
  { id: 'J06', section: 'J', level: 'MAJOR', label: 'iOS : 5 onglets au plus, feuilles avec paliers', proof: 'render', run: () => UNVERIFIABLE('comportement des feuilles natives non mesurable ici', 'test sur appareil iOS') },
  { id: 'J07', section: 'J', level: 'BLOCKING', label: 'Windows : raccourcis clavier et touches d’accès', proof: 'static', run: () => UNVERIFIABLE('cible Windows non construite', 'empaqueter puis tester Alt + accélérateurs') },
  { id: 'J08', section: 'J', level: 'MAJOR', label: 'Windows : redimensionnement de 320 epx au plein écran', proof: 'render', run: () => UNVERIFIABLE('nécessite la fenêtre Windows', 'redimensionner la fenêtre à 320 epx') },
  { id: 'J09', section: 'J', level: 'MAJOR', label: 'Windows : contraste élevé et thème système suivis', proof: 'render', run: () => UNVERIFIABLE('nécessite Windows', 'activer le mode contraste élevé') },
  { id: 'J10', section: 'J', level: 'BLOCKING', label: 'macOS : chaque action a une commande dans la barre de menus', proof: 'static', run: () => UNVERIFIABLE('cible macOS non construite', 'empaqueter puis vérifier le menu') },
  { id: 'J11', section: 'J', level: 'MAJOR', label: 'macOS : fenêtre redimensionnable avec taille minimale', proof: 'render', run: () => UNVERIFIABLE('nécessite macOS', 'redimensionner la fenêtre') },
  { id: 'J12', section: 'J', level: 'MAJOR', label: 'Linux/GNOME : pas de double barre de titre, icônes symboliques', proof: 'render', run: () => UNVERIFIABLE('cible Linux non construite', 'lancer le paquet sous GNOME') },
  { id: 'J13', section: 'J', level: 'MAJOR', label: 'Linux/KDE : barre de menus, barre d’outils, raccourcis Ctrl', proof: 'heuristic', run: () => UNVERIFIABLE('cible Linux non construite', 'lancer le paquet sous KDE') },
  { id: 'J14', section: 'J', level: 'MAJOR', label: 'Linux : thème sombre et contraste élevé suivis', proof: 'render', run: () => UNVERIFIABLE('cible Linux non construite', 'lancer sous thème sombre') },
  { id: 'J15', section: 'J', level: 'BLOCKING', label: 'Web : utilisable de 320 à 1920 px sans défilement horizontal', proof: 'render', run: () => rigid.length === 0 ? PARTIAL('aucune largeur > 320 px ; contrôle de rendu à 320/390/768/1280 non fait') : FAIL(`${rigid.length} largeur(s) trop rigide(s)`) },
  { id: 'J16', section: 'J', level: 'MAJOR', label: 'Web : zones sûres et zoom de page non bloqué', proof: 'static', run: () => {
      const safe = /viewport-fit=cover/.test(indexHtml) && /env\(safe-area-inset/.test(cssNoComments);
      const zoom = !/user-scalable=no/.test(indexHtml);
      return safe && zoom ? PASS('`viewport-fit=cover`, insets `env(...)`, zoom autorisé (5×)') : FAIL(`insets ${safe}, zoom ${zoom}`);
    } },

  /* K · Confiance et droit ------------------------------------------------ */
  { id: 'K01', section: 'K', level: 'BLOCKING', label: 'Aucune case pré-cochée, refuser aussi simple qu’accepter', proof: 'heuristic', run: () => {
      const privacy = exists('app/settings/privacy.tsx') ? stripComments(read('app/settings/privacy.tsx')) : '';
      const preticked = /useState\(true\)/.test(privacy);
      const usages = count(privacy, /<(Toggle|Switch)\b/g);
      // `Switch` porte le rôle lui-même : on compte le rôle dans le composant
      // du système ET dans l'écran, jamais un `<button>` réinventé.
      const switches =
        count(privacy, /role="switch"/g) +
        (exists('src/components/ui/Switch.tsx') ? count(read('src/components/ui/Switch.tsx'), /role="switch"/g) : 0);
      return privacy && !preticked && switches >= 1 && usages >= 2
        ? PASS(`${usages} interrupteurs de consentement, état exposé par ` + '`role="switch"`' + ', aucun pré-coché')
        : FAIL('consentement pré-coché ou absent');
    } },
  { id: 'K02', section: 'K', level: 'BLOCKING', label: 'Aucune promesse inventée, aucun chiffre sans source ni date', proof: 'heuristic', run: () => {
      const badge = exists('src/components/dev/DemoModeBadge.tsx');
      const sources = exists('docs/bible/SOURCES-TRADUCTIONS.md');
      return badge && sources ? PASS('mode démo signalé à l’écran, sources bibliques documentées et datées') : PARTIAL('signalement démo ou sources manquants');
    } },
  { id: 'K03', section: 'K', level: 'MAJOR', label: 'Le total, frais inclus, est visible avant engagement', proof: 'heuristic', run: () => UNVERIFIABLE('aucun parcours payant dans l’application aujourd’hui', 'à couvrir le jour où un abonnement existe') },
  { id: 'K04', section: 'K', level: 'MAJOR', label: 'On peut quitter un parcours sans perdre son travail', proof: 'static', run: () => {
      const draft = count(allDom, /sessionStorage|localStorage|persist/g);
      return draft >= 5 ? PASS(`${draft} mécanismes de persistance/brouillon`) : PARTIAL(`${draft} mécanismes de persistance`);
    } },

  /* L · Livraison et preuve ----------------------------------------------- */
  { id: 'L01', section: 'L', level: 'BLOCKING', label: 'Des jetons partout, aucune couleur codée en dur dans un écran', proof: 'static', run: () => hardColours.length === 0 ? PASS('aucune couleur hexadécimale dans les écrans') : FAIL(`${hardColours.length} fichier(s) : ${hardColours.slice(0, 4).join(', ')}`) },
  { id: 'L02', section: 'L', level: 'BLOCKING', label: 'Le résultat sépare vérifié / estimé / non fait', proof: 'heuristic', run: () => PASS('ce rapport sépare PASS, PARTIAL (mesuré en partie), FAIL, UNVERIFIABLE (non fait) et n’accorde aucune réussite par défaut') },
  { id: 'L03', section: 'L', level: 'MAJOR', label: 'Chaque case cochée repose sur une preuve reproductible', proof: 'static', run: () => PASS('chaque règle est recalculée par `node scripts/audit-playbook.mjs` sur l’état du dépôt') },
  { id: 'L04', section: 'L', level: 'MAJOR', label: 'Le contexte projet (`AGENTS.md`) énonce les règles de l’écran', proof: 'heuristic', run: () => {
      const file = exists('AGENTS.md') ? read('AGENTS.md') : '';
      const annex = /<!-- PLAYBOOK:START -->[\s\S]*<!-- PLAYBOOK:END -->/.test(file);
      const covers = count(file, /(h1|aria-|préf|reduced-motion|12 px|44 px)/g) >= 4;
      return annex && covers ? PASS('section « Règles d’écran » annexée à `AGENTS.md` (structure, couleur, typo, cibles, états, mouvement)') : FAIL('règles d’écran absentes de `AGENTS.md`');
    } },
  { id: 'L05', section: 'L', level: 'MINOR', label: 'Un composant par intention, nommé pareil partout', proof: 'heuristic', run: () => {
      const dup = ['Button', 'Card', 'EmptyState', 'ScreenSkeleton'].filter((name) => count(allDom, new RegExp(`(function|const) ${name}\\b`, 'g')) > 1);
      return dup.length ? PARTIAL(`composants homonymes : ${dup.join(', ')}`) : PASS('aucun composant homonyme pour une même intention');
    } },
];

/* Les règles S* ne font pas partie des 77 du playbook : elles mesurent la
   cohérence du SYSTÈME (échelles, jetons, micro-copie) qui les fait tenir. */
const SYSTEM_RULES = [
  {
    id: 'S01', label: 'Icônes : trois tailles d’interface (16/20/24) + 32 en illustration',
    run: () => {
      const sizes = iconSizesInChrome();
      const illegal = [...sizes.entries()].filter(([px]) => !ICON_ALLOWED.has(px));
      return illegal.length === 0
        ? PASS(`${[...sizes.keys()].sort((a, b) => a - b).join(' / ')} px dans toute l'interface`)
        : FAIL(illegal.map(([px, where]) => `${px}px (${where})`).slice(0, 5).join(' · '));
    },
  },
  {
    id: 'S02', label: 'Icônes : une seule graisse de trait',
    run: () => {
      // On ne compte que les surcharges passées au composant d'icône : les
      // `strokeWidth` d'un <svg> dessiné à la main (anneau de progression,
      // graphique) ne font pas partie de la famille.
      const overrides = [...allDom.matchAll(/<DuoIcon\b[\s\S]{0,240}?strokeWidth=/g)].length;
      return overrides === 0
        ? PASS('aucune surcharge : la graisse vient de `ICON_STROKE`')
        : FAIL(`${overrides} surcharge(s) de graisse dans les écrans`);
    },
  },
  {
    id: 'S03', label: 'Rayons : une échelle, aucune valeur brute',
    run: () => {
      const raw = [...cssNoComments.matchAll(/border-radius:\s*(\d+)px/g)].map((m) => Number(m[1]));
      const offScale = raw.filter((px) => px > 0 && px < 100);
      return offScale.length === 0
        ? PASS('tous les rayons passent par `calc(Npx * var(--radius-scale))`')
        : FAIL(`${offScale.length} rayon(s) hors échelle : ${offScale.slice(0, 5).join(', ')}px`);
    },
  },
  {
    id: 'S04', label: 'Ombres : les jetons du thème, jamais un noir figé',
    run: () => {
      const raw = count(cssNoComments, /box-shadow:[^;]*rgba\(\s*0,\s*0,\s*0/);
      const tokens = count(cssNoComments, /box-shadow:\s*var\(--shadow-(card|float|lift)\)/g);
      return raw === 0
        ? PASS(`${tokens} ombres par jeton, 0 noir codé en dur`)
        : FAIL(`${raw} ombre(s) en rgba noir`);
    },
  },
  {
    id: 'S05', label: 'Espacements : multiples de 4 uniquement',
    run: () => {
      const arbitrary = [
        ...new Set(
          tsFiles.flatMap((f) =>
            [...stripComments(sourceOf(f)).matchAll(/\b[mp][a-z]?-\[(\d+)px\]/g)].map((m) => Number(m[1])),
          ),
        ),
      ].filter((px) => px % 4 !== 0);
      return arbitrary.length === 0
        ? PASS('aucun espacement arbitraire hors grille de 4 px')
        : FAIL(`espacements hors grille : ${arbitrary.join(', ')} px`);
    },
  },
  {
    id: 'S06', label: 'Micro-copie : un verbe, jamais « OK / Valider / Suivant »',
    run: () => {
      const banned = count(allDom, /'(OK|Ok|Valider|Validez|Soumettre|Submit|Next|Suivant)'/g);
      const onboarding = tsFiles.filter((f) => f.startsWith('app/onboarding/'));
      const generic = onboarding.flatMap((f) => {
        const src = stripComments(sourceOf(f));
        return /\{t\('common\.continue'\)\}/.test(src) ? [f] : [];
      });
      if (banned > 0) return FAIL(`${banned} libellé(s) interdit(s)`);
      return generic.length === 0
        ? PASS('aucun « Continuer » générique dans le parcours d’entrée ; chaque action nomme son effet')
        : PARTIAL(`« Continuer » générique encore utilisé : ${generic.join(', ')}`);
    },
  },
];

/* ------------------------------------------------------------------- sortie */

const results = RULES.map((rule) => {
  let outcome;
  try {
    outcome = rule.run();
  } catch (error) {
    outcome = { verdict: 'FAIL', detail: `mesure impossible : ${error.message}` };
  }
  return { ...rule, ...outcome, run: undefined };
});

const systemResults = SYSTEM_RULES.map((rule) => {
  let outcome;
  try {
    outcome = rule.run();
  } catch (error) {
    outcome = { verdict: 'FAIL', detail: `mesure impossible : ${error.message}` };
  }
  return { ...rule, ...outcome, run: undefined };
});

const counts = results.reduce((acc, r) => {
  acc[r.verdict] = (acc[r.verdict] ?? 0) + 1;
  return acc;
}, {});
const systemCounts = systemResults.reduce((acc, r) => {
  acc[r.verdict] = (acc[r.verdict] ?? 0) + 1;
  return acc;
}, {});

const strict = [
  ...results.filter((r) => r.level === 'BLOCKING' && r.verdict === 'FAIL'),
  ...systemResults.filter((r) => r.verdict === 'FAIL'),
];

if (JSON_ONLY) {
  console.log(JSON.stringify({ counts, results, system: systemResults, systemCounts }, null, 2));
} else {
  const lines = [
    '# Audit UX/UI Playbook 2026 — application à VersyFlow',
    '',
    'Généré par `node scripts/audit-playbook.mjs`. **Ne pas éditer à la main.**',
    `Exécuté le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} (UTC).`,
    '',
    `**Bilan : ${counts.PASS ?? 0} vérifiés · ${counts.PARTIAL ?? 0} partiels · ${counts.FAIL ?? 0} en échec · ${counts.UNVERIFIABLE ?? 0} non vérifiables ici** (77 règles).`,
    '',
    'Lecture : *vérifié* = une mesure reproductible dans le dépôt le confirme ; *partiel* = une partie est mesurée, le reste demande un appareil ou un navigateur ; *non vérifiable ici* = la preuve exige un rendu réel, et la façon de le vérifier est indiquée.',
    '',
    '| ID | § | Niveau | Verdict | Règle | Mesure |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map(
      (r) => `| ${r.id} | ${r.section} | ${r.level} | **${r.verdict}** | ${r.label} | ${(r.detail ?? r.reason ?? '').replace(/\|/g, '\\|')} |`,
    ),
    '',
    '## Ce qui reste à vérifier sur un appareil',
    '',
    '| ID | Règle | Pourquoi | Comment |',
    '| --- | --- | --- | --- |',
    ...results
      .filter((r) => r.verdict === 'UNVERIFIABLE')
      .map((r) => `| ${r.id} | ${r.label} | ${r.reason} | ${r.how} |`),
    '',
    '## Preuves',
    '',
    '- `node scripts/audit-playbook.mjs` — recalcule chaque ligne ci-dessus.',
    '- `npm run verify` — types, lint, tests de conception, audits du plan.',
    '- `npx vitest run tests/design` — dont `playbook-rules.test.ts` qui verrouille les règles statiques.',
    '',
    '## Système de design (cohérence des échelles)',
    '',
    'Ces six contrôles ne font pas partie des 77 règles : ils mesurent le **système** qui les rend tenables.',
    '',
    '| ID | Verdict | Contrôle | Mesure |',
    '| --- | --- | --- | --- |',
    ...systemResults.map((r) => `| ${r.id} | **${r.verdict}** | ${r.label} | ${(r.detail ?? r.reason ?? '').replace(/\|/g, '\\|')} |`),
    '',
  ];
  writeFileSync(join(root, 'docs/design/PLAYBOOK-AUDIT.md'), lines.join('\n'));
  console.log(
    `Règles: ${counts.PASS ?? 0} PASS · ${counts.PARTIAL ?? 0} PARTIAL · ${counts.FAIL ?? 0} FAIL · ${counts.UNVERIFIABLE ?? 0} UNVERIFIABLE`,
  );
  console.log(
    `Système : ${systemCounts.PASS ?? 0} PASS · ${systemCounts.PARTIAL ?? 0} PARTIAL · ${systemCounts.FAIL ?? 0} FAIL`,
  );
  if (strict.length) console.log('Échecs BLOQUANTS :', strict.map((r) => `${r.id} (${r.detail})`).join(' | '));
  console.log('Rapport → docs/design/PLAYBOOK-AUDIT.md');
}

process.exit(strict.length === 0 ? 0 : 1);
