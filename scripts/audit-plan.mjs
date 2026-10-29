#!/usr/bin/env node
/**
 * Audit du plan « Interface web + thèmes ».
 *
 * Pourquoi ce script existe : une case cochée à la main ne prouve rien. Ici,
 * chaque exigence du cahier des charges qui est mesurable sans navigateur est
 * RE-CALCULÉE à partir des fichiers du dépôt, à chaque exécution. Le rapport
 * produit (docs/plan/audit-report.md) contient la valeur mesurée, la cible et
 * le verdict — jamais une affirmation sans chiffre.
 *
 * Ce qui n'est pas mesurable ici (rendu visuel réel, position à l'écran,
 * redimensionnement) est déclaré UNVERIFIABLE avec sa raison, et n'est jamais
 * compté comme réussi.
 *
 * Usage :
 *   node scripts/audit-plan.mjs            # rapport + code 1 si un contrôle strict échoue
 *   node scripts/audit-plan.mjs --json     # sortie machine seule
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
    if (statSync(abs).isDirectory()) walk(relative(root, abs), filter, acc);
    else if (filter.test(entry)) acc.push(relative(root, abs).split('\\').join('/'));
  }
  return acc;
}

const countMatches = (source, re) => (source.match(re) ?? []).length;

/* ----------------------------------------------------------------- couleurs */

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/* ------------------------------------------------------------------- lecture */

const presetCss = read('src/styles/tweakcn-presets.css');
const globals = read('src/styles/globals.css');
const tailwind = read('tailwind.config.js');
const layout = read('app/(tabs)/_layout.tsx');
const appearance = read('app/settings/appearance.tsx');
const appearanceStore = read('src/store/appearance-store.ts');
const themeManager = read('src/components/ThemeManager.tsx');
const imageAccent = read('src/theme/image-accent.ts');
const rail = read('src/components/navigation/DesktopRail.tsx');
const isDesktop = read('src/hooks/useIsDesktop.ts');
const themePicker = read('app/settings/theme-picker.tsx');

const PRESET_BLOCK = /(:root((?:\[[^\]]+\])+)\s*\{)([^}]*)(\})/g;
const presetBlocks = [...presetCss.matchAll(PRESET_BLOCK)]
  .filter((m) => /data-preset=/.test(m[2]))
  .map((m) => ({
    selector: m[2],
    name: (m[2].match(/data-preset=['"]([a-z0-9-]+)['"]/) ?? [])[1],
    dark: /data-theme=['"]dark['"]/.test(m[2]),
    body: m[3],
  }));

const tokenIn = (body, name) => {
  const m = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

/* -------------------------------------------------------- couleurs en dur */

const STYLE_CONTEXT =
  /(style=|className=|\[#|background|backgroundColor|color:|colour|border(?!-)|fill=|stroke=|shadow|gradient)/i;
const LABEL_CONTEXT = /(t\(|label|title=|aria-label|comments?\b|\/\/|\/\*)/i;
const HEX_ANY = /#[0-9a-fA-F]{3,8}\b/g;

function hardcodedColorLines(source) {
  const out = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('*')) return;
    const hits = line.match(HEX_ANY);
    if (!hits) return;
    if (!STYLE_CONTEXT.test(line) || LABEL_CONTEXT.test(line)) return;
    out.push({ line: index + 1, text: line.slice(0, 100), hex: [...new Set(hits)] });
  });
  return out;
}

/** Exceptions documentées dans tests/design/no-hardcoded-colors.test.ts. */
const ALLOWED_FILES = ['src/components/ui/Primitives.tsx'];

/* ------------------------------------------------------------------ contrôles */

const results = [];
const record = (id, section, label, verdict, detail, proof) =>
  results.push({ id, section, label, verdict, detail, proof });

/* §2.2 — format des couleurs ------------------------------------------------- */
{
  const hslNue = countMatches(presetCss + globals + tailwind, /hsl\(var\(--/g);
  const triplet = countMatches(presetCss, /--[a-z-]+:\s*\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/g);
  record(
    'C01',
    '§2.2',
    'Aucun jeton en triplet HSL nu (incompatible avec @property <color>)',
    hslNue === 0 && triplet === 0 ? 'PASS' : 'FAIL',
    `hsl(var(--…)) : ${hslNue} · triplets nus : ${triplet}`,
    'grep -rn "hsl(var(" src app tailwind.config.js',
  );
}

/* §2.1 — contrat complet de jetons dans chaque preset ------------------------ */
{
  const REQUIRED = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'muted', 'muted-foreground', 'accent',
    'border', 'ring',
  ];
  const missing = [];
  for (const block of presetBlocks) {
    for (const token of REQUIRED) {
      const v = tokenIn(block.body, token);
      if (!v || !HEX.test(v)) missing.push(`${block.name}${block.dark ? '/dark' : ''}:--${token}`);
    }
  }
  const names = new Set(presetBlocks.map((b) => b.name));
  record(
    'C02',
    '§2.1',
    'Chaque preset définit les 14 jetons du contrat (clair + sombre)',
    missing.length === 0 && names.size === 25 && presetBlocks.length === 50 ? 'PASS' : 'FAIL',
    `${presetBlocks.length} blocs, ${names.size} presets, ${missing.length} jeton(s) manquant(s)`,
    'node scripts/audit-plan.mjs',
  );
}

/* §2.1 — pont vers les classes réellement utilisées -------------------------- */
{
  const broken = presetBlocks.filter(
    (b) =>
      tokenIn(b.body, 'color-on-primary') !== 'var(--primary-foreground)' ||
      tokenIn(b.body, 'color-primary') !== 'var(--primary)' ||
      tokenIn(b.body, 'color-text-secondary') !== 'var(--muted-foreground)',
  );
  record(
    'C03',
    '§2.1',
    'Le pont --color-* suit les jetons dynamiques (dont --color-on-primary)',
    broken.length === 0 ? 'PASS' : 'FAIL',
    `${presetBlocks.length - broken.length}/${presetBlocks.length} blocs conformes`,
    'grep -c "color-on-primary: var(--primary-foreground)" src/styles/tweakcn-presets.css',
  );
}

/* §2.3 — contrastes mesurés -------------------------------------------------- */
{
  const PAIRS = [
    ['foreground', 'background'],
    ['card-foreground', 'card'],
    ['primary-foreground', 'primary'],
    ['muted-foreground', 'card'],
    ['muted-foreground', 'background'],
  ];
  let tested = 0;
  let failures = 0;
  let worst = { ratio: Infinity, where: '' };
  for (const block of presetBlocks) {
    for (const [fg, bg] of PAIRS) {
      const a = tokenIn(block.body, fg);
      const b = tokenIn(block.body, bg);
      if (!a || !b || !HEX.test(a) || !HEX.test(b)) continue;
      tested++;
      const r = contrast(a, b);
      const where = `${block.name}${block.dark ? '/dark' : ''} ${fg}/${bg} = ${r.toFixed(2)}:1`;
      if (r < worst.ratio) worst = { ratio: r, where };
      if (r < 4.5) failures++;
    }
  }
  record(
    'C04',
    '§2.3',
    'Toutes les paires texte/fond atteignent 4,5:1 (AA)',
    failures === 0 ? 'PASS' : 'FAIL',
    `${tested} paires · pire ${worst.ratio.toFixed(2)}:1 (${worst.where}) · ${failures} échec(s)`,
    'node scripts/apply-preset-contrast.mjs --check',
  );
}

/* §2.4 — animation ----------------------------------------------------------- */
{
  const props = [...globals.matchAll(/@property\s+(--[a-z-]+)\s*\{([^}]*)\}/g)];
  const colorProps = props.filter(([, , body]) => /syntax:\s*'<color>'/.test(body));
  const badInitial = colorProps.filter(([, , body]) => {
    const init = (body.match(/initial-value:\s*([^;]+);/) ?? [])[1]?.trim();
    return !HEX.test(init ?? '') || luminance(init) < 0.02;
  });
  const hasTransition = /transition:[\s\S]{0,400}--primary 0\.8s/.test(globals);
  const hasCubic = /--primary 0\.8s cubic-bezier\(0\.22, 0\.61, 0\.36, 1\)/.test(globals);
  const hasReduced = /prefers-reduced-motion: reduce/.test(globals);
  record(
    'C05',
    '§2.4',
    'Fondu 0,8 s sur jetons typés, valeurs initiales crédibles, mouvement réduit respecté',
    colorProps.length >= 4 && badInitial.length === 0 && hasTransition && hasCubic && hasReduced
      ? 'PASS'
      : 'FAIL',
    `${colorProps.length} @property <color> · initiales invalides: ${badInitial.length} · transition 800ms: ${hasTransition} · courbe: ${hasCubic} · reduced-motion: ${hasReduced}`,
    'grep -n "@property\\|--primary 0.8s" src/styles/globals.css',
  );
}

/* §2.5 — alpha Tailwind ------------------------------------------------------ */
{
  const alphaHelper = /const alpha = \(token\) => `color-mix\(in srgb/.test(tailwind);
  const wrapped = countMatches(tailwind, /alpha\('var\(--/g);
  const glass = /\.surface-glass\s*\{[\s\S]{0,300}bg-card\/40[\s\S]{0,200}blur-2xl/.test(globals);
  const glassConsumed = countMatches(themePicker, /surface-glass/g);
  const veilAsImage = /\.surface-glass[\s\S]{0,500}background-image:\s*linear-gradient\(\s*color-mix\(in srgb, var\(--tint\) 22%/.test(globals);
  record(
    'C06',
    '§2.5',
    'Alpha dérivable sur les variables ; recette de verre 40 % + 40 px + voile',
    alphaHelper && wrapped >= 10 && glass && glassConsumed > 0 && veilAsImage ? 'PASS' : 'PARTIAL',
    `helper: ${alphaHelper} · ${wrapped} jetons dérivables · .surface-glass: ${glass} · consommée ${glassConsumed}× · voile en background-image: ${veilAsImage}`,
    'grep -o "surface-glass{[^}]*}" www/assets/*.css (après build)',
  );
}

/* §9.2 — états d'accessibilité ---------------------------------------------- */
{
  const css = /data-transparency='reduced'/.test(globals) && /data-contrast='high'/.test(globals);
  const store =
    /reducedTransparency: boolean/.test(appearanceStore) && /highContrast: boolean/.test(appearanceStore);
  const ui = /setReducedTransparency/.test(appearance) && /setHighContrast/.test(appearance);
  const applied = /data-transparency/.test(themeManager) && /data-contrast/.test(themeManager);
  record(
    'C07',
    '§9.2',
    'Modes « transparence réduite » et « contraste élevé » pilotables et appliqués',
    css && store && ui && applied ? 'PASS' : 'FAIL',
    `css: ${css} · store: ${store} · interrupteurs: ${ui} · attributs posés: ${applied}`,
    'grep -n "data-transparency" src/styles/globals.css src/components/ThemeManager.tsx',
  );
}

/* §3.3 — couleurs en dur ---------------------------------------------------- */
{
  const files = [...walk('app', /\.tsx$/), ...walk('src/components', /\.tsx$/)].filter(
    (f) => !/\.test\./.test(f) && !ALLOWED_FILES.includes(f),
  );
  const offenders = [];
  for (const file of files) {
    for (const hit of hardcodedColorLines(read(file))) {
      offenders.push(`${file}:${hit.line} → ${hit.hex.join(', ')}`);
    }
  }
  record(
    'C08',
    '§3.3',
    'Aucune couleur littérale dans le code d’interface (hors exception documentée)',
    offenders.length === 0 ? 'PASS' : 'FAIL',
    `${files.length} fichiers d’interface scannés · ${offenders.length} ligne(s) fautive(s)${offenders.length ? ' : ' + offenders.slice(0, 3).join(' | ') : ''}`,
    'npx vitest run tests/design/no-hardcoded-colors.test.ts',
  );
}

/* §6.1 — seuil et montage exclusif ------------------------------------------ */
{
  const threshold = /DESKTOP_MIN_WIDTH = 1024/.test(isDesktop);
  const exclusif =
    /\{isDesktop && <DesktopRail/.test(layout) &&
    ['HamburgerMenu', 'QuickDock', 'BottomTabs'].every((c) =>
      new RegExp(`\\{!isDesktop && <${c}`).test(layout),
    );
  const noPixels = !/\b(264|88)px/.test(layout);
  record(
    'C09',
    '§6.1',
    'Un seul seuil (1024 px), une seule navigation montée, aucune largeur en dur',
    threshold && exclusif && noPixels ? 'PASS' : 'FAIL',
    `seuil: ${threshold} · montage exclusif: ${exclusif} · zéro px en dur: ${noPixels}`,
    'npx vitest run tests/design/desktop-shell.test.ts',
  );
}

/* §6.2 — rail ---------------------------------------------------------------- */
{
  const singleVar = /--rail:\s*0px/.test(globals) && /margin-inline-start:\s*var\(--rail\)/.test(globals);
  const width = /\.desktop-rail\s*\{[\s\S]{0,80}width:\s*var\(--rail\)/.test(globals);
  const collapsed = /data-collapsed='true'\] \.rail-label/.test(globals) && /clip-path:\s*inset\(50%\)/.test(globals);
  const ariaLabels = /aria-current=\{active \? 'page'/.test(rail) && /aria-label=/.test(rail);
  const hugeiconsOnly = /@hugeicons\/react/.test(rail) && !/lucide-react/.test(rail);
  record(
    'C10',
    '§6.2',
    'Rail : une variable de largeur, repli accessible, état actif non colorimétrique',
    singleVar && width && collapsed && ariaLabels && hugeiconsOnly ? 'PASS' : 'FAIL',
    `variable unique: ${singleVar} · largeur: ${width} · repli sr-only: ${collapsed} · aria: ${ariaLabels} · Hugeicons seuls: ${hugeiconsOnly}`,
    'npx vitest run tests/design/desktop-shell.test.ts',
  );
}

/* §6.4 — largeurs de lecture ------------------------------------------------ */
{
  const tokens = /--reading-width: 720px/.test(globals) && /--reading-wide: 1060px/.test(globals);
  const shells = ['src/components/layout/FullScreenPage.tsx', 'src/components/onboarding/OnboardingShell.tsx'];
  const shellHasColumn = shells.every((f) => exists(f) && /screen-column/.test(read(f)));
  // Un écran est couvert s'il porte la classe, ou s'il passe par une coquille qui la porte.
  const screens = walk('app', /\.tsx$/).filter(
    (f) => !/(_layout|\(tabs\)\/_layout|splash|\.test\.)/.test(f),
  );
  const covered = screens.filter((f) => {
    const src = read(f);
    return /screen-column/.test(src) || shells.some((sh) => new RegExp(`from '@/${sh.replace('src/', '').replace('.tsx', '').replace('.ts', '')}`).test(src));
  });
  record(
    'C11',
    '§6.4',
    'Mesure de lecture définie et appliquée à tous les écrans de contenu',
    tokens && shellHasColumn && covered.length === screens.length ? 'PASS' : 'PARTIAL',
    `${covered.length}/${screens.length} écrans couverts (classe directe ou coquille) · coquilles: ${shellHasColumn ? 'ok' : 'manquante'} · jetons ${tokens ? 'présents' : 'absents'}`,
    'node scripts/audit-plan.mjs',
  );
}

/* §5.1 — une seule bibliothèque d'icônes ------------------------------------ */
{
  const lucide = walk('app', /\.tsx$/).concat(walk('src', /\.tsx$/)).filter((f) => /lucide-react/.test(read(f)));
  const total = walk('app', /\.tsx$/).length + walk('src', /\.tsx$/).length;
  record(
    'C12',
    '§5.1',
    'Une seule bibliothèque d’icônes (Hugeicons)',
    lucide.length === 0 ? 'PASS' : 'PARTIAL',
    `${total - lucide.length}/${total} fichiers sans Lucide · ${lucide.length} à migrer`,
    'grep -rIl "lucide-react" --include=*.tsx app src | wc -l',
  );
}

/* §4.4 — accent tiré de l'image --------------------------------------------- */
{
  const threeRoles = /accentSecondary/.test(imageAccent) && /tint/.test(imageAccent);
  const guard = /IMAGE_TIMEOUT_MS/.test(imageAccent) && /setTimeout/.test(imageAccent);
  const textChoice = /export function bestTextOn/.test(imageAccent);
  record(
    'C13',
    '§4.4',
    'Accent d’image : trois rôles, texte choisi par contraste, pas de promesse pendante',
    threeRoles && guard && textChoice ? 'PASS' : 'FAIL',
    `3 rôles: ${threeRoles} · garde-fou de chargement: ${guard} · texte au ratio: ${textChoice}`,
    'npx vitest run tests/design/image-accent.test.ts',
  );
}

/* §11.2 — couverture des tests de thème ------------------------------------- */
{
  const files = walk('tests/design', /\.test\.ts$/);
  const source = files.map((f) => read(f)).join('\n');
  const topics = {
    'contrat de jetons': /jetons — format/,
    'pont --color-*': /cohérence du pont/,
    'contrastes mesurés': /contrastes mesurés/,
    'alpha Tailwind': /alpha Tailwind/,
    couleurs_en_dur: /couleurs en dur/,
    'accent d’image': /bestTextOn/,
    coquille: /coquille bureau/,
  };
  const covered = Object.entries(topics).filter(([, re]) => re.test(source)).map(([k]) => k);
  const missing = Object.keys(topics).filter((k) => !covered.includes(k));
  record(
    'C14',
    '§11.2',
    'Chaque famille de contrat a un test dédié',
    missing.length === 0 ? 'PASS' : 'FAIL',
    `${files.length} fichiers · ${covered.length}/${Object.keys(topics).length} familles couvertes${missing.length ? ' · manque: ' + missing.join(', ') : ''}`,
    'npx vitest run tests/design',
  );
}

/* §0 — libellés français ----------------------------------------------------- */
{
  const fr = read('src/i18n/locales/fr.ts');
  const en = read('src/i18n/locales/en.ts');
  const required = [
    'brandHome', 'newSession', 'expandRail', 'collapseRail',
    'reducedTransparency', 'reducedTransparencyHint', 'highContrast', 'highContrastHint',
  ];
  const missingFr = required.filter((k) => !new RegExp(`\\b${k}:`).test(fr));
  const missingEn = required.filter((k) => !new RegExp(`\\b${k}:`).test(en));
  record(
    'C15',
    '§0',
    'Les libellés ajoutés existent en français et en anglais',
    missingFr.length === 0 && missingEn.length === 0 ? 'PASS' : 'FAIL',
    `fr manquants: ${missingFr.length ? missingFr.join(', ') : 'aucun'} · en manquants: ${missingEn.length ? missingEn.join(', ') : 'aucun'}`,
    'npx vitest run tests/unit/i18n/parity.test.ts',
  );
}

/* §4.6 — signatures / presets ------------------------------------------------ */
{
  const presets = new Set(presetBlocks.map((b) => b.name)).size;
  const gradients = countMatches(read('src/theme/tweakcn-presets.ts'), /className: 'grad-/g);
  const themes = countMatches(read('src/theme/theme-catalog.ts'), /motif:/g);
  record(
    'C16',
    '§4.6',
    'Registres de thèmes : presets, dégradés et thèmes image déclarés une seule fois',
    presets >= 20 && gradients >= 10 && themes >= 100 ? 'PASS' : 'FAIL',
    `${presets} presets · ${gradients} dégradés · ${themes} thèmes image`,
    'grep -c "motif:" src/theme/theme-catalog.ts',
  );
}

/* --------------------------------------------------- non vérifiable ici ---- */

const unverifiable = [
  {
    id: 'U01',
    section: '§11.3',
    label: 'Rendu visuel réel aux largeurs 390 / 768 / 1024 / 1440 px',
    reason: 'Aucun navigateur ni outil de capture dans l’environnement de développement.',
  },
  {
    id: 'U02',
    section: '§11.3',
    label: 'Absence de débordement horizontal et positions réelles',
    reason: 'jsdom ne calcule pas de mise en page ; seule l’inspection à l’écran peut le prouver.',
  },
  {
    id: 'U03',
    section: '§4.5',
    label: 'Rendu effectif du verre (backdrop-filter) sur les cartes',
    reason: 'Le CSS est prouvé, l’effet composité ne l’est pas sans moteur de rendu.',
  },
  {
    id: 'U04',
    section: '§7',
    label: 'Parcours métier complets (mémorisation, révisions) sur données réelles',
    reason: 'Les jeux bibliques multi-traductions sont absents du poste (données non versionnées).',
  },
];

/* ------------------------------------------------------------------- sortie */

const counts = results.reduce(
  (acc, r) => ({ ...acc, [r.verdict]: (acc[r.verdict] ?? 0) + 1 }),
  {},
);
const strict = results.filter((r) => r.verdict === 'FAIL');

if (JSON_ONLY) {
  console.log(JSON.stringify({ results, unverifiable, counts }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log('\nAUDIT DU PLAN — VersyFlow\n');
  console.log(`${pad('ID', 5)}${pad('§', 8)}${pad('VERDICT', 10)}CONTRÔLE`);
  console.log('─'.repeat(96));
  for (const r of results) {
    console.log(`${pad(r.id, 5)}${pad(r.section, 8)}${pad(r.verdict, 10)}${r.label}`);
    console.log(`${' '.repeat(23)}${r.detail}`);
  }
  console.log('\nNon vérifiable dans cet environnement :');
  for (const u of unverifiable) console.log(`  ${u.id} ${u.section} ${u.label}\n     → ${u.reason}`);
  console.log(
    `\nBilan : ${counts.PASS ?? 0} PASS · ${counts.PARTIAL ?? 0} PARTIEL · ${counts.FAIL ?? 0} FAIL · ${unverifiable.length} non vérifiable(s)`,
  );
}

if (!JSON_ONLY) {
  const lines = [
    '# Rapport d’audit — plan « Interface web + thèmes »',
    '',
    'Généré par `node scripts/audit-plan.mjs`. **Ne pas éditer à la main.**',
    `Exécuté le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} (UTC).`,
    '',
    `**Bilan : ${counts.PASS ?? 0} PASS · ${counts.PARTIAL ?? 0} PARTIEL · ${counts.FAIL ?? 0} FAIL · ${unverifiable.length} non vérifiable(s).**`,
    '',
    '| ID | § | Verdict | Contrôle | Mesure |',
    '| --- | --- | --- | --- | --- |',
    ...results.map((r) => `| ${r.id} | ${r.section} | **${r.verdict}** | ${r.label} | ${r.detail} |`),
    '',
    '## Non vérifiable ici',
    '',
    '| ID | § | Élément | Raison |',
    '| --- | --- | --- | --- |',
    ...unverifiable.map((u) => `| ${u.id} | ${u.section} | ${u.label} | ${u.reason} |`),
    '',
    '## Commandes de preuve',
    '',
    ...results.filter((r) => r.proof).map((r) => `- ${r.id} : \`${r.proof}\``),
    '',
  ];
  writeFileSync(join(root, 'docs/plan/audit-report.md'), lines.join('\n'));
  console.log('\nRapport écrit → docs/plan/audit-report.md');
}

process.exit(strict.length === 0 ? 0 : 1);
