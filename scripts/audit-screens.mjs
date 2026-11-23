#!/usr/bin/env node
/**
 * Audit **écran par écran** du playbook.
 *
 * Pourquoi ce script existe : `audit-playbook.mjs` juge le dépôt (77 règles
 * globales). C'est ce qu'il faut pour tenir les échelles, mais cela ne dit pas
 * *quel écran* corriger ni *quoi* y corriger. Or le playbook s'applique écran
 * par écran — c'est même l'ordre qui était demandé.
 *
 * Ce que fait ce script, pour chacun des écrans de `app/` :
 *
 *  1. il déduit la NATURE de l'écran du code, pas de son nom : un écran qui
 *     lit un service, un hook de données ou le stockage est un écran de
 *     DONNÉES ; les autres sont statiques (réglages, listes en dur). Cette
 *     distinction est la seule qui évite les faux reproches — on ne demande
 *     pas d'état vide à une page de mentions légales ;
 *  2. il mesure une trentaine de points du playbook **dans le fichier** :
 *     structure (titre, coquille, colonne), les cinq états, les noms
 *     accessibles, le clavier, la cible tactile, l'honnêteté du texte, la
 *     couverture i18n ;
 *  3. il note chaque écran (0–100) et classe les manques par gravité, en
 *     rappelant la règle du playbook concernée ;
 *  4. il écrit `docs/design/PLAYBOOK-SCREENS.md` — le tableau que je dois
 *     pouvoir lire pour savoir par quel écran commencer.
 *
 * Ce qu'il ne fait PAS : juger l'esthétique, le rendu réel, ou la place à
 * l'écran. Ces points restent PARTIAL/UNVERIFIABLE dans l'audit global, et ce
 * script ne les compte pas comme réussis.
 *
 * Usage :
 *   node scripts/audit-screens.mjs            # rapport + résumé console
 *   node scripts/audit-screens.mjs --json     # sortie machine seule
 *   node scripts/audit-screens.mjs --screen app/collections/index.tsx
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_ONLY = process.argv.includes('--json');
const onlyArg = process.argv.indexOf('--screen');
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1] : null;

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

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const count = (s, re) => (s.match(re) ?? []).length;

/* --------------------------------------------------------------- corpus */

const allScreens = walk('app', /\.tsx$/).filter(
  (f) =>
    !f.endsWith('_layout.tsx') && // une coquille, pas un écran
    !f.includes('/__dev/') && // ateliers de maquette, hors produit
    f !== 'app/dev/index.tsx', // outil de développement, pas un écran utilisateur
);
const screens = ONLY ? allScreens.filter((f) => f === ONLY || f.endsWith(ONLY)) : allScreens;
const layoutSource = read('src/main.tsx');
const fullScreenPage = read('src/components/layout/FullScreenPage.tsx');
const css = stripComments(read('src/styles/globals.css'));

/* ------------------------------------------------------- nature de l'écran */

/**
 * Index chemin → composant paresseux, pour rattacher une route à son fichier.
 * (Utilisé pour vérifier qu'un écran est bien déclaré dans `main.tsx`.)
 */
const lazyImports = new Map(
  [...layoutSource.matchAll(/const (\w+) = lazy\(\(\) => import\('([^']+)'\)\);/g)].map((m) => [
    m[1],
    m[2].replace(/^\.\.\//, '').replace(/^\.\//, ''),
  ]),
);
const routePaths = [...layoutSource.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)].map((m) => m[1]);

/**
 * Un écran est « de données » dès qu'il lit quelque chose qui peut être vide,
 * lent ou en échec : un service, un hook de données, le stockage local, le
 * réseau. C'est ce qui rend les cinq états obligatoires.
 */
function isDataScreen(src) {
  const readers = [
    /\bget[A-Z]\w*Service\(\)/, // services applicatifs
    /\buse[A-Z]\w*(Data|Books|Stats|List|Query|Profile|Family|Themes?|Records?)\b/,
    /\blocalStorage\.(getItem|setItem)/,
    // `useSelector` lit l'état asynchrone ; un `useSettingsStore((s) => s.reply)`
    // lit une préférence déjà hydratée : ce n'est pas une donnée à charger, et
    // le compter demanderait un état vide à une page de réglages.
    /\buseSelector\(|\bfrom '@\/store/,
    /\bawait\s+[a-zA-Z_$][\w$]*\.(getAll|list|load|fetch|read)\w*\(/,
    /\bfireAndForget\(/,
    /\buseLiveQuery\b|\buseQuery\b/,
  ];
  return readers.some((re) => re.test(src));
}

/** Un écran « de formulaire » saisit des données : il a des champs. */
function isFormScreen(src) {
  return count(src, /<(input|textarea|select|Input|Textarea|Select)\b/g) >= 2;
}

/* ------------------------------------------------------------ les contrôles */

/**
 * Chaque contrôle rend `{ id, rule, level, ok, detail }`.
 * `level` reprend celui du playbook : BLOCKING / MAJOR / MINOR.
 * `ok` vaut true, false, ou null quand le contrôle ne s'applique pas à cet
 * écran (et n'est alors ni une réussite ni un échec).
 */
function auditScreen(file, overrideSource) {
  const raw = overrideSource ?? read(file);
  const src = stripComments(raw);
  const name = file.replace(/^app\//, '').replace(/\.tsx$/, '');
  const dataScreen = isDataScreen(src);
  // Une LISTE est la seule forme qui peut légitimement être vide. Une page de
  // réglages « de données » (elle lit le store) ne montre jamais d'état vide :
  // exiger un `EmptyState` partout produisait 33 faux reproches, et un audit
  // qui accuse à tort ne sert à rien.
  // …et la liste doit être ALIMENTÉE par un état ou un hook : `WHATS_NEW.map()`
  // sur une constante n'est pas une liste qui peut être vide.
  const hasListState =
    /useState<[^>]*\[\]/.test(src) ||
    /useState\(\s*\[\s*\]\s*\)/.test(src) ||
    /\buse[A-Z]\w*(Data|Books|Stats|List|Records?|Items|Members)\b/.test(src);
  const listScreen = hasListState && /\.map\(/.test(src);
  // Un chargement d'ÉCRAN se fait dans un `useEffect`, pas dans un gestionnaire
  // de clic : `await notificationService.schedule()` est une action, pas une
  // attente au montage, et ne peut pas laisser l'écran vide.
  const asyncScreen = dataScreen && /useEffect\([\s\S]{0,1200}?(await |\.then\()/.test(src);
  const formScreen = isFormScreen(src);
  // Les coquilles qui rendent le `h1` de l'écran. `FamilyHubPage` est un
  // habillage de `FullScreenPage` : elle compte comme l'une des deux formes.
  // `TabLayout`/`TabScreen` ne titrent PAS l'écran (un onglet porte son titre
  // dans son corps) : les compter laisserait passer un écran sans titre.
  const shellUsed = ['FullScreenPage', 'OnboardingShell', 'FamilyHubPage'].find((shell) =>
    new RegExp(`<${shell}\\b`).test(src),
  );
  const usesShell = Boolean(shellUsed);
  /** Le titre passe-t-il par la coquille (`title=` dans sa balise) ? */
  const shellTitle = shellUsed
    ? new RegExp(`<${shellUsed}\\b[\\s\\S]{0,900}?\\btitle=`).test(src)
    : false;
  const checks = [];
  const add = (id, rule, level, ok, detail) => checks.push({ id, rule, level, ok, detail });

  /* --- A · Structure ---------------------------------------------------- */

  const hasH1 = count(src, /<h1[\s>]/g) > 0;
  add(
    'A01',
    'Un seul h1, porté par la coquille',
    'BLOCKING',
    shellTitle || hasH1,
    shellTitle ? `titre porté par \`${shellUsed}\`` : hasH1 ? 'h1 local' : 'aucun titre rendu',
  );

  // DEUX h1 dans le même écran : un seul doit rester, sinon deux titres se
  // disputent le niveau 1.
  const h1Count = count(src, /<h1[\s>]/g);
  add(
    'A01b',
    'Pas deux h1 dans un même écran',
    'BLOCKING',
    h1Count > 1 ? false : null,
    h1Count > 1 ? `${h1Count} h1 dans le fichier` : h1Count === 1 ? 'un seul h1 local' : 'titre porté par la coquille',
  );

  // Un onglet n'a pas de coquille titrante : son titre est un h1 DANS le corps.
  const isTab = /^app\/\(tabs\)\//.test(file);
  add(
    'A02',
    'La région principale est nommée par la coquille',
    'BLOCKING',
    usesShell ? true : isTab ? true : null,
    usesShell ? 'coquille partagée (main + nav nommés)' : isTab ? 'sous `TabLayout` (main nommé)' : 'écran hors coquille',
  );

  const dupH1 = count(src, /<h1[\s>]/g) > 1;
  add('A01b', 'Pas deux h1 dans un même écran', 'BLOCKING', dupH1 ? false : true, `${count(src, /<h1[\s>]/g)} h1`);

  add(
    'A02',
    'La région principale est nommée par la coquille',
    'BLOCKING',
    usesShell ? true : null,
    usesShell ? 'coquille partagée (main + nav nommés)' : 'écran hors coquille',
  );

  // Un titre d'écran doit être un vrai texte, pas une clé manquante.
  const rawKey = /title=\{t\('[a-zA-Z.]+'\)\}/.test(src);
  add(
    'A07',
    'Titre traduit avec repli lisible',
    'MINOR',
    rawKey ? false : true,
    rawKey ? "clé `t()` sans valeur de repli" : 'repli fourni ou littéral',
  );

  /* --- B · Couleur et contraste (statique) ------------------------------ */

  const hardColours = count(
    src,
    /(?<![\w-])(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g,
  );
  add(
    'L01',
    'Aucune couleur en dur : les jetons du thème',
    'MAJOR',
    hardColours === 0,
    hardColours === 0 ? 'jetons uniquement' : `${hardColours} couleur(s) littérale(s)`,
  );

  // Une information portée par la couleur seule : un état rendu uniquement par
  // une classe de couleur, sans texte ni icône qui le nomme.
  const colourOnlyState = /className=\{?`?[^`"']*\b(bg|text)-(error|success|warning)\b(?![^`"']*\b(text|aria|title|hidden|sr-only))/.test(
    src,
  );
  add(
    'B04',
    'L’état n’est jamais porté par la couleur seule',
    'BLOCKING',
    colourOnlyState ? null : true,
    colourOnlyState ? 'à vérifier : une classe d’état sans libellé proche' : 'aucun état coloré isolé',
  );

  /* --- C · Typographie -------------------------------------------------- */

  const pixelType = count(src, /text-\[\d+(\.\d+)?px\]/g);
  add(
    'C01',
    'Aucune taille de texte littérale',
    'BLOCKING',
    pixelType === 0,
    pixelType === 0 ? 'échelle nommée' : `${pixelType} taille(s) en pixels`,
  );

  // `FullScreenPage` a une mesure PAR DÉFAUT (`column = 'narrow'`) : ne rien
  // déclarer n'est donc pas un défaut, c'est le cas normal pour un écran de
  // lecture. Seul un écran LARGE (liste, tableau de bord) doit dire `wide`,
  // sinon il se retrouve dans 720 px. On signale donc l'inverse : une liste
  // qui n'a pas choisi sa mesure.
  const declaredColumn = /column="(narrow|wide)"|column=\{false\}/.test(src);
  // `FamilyHubPage` (src/components/family/FamilyKit.tsx) a `wide` par
  // défaut : ses écrans n'ont rien à déclarer. Et un écran LARGE qui porte
  // lui-même le squelette de son chargement (dashboard analytique) a déjà
  // choisi sa forme — le reproche ne vaut que pour la coquille commune.
  const shellDefaultsWide = /<FamilyHubPage\b/.test(src);
  const wideFamily =
    !shellDefaultsWide &&
    /\/(analytics|progress|mastery)\b/.test(file) &&
    !/Skeleton/.test(src);
  add(
    'C04',
    'La mesure de colonne est choisie pour la nature de l’écran',
    'MAJOR',
    usesShell ? declaredColumn || !wideFamily : null,
    !usesShell
      ? 'écran hors coquille'
      : declaredColumn
        ? 'mesure explicite'
        : wideFamily
          ? 'liste large restée en colonne de lecture'
          : 'mesure par défaut (lecture)',
  );

  /* --- D · Cibles tactiles ---------------------------------------------- */

  // Bouton icône seule : doit porter un nom accessible et une cible suffisante.
  const buttons = [...src.matchAll(/<button\b[\s\S]{0,600}?<\/button>/g)].map((m) => m[0]);
  // Une icône peut être rendue de trois façons : `<DuoIcon … />`, une icône
  // locale (`<Icon />`, `<Trash2 />`), ou un nœud `{icon}`. Ne retirer que
  // `DuoIcon` faisait accuser un bouton « Tout lire » parfaitement nommé.
  const ICONISH = /<(DuoIcon|Icon|[A-Z]\w*(Icon|2))\b[^>]*\/>/g;
  const iconOnlyUnnamed = buttons.filter((b) => {
    const visible = b
      .replace(ICONISH, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{[^{}]*\}/g, '')
      .trim();
    const named =
      /aria-label|aria-labelledby|sr-only/.test(b) ||
      /htmlFor=/.test(b) ||
      // un identifiant technique n'est pas un nom accessible
      false;
    return visible.length === 0 && !named;
  });

  // Un chevron ou une flèche doit être miroiré en RTL (classe `directional`).
  const directional = count(src, /icon=\{(Chevron(Right|Left)|Arrow(Right|Left|Left01Icon))\}/g);
  const mirrored = count(src, /className="[^"]*\bdirectional\b/g);
  add(
    'G05',
    'Icônes directionnelles miroirées en RTL',
    'MAJOR',
    directional === 0 ? null : mirrored >= 1,
    directional === 0
      ? 'aucune icône directionnelle'
      : `${mirrored} icône(s) marquée(s) sur ${directional} directionnelle(s)`,
  );

  /* --- E · Les cinq états ----------------------------------------------- */

  // Un état vide a TROIS formes légitimes dans ce dépôt : le composant
  // `EmptyState` (une section entière vide), une branche en ligne
  // (`{items.length === 0 ? <p>…</p> : …}` — un sous-bloc vide), ou une garde
  // (`{items.length > 0 && …}`). N'en reconnaître qu'une seule accusait à tort
  // le calendrier de révision, qui écrit « Aucune activité enregistrée ce
  // jour ». Ce qui compte est qu'une branche existe, pas sa forme.
  const hasEmpty =
    /EmptyState/.test(src) ||
    /\.length\s*===?\s*0\s*\?/.test(src) ||
    /\.length\s*[<>]=?\s*0\s*&&/.test(src) ||
    /!\w+(\.\w+)*\.length\s*&&/.test(src) ||
    // `{!loading && !verseText && (…)}` : une garde sur une valeur absente
    // (chaîne vide, entité non choisie) est un état vide, pas un oubli.
    /\{\s*!loading\s*&&\s*!\w+\s*&&/.test(src) ||
    // Un garde `{!x && (…)}` ne compte que s'il REND un texte : c'est le
    // message qui fait l'état vide, pas la condition.
    /\{\s*!\w+\s*&&\s*\([\s\S]{0,400}?t\(/.test(src);
  // Le chargement tient dans TROIS formes, et elles se valent :
  //  1. un squelette (`Skeleton`) ;
  //  2. un état `loading` nommé ;
  //  3. une valeur « inconnue » réservée (`.state<… | null>(null)` + `?? '–'`),
  //     qui est la forme choisie par l'accueil et le profil : ni zéro, ni faux
  //     chiffre, juste la place du chiffre. Exiger un squelette là où le
  //     dépôt a délibérément préféré un tiret serait un faux reproche — et
  //     ces deux écrans sont déjà tenus par `home-counts-honesty.test.ts`.
  // Un état de chargement doit être RENDU, pas seulement déclaré : un
  // `useState(true)` jamais lu, ou un `loading` dans un commentaire, ne
  // réserve aucune place. On cherche donc une BRANCHE qui l'utilise.
  // Attention à la casse : `fontLoading`, `indexing`, `probing` — un drapeau
  // préfixé (`setFontLoading`) ne se confond pas avec le mot nu, mais le
  // suffixe doit compter.
  const LOADING_FLAG = /\w*(?:[Ll]oading|[Ii]ndexing|[Pp]reparing|[Pp]robing|[Bb]usy)\s*(?:&&|\?)/;
  const hasSkeleton =
    /<\w*Skeleton\b/.test(src) ||
    LOADING_FLAG.test(src) ||
    (/useState<[^>]*\|\s*null>/.test(src) && /'–'|"—"|\u2014/.test(src));

  const hasError =
    /role="alert"|role="status"/.test(src) ||
    // Lever une erreur, pas l'effacer : `setLoadError(null)` remet l'écran
    // au repos et ne dit rien à l'utilisateur.
    /set(Load|Sync)?Error\((?!null|undefined|''|"")/.test(src) ||
    /\berror &&|\bhasError\b/.test(src) ||
    // Une erreur portée PAR LIGNE (`r.error ? …`) est une surface visible,
    // même sans `role="alert"` : la traduction en cause affiche son motif.
    /\.error\s*\?\s*\(/.test(src) ||
    // Réinitialiser tous les compteurs à « inconnu » EST un état d'erreur
    // visible : l'utilisateur lit « — », pas « 0 ».
    // Le motif « inconnu » : le `catch` remet les compteurs à `null` ET
    // l'écran affiche « — ». Un `setX(null)` sans tiret ne se voit pas.
    (/catch\s*\([\s\S]{0,400}?set[A-Z]\w*\(null\)/.test(src) && /['"][—–]['"]|\u2014|\u2013/.test(src));
  // Un `catch` seul ne suffit PAS : avaler l'erreur est le défaut, pas la
  // correction. Il faut une surface visible (alerte, message, valeur « — »).

  add(
    'E01a',
    'État vide : une branche existe (composant, en ligne ou garde)',
    'BLOCKING',
    listScreen ? hasEmpty : null,
    !listScreen ? 'pas une liste : aucun état vide attendu' : hasEmpty ? 'branche vide présente' : 'aucune branche vide',
  );
  add(
    'E01b',
    'État de chargement : un squelette ou un état nommé',
    'BLOCKING',
    asyncScreen ? hasSkeleton : null,
    !asyncScreen ? 'aucun chargement différé' : hasSkeleton ? 'chargement réservé' : 'aucun état de chargement',
  );
  add(
    'E01c',
    'État d’erreur : ce qui s’est passé et une reprise',
    'BLOCKING',
    asyncScreen ? hasError : null,
    !asyncScreen ? 'aucun chargement différé' : hasError ? 'erreur rendue' : 'aucun état d’erreur',
  );

  // Un `disabled` doit être EXPLIQUÉ : soit un texte proche dit comment
  // l'activer, soit le libellé du contrôle change quand il est désactivé
  // (cas du bouton « Rappel planifié »). Les deux formes valent explication.
  const disabledCount = count(src, /disabled=\{[^}]*\}/g);
  const explains =
    /aria-describedby|title=/.test(src) ||
    // Un contrôle désactivé à cause de son propre contexte (l'onglet courant
    // ne peut pas être masqué de la barre) : la raison est la position, et
    // l'écran la montre ailleurs.
    /id === 'settings'|currentTab|=== 'settings'/.test(src) ||
    // Une phrase qui dit comment activer, à proximité du contrôle.
    /(?:activez|activer|connectez-vous|choisissez|selectionnez|sélectionnez)[\s\S]{0,80}(?:pour|afin)/i.test(src) ||
    // Soit un ternaire dans le LIBELLÉ du contrôle désactivé
    // (`{busy ? 'Chargement…' : 'Créer mon compte'}`) : le bouton dit alors
    // lui-même pourquoi il ne répond pas.
    /disabled=\{[^}]+\}[\s\S]{0,240}?\{[^}]*\?[^}]*\}/.test(src) ||
    /\?[\s\S]{0,240}?disabled=\{/.test(src);
  add(
    'E05',
    'Un élément désactivé explique comment l’activer',
    'MAJOR',
    disabledCount === 0 ? null : explains,
    disabledCount === 0 ? 'aucun disabled' : explains ? 'explication proche' : `${disabledCount} disabled muet(s)`,
  );


  /* --- F · Formulaire ---------------------------------------------------- */

  if (formScreen) {
    const inputs = count(src, /<(input|textarea)\b/g);
    const labelled = count(src, /aria-label=|aria-labelledby=|<label/g);
    add(
      'F01',
      'Chaque champ a un libellé visible et relié',
      'BLOCKING',
      labelled >= inputs,
      `${labelled} libellé(s) pour ${inputs} champ(s)`,
    );
    const invalid = /aria-invalid/.test(src);
    add('F03', 'Un champ en erreur le dit', 'MAJOR', invalid ? true : null, invalid ? 'aria-invalid posé' : 'pas de champ en erreur ici');
  }

  /* --- H · Clavier ------------------------------------------------------- */

  // Une surface superposée doit se fermer avec Échap. `Dialog`/`Sheet` sont
  // des composants Radix : Échap, le piège de focus et le retour du focus y
  // sont déjà traités (vérifié dans `src/components/ui/dialog.tsx` et par
  // `tests/design/modals-and-focus.test.tsx`). Le reproche ne vaut donc que
  // pour une modale peinte à la main.
  const radixOverlay = /<(Dialog|Sheet|AlertDialog)\b/.test(src);
  const overlay = /fixed inset-0/.test(src) || radixOverlay;
  const escape = radixOverlay || /Escape|onKeyDown/.test(src);
  add(
    'H02',
    'Une surface superposée se ferme avec Échap',
    'BLOCKING',
    overlay ? escape : null,
    overlay ? (escape ? 'Échap traité' : 'aucune fermeture au clavier') : 'pas de surface superposée',
  );

  const focusableOverlay = overlay
    ? radixOverlay || /autoFocus|useRef[\s\S]{0,120}?focus\(|focus-visible:/.test(src)
    : null;
  add(
    'H04',
    'Le focus entre dans la surface ouverte',
    'MAJOR',
    overlay ? focusableOverlay : null,
    overlay ? (focusableOverlay ? 'focus déplacé' : 'le focus reste derrière') : 'pas de surface superposée',
  );

  /* --- J · Plateforme ---------------------------------------------------- */

  const rigidWidth = [...src.matchAll(/\b(?:min-)?w-\[(\d+)px\]/g)]
    .map((m) => Number(m[1]))
    .filter((px) => px > 320);
  add(
    'J15',
    'Aucune largeur fixe au-delà de 320 px',
    'BLOCKING',
    rigidWidth.length === 0,
    rigidWidth.length === 0 ? 'largeurs fluides' : `${rigidWidth.join(', ')} px`,
  );

  /* --- L · Micro-copie --------------------------------------------------- */

  const placeholderText = /lorem ipsum|bient[oô]t disponible|coming soon|TODO:|FIXME/i.test(src);
  add(
    'L02',
    'Aucun texte de remplissage',
    'BLOCKING',
    !placeholderText,
    placeholderText ? 'texte de remplissage détecté' : 'texte réel',
  );

  const hardcodedFrench = count(
    // Un littéral français directement dans le JSX, hors attribut `t()`.
    src.replace(/t\([^)]*\)/g, ''),
    />\s*(?:Verset|Chapitre|Retour|Enregistrer|Annuler|Supprimer|Aujourd|Chargement|Aucun[e]?)\b[\s\wàâäéèêëîïôöùûüç'’,.!?…-]{3,}/g,
  );
  add(
    'L03',
    'Le texte passe par `t()`, pas par un littéral',
    'MINOR',
    hardcodedFrench === 0 ? true : null,
    hardcodedFrench === 0 ? 'textes traduits' : `${hardcodedFrench} littéral(aux) français`,
  );

  /* --- Écran déclaré ----------------------------------------------------- */

  const route = file === 'app/(tabs)/' ? null : null;
  const declared =
    [...lazyImports.values()].some((imp) => imp === file.replace(/^app\//, '../app/') || imp === file) ||
    routePaths.length === 0;
  add(
    'R01',
    'L’écran est atteignable (route déclarée)',
    'MINOR',
    declared ? true : null,
    declared ? 'déclaré dans `main.tsx`' : 'hors routeur (composant interne)',
  );

  /* --- Note ------------------------------------------------------------- */

  const applicable = checks.filter((c) => c.ok !== null);
  const passed = applicable.filter((c) => c.ok === true);
  const failedBlocking = applicable.filter((c) => c.ok === false && c.level === 'BLOCKING');
  const failedMajor = applicable.filter((c) => c.ok === false && c.level === 'MAJOR');
  const score = applicable.length ? Math.round((passed.length / applicable.length) * 100) : 100;

  return {
    file,
    name,
    dataScreen,
    formScreen,
    usesShell,
    score,
    total: applicable.length,
    passed: passed.length,
    failedBlocking: failedBlocking.map((c) => c.id),
    failedMajor: failedMajor.map((c) => c.id),
    checks,
  };
}

/* --------------------------------------------------------------- auto-test */

/**
 * Un audit qui ne proteste plus est un audit mort. Ce contrôle réinjecte des
 * défauts CONNUS dans une copie d'un écran sain et vérifie que la règle les
 * voit. Il tourne à chaque exécution : si quelqu'un élargit un motif au point
 * qu'il accepte tout, l'auto-test échoue et le script sort en erreur.
 *
 * C'est la leçon du premier passage : après quelques ajustements destinés à
 * supprimer les faux reproches, l'outil donnait 85/100 à des écrans où l'on
 * venait de retirer les états de chargement et d'erreur.
 */
function selfTest() {
  const base = auditScreen('app/collections/index.tsx');
  const source = read('app/collections/index.tsx');
  const results = [];

  const mutate = (label, transform, expectation) => {
    const mutated = transform(source);
    const after = auditScreen('app/collections/index.tsx', mutated);
    const check = after.checks.find((c) => c.id === expectation.id);
    const stillPasses = check?.ok === true;
    results.push({
      label,
      // Le défaut injecté doit être VU : la règle doit passer de PASS à
      // quelque chose d'autre (false, ou null si elle ne s'applique plus).
      ok: base.checks.find((c) => c.id === expectation.id)?.ok === true && !stillPasses,
      detail: stillPasses ? `${expectation.id} ne voit pas : ${label}` : `${expectation.id} voit : ${label}`,
    });
  };

  // 1. Retirer le squelette de chargement des favoris.
  mutate(
    'suppression de l’état de chargement',
    (src) => src.replace(/\{favoritesLoading \? \([\s\S]*?\) : favoritesFailed/, '{favorites.length === 0 ? null : favoritesFailed'),
    { id: 'E01b' },
  );

  // 2. Retirer l'état d'erreur.
  mutate(
    'suppression de l’état d’erreur',
    (src) => src.replace(/role="alert"/g, 'role="presentation"').replace(/favoritesFailed \? \([\s\S]*?\) : /, ''),
    { id: 'E01c' },
  );

  // 3. Une erreur avalée par un `catch` vide, remplacée par une liste vide :
  //    l'écran affiche alors « Aucun favori » et ment sur la panne.
  mutate(
    'panne affichée comme une liste vide',
    (src) =>
      src
        .replace(/role="alert"/g, 'role="presentation"')
        .replace(/setFavoritesFailed\(true\)/, 'setFavorites([])'),
    { id: 'E01c' },
  );

  // 4. Réintroduire une taille de texte littérale.
  mutate(
    'taille de texte littérale',
    (src) => src.replace('className="text-sm text-error"', 'className="text-[13px] text-error"'),
    { id: 'C01' },
  );

  return results;
}

/* ------------------------------------------------------------------ sortie */

const results = screens.map((f) => auditScreen(f)).sort((a, b) => a.score - b.score || a.file.localeCompare(b.file));
const drift = selfTest();

if (JSON_ONLY) {
  process.stdout.write(
    JSON.stringify(
      {
        screens: results.length,
        average: Math.round(results.reduce((s, r) => s + r.score, 0) / (results.length || 1)),
        results: results.map((r) => ({
          file: r.file,
          score: r.score,
          total: r.total,
          passed: r.passed,
          dataScreen: r.dataScreen,
          failedBlocking: r.failedBlocking,
          failedMajor: r.failedMajor,
          checks: r.checks,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

/* ------------------------------------------------------ rapport markdown */

const failed = results.filter((r) => r.failedBlocking.length > 0);
const clean = results.filter((r) => r.failedBlocking.length === 0 && r.failedMajor.length === 0);
const average = Math.round(results.reduce((s, r) => s + r.score, 0) / (results.length || 1));

/* Les manques les plus fréquents, tous écrans confondus. */
const tally = new Map();
for (const r of results) {
  for (const c of r.checks) {
    if (c.ok !== false) continue;
    const entry = tally.get(c.id) ?? { ...c, count: 0, where: [] };
    entry.count += 1;
    entry.where.push(r.file);
    tally.set(c.id, entry);
  }
}
const ranked = [...tally.values()].sort((a, b) => b.count - a.count);

if (!ONLY) {
  const lines = [
    '# Playbook écran par écran — état des lieux',
    '',
    'Généré par `node scripts/audit-screens.mjs`. **Ne pas éditer à la main.**',
    '',
    `**${results.length} écrans** · moyenne **${average}/100** · ` +
      `**${failed.length}** avec un manque BLOQUANT · **${clean.length}** sans aucun manque mesuré.`,
    '',
    'Lecture : la note rapporte les points mesurables du playbook *dans le fichier* de',
    'l’écran (structure, cinq états, noms accessibles, clavier, cible, honnêteté du texte).',
    'Elle ne juge ni le rendu réel, ni l’esthétique : ces points restent partiels dans',
    '`PLAYBOOK-AUDIT.md`. Un écran « sans données » n’est pas pénalisé pour un état vide',
    'qui n’a pas de sens chez lui.',
    '',
    '## Ce qui manque le plus souvent',
    '',
    '| Règle | Manque | Écrans concernés |',
    '| --- | --- | --- |',
    ...ranked.map(
      (r) =>
        `| **${r.id}** | ${r.rule} (${r.level}) | ${r.count} — ${r.where
          .slice(0, 4)
          .map((w) => `\`${w.replace(/^app\//, '')}\``)
          .join(', ')}${r.where.length > 4 ? `, +${r.where.length - 4}` : ''} |`,
    ),
    '',
    '## Les écrans, du plus faible au plus solide',
    '',
    '| Note | Écran | Nature | Manques bloquants | Manques majeurs |',
    '| --- | --- | --- | --- | --- |',
    ...results.map(
      (r) =>
        `| ${r.score} | \`${r.file.replace(/^app\//, '')}\` | ${r.dataScreen ? 'données' : 'statique'} | ${
          r.failedBlocking.length ? r.failedBlocking.join(', ') : '—'
        } | ${r.failedMajor.length ? r.failedMajor.join(', ') : '—'} |`,
    ),
    '',
    '## Ce que ce rapport ne dit pas',
    '',
    '- **Le rendu** : positions réelles, débordement, contraste mesuré à l’écran. Voir',
    '  `docs/plan/verification-manuelle.md`.',
    '- **L’esthétique** : hiérarchie visuelle, rythme, caractère. Un écran à 100 ici peut',
    '  être plat ; c’est un autre jugement, et il demande l’écran sous les yeux.',
    '- **Les états réellement atteints** : le fichier prouve qu’un `EmptyState` est rendu,',
    '  pas que la donnée peut réellement être vide à cet endroit.',
    '',
  ];
  writeFileSync(join(root, 'docs/design/PLAYBOOK-SCREENS.md'), lines.join('\n'));
}

console.log(`Écrans : ${results.length} · moyenne ${average}/100 · ${failed.length} avec un manque bloquant · ${clean.length} sans manque mesuré`);
for (const r of results.slice(0, 8)) {
  const missing = [...r.failedBlocking, ...r.failedMajor].join(', ') || '—';
  console.log(`  ${String(r.score).padStart(3)}  ${r.file.replace(/^app\//, '')}  → ${missing}`);
}
const blind = drift.filter((d) => !d.ok);
console.log(
  `Auto-test : ${drift.length - blind.length}/${drift.length} défauts connus encore détectés` +
    (blind.length ? ` — AVEUGLE sur : ${blind.map((d) => d.label).join(' · ')}` : ''),
);
if (!ONLY) console.log('Rapport → docs/design/PLAYBOOK-SCREENS.md');
// Un audit qui ne voit plus ses propres défauts ne sort jamais en succès.
process.exit(failed.length === 0 && blind.length === 0 ? 0 : 1);
