/**
 * Contrat « TOUS LES ÉCRANS SUIVENT LE THÈME ».
 *
 * Les écrans premium (Accueil, Explorer, Progrès, Réglages, Profil, Bible) ont
 * été dessinés avec le thème ; les ~80 écrans « profonds » (révisions,
 * collections, analyse, recherche, onboarding, semantic…) étaient écrits
 * AVANT, avec des matériaux littéraux (`bg-surface` + `shadow-sm`), des
 * polices en dur (`Georgia,serif`) et des encres d'état recopiées.
 *
 * Ce fichier verrouille les décisions qui font que ces écrans suivent le
 * thème actif — preset clair/sombre, fond image, contraste élevé — sans
 * qu'on ait eu à réécrire 15 000 lignes de JSX :
 *
 *   1. sur fond image, les jetons de surface DEViennent translucides ;
 *   2. les cartes historiques reçoivent le matériau premium (liseré, ombre) ;
 *   3. aucune police n'est écrite en dur : `Georgia` n'existe que comme
 *      repli de `--font-serif` (le preset choisit Lora, Playfair, …) ;
 *   4. l'encre posée sur une surface d'état vient de `--on-status` ;
 *   5. une carte premium n'écrit pas de titre sans-serif gras.
 *
 * Les commentaires CSS sont retirés avant toute assertion : une règle citée
 * dans un commentaire ne doit jamais faire passer un test.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** Retire les commentaires CSS (`/* … *&#47;`). */
function stripCssComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Retire les commentaires de code (`/* … *&#47;` et `// …`). */
function stripCodeComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const globals = stripCssComments(read('src/styles/globals.css'));

/** Sources d'interface (hors écrans de développement). */
function uiSources(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(root, rel)).isDirectory()) {
        if (['__dev', 'locales', 'node_modules', 'dev'].includes(entry)) continue;
        walk(rel);
      } else if (/\.tsx$/.test(entry)) {
        out.push({ path: relative(root, join(root, rel)), text: read(rel) });
      }
    }
  };
  walk('app');
  walk('src/components');
  return out;
}

const sources = uiSources();

/** Un sélecteur précis du fichier de thème, commentaires retirés. */
function cssHas(selector: string, declaration: RegExp): boolean {
  const index = globals.indexOf(selector);
  if (index === -1) return false;
  const block = globals.slice(index, globals.indexOf('}', index));
  return declaration.test(block);
}

describe('thème — les surfaces historiques suivent le fond actif', () => {
  it('sur fond image, la surface n’est plus un blanc opaque', () => {
    // Le fichier contient plusieurs blocs `html[data-bg='image']` : on cherche
    // celui qui porte les jetons de surface, pas le premier venu.
    expect(globals).toMatch(
      /html\[data-bg='image'\][\s\S]{0,120}?--color-surface:\s*rgba\(var\(--gc-rgb\),\s*\.93\)/,
    );
    expect(globals).toMatch(
      /html\[data-bg='image'\][\s\S]{0,120}?--color-surface-tint:\s*color-mix\(/,
    );
  });

  it('les cartes `bg-surface` reçoivent le liseré et l’ombre du thème', () => {
    expect(globals).toMatch(
      /\.app-canvas[\s\S]{0,240}?\.bg-surface:is\(\[class~='shadow-sm'\][\s\S]{0,400}?border:\s*1px solid var\(--color-border\)/,
    );
    expect(globals).toMatch(
      /\.app-canvas[\s\S]{0,240}?\.bg-surface:is\(\[class~='shadow-sm'\][\s\S]{0,400}?box-shadow:\s*inset 0 1px 0 var\(--hi\)/,
    );
  });

  it('sur fond image, ces mêmes cartes deviennent du verre', () => {
    expect(globals).toMatch(
      /html\[data-bg='image'\][\s\S]{0,200}?\.app-canvas[\s\S]{0,240}?\.bg-surface:is\([\s\S]{0,320}?backdrop-filter:\s*blur\(var\(--gb\)\)/,
    );
  });

  it('transparence réduite et contraste élevé rendent le verre plein', () => {
    expect(globals).toMatch(
      /prefers-reduced-transparency:\s*reduce[\s\S]{0,400}?\.bg-surface[\s\S]{0,400}?background-color:\s*var\(--gc\)/,
    );
    expect(globals).toMatch(
      /data-transparency='reduced'[\s\S]{0,200}?\.bg-surface[\s\S]{0,400}?background-color:\s*var\(--gc\)/,
    );
  });

  it('les tuiles à sélection (`border-2`) ne sont pas repeintes', () => {
    const rule = globals.slice(globals.indexOf(".app-canvas :is(div,article,section,li,button,a).bg-surface"));
    const selectorEnd = rule.indexOf('{');
    expect(rule.slice(0, selectorEnd)).toMatch(/not\(\[class\*='border-'\]\)/);
  });
});

describe('thème — typographie', () => {
  it('aucune police serif n’est écrite en dur hors du repli de `--font-serif`', () => {
    const bare = globals.replace(/var\(--font-serif,[^)]*\)/g, '');
    const bareReading = bare.replace(/var\(--reading-font-family[^)]*\)/g, '');
    // « Georgia » ne doit apparaître que comme repli d'une variable.
    const georgia = bareReading.match(/Georgia/g) ?? [];
    expect(georgia.length).toBe(0);
  });

  it('le titre d’une carte premium reprend la serif du preset', () => {
    expect(globals).toMatch(
      /:is\(\.g1,\s*\.g2,\s*\.g3\)\s*:is\(h2,\s*h3\)[\s\S]{0,200}?font-family:\s*var\(--font-serif,\s*Georgia\)/,
    );
  });

  it('les micro-capitales restent en sans-serif (libellés, pas titres)', () => {
    const rule = globals.slice(globals.indexOf('.section-label,'));
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/font-family:\s*var\(--font-sans,\s*Inter\)/);
    expect(globals).toMatch(
      /:is\(h1,\s*h2,\s*h3\):not\(\.section-label\):not\(\.stat-label\)/,
    );
  });
});

describe('thème — encre des états', () => {
  it('un fond d’état qui porte du texte reçoit l’encre `text-on-status`', () => {
    const offenders: string[] = [];
    // On raisonne sur les LITTÉRAUX de classe (une seule chaîne) : un fond
    // d'état pleine saturation qui porte du texte doit nommer son encre.
    const literal = /[^'"`\n]{0,240}bg-(error|success|warning|info)\b(?![\w/-])[^'"`\n]{0,240}/g;
    const hasText = /\btext-(3xs|2xs|xs|sm|base|lg|xl|\[)/;
    for (const { path, text } of sources) {
      const code = stripCodeComments(text);
      for (const match of code.matchAll(literal)) {
        const fragment = match[0];
        if (!hasText.test(fragment)) continue; // pastille/icône décorative
        if (fragment.includes('text-on-status')) continue;
        offenders.push(`${path}: ${fragment.trim().slice(0, 120)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('aucun écran ne peint son encre d’état avec `--on`', () => {
    const offenders = sources.filter(({ text }) =>
      /text-\[color:var\(--on\)\]/.test(stripCodeComments(text)),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });
});

describe('thème — une seule icône d’état vide', () => {
  it('l’état vide vient de `EmptyState`, pas d’un emoji de circonstance', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}]/u;
    const offenders = sources
      .filter(({ path }) => path.startsWith('app/'))
      .filter(({ text }) => emoji.test(stripCodeComments(text)))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});

describe('thème — aucun contrôle décoratif', () => {
  /** Extrait la balise ouvrante `<button …>` en respectant les accolades. */
  function buttonTags(code: string): { tag: string; index: number }[] {
    const out: { tag: string; index: number }[] = [];
    const re = /<button\b/g;
    for (const m of code.matchAll(re)) {
      let depth = 0;
      let quote: string | null = null;
      let i = m.index! + 7;
      for (; i < code.length; i += 1) {
        const ch = code[i];
        if (quote) {
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
        else if (ch === '>' && depth === 0) break;
      }
      out.push({ tag: code.slice(m.index!, i + 1), index: m.index! });
    }
    return out;
  }

  it('aucun `<button>` sans action : un contrôle mort est pire qu’un contrôle absent', () => {
    const dead: string[] = [];
    for (const { path, text } of sources) {
      const code = stripCodeComments(text);
      for (const { tag, index } of buttonTags(code)) {
        if (/onClick|onSubmit|onPointerDown|type="submit"|type=\{['"]submit/.test(tag)) continue;
        // Un bouton piloté par un parent (`<Field button={…}>`) reste valide.
        if (/disabled|aria-disabled/.test(tag)) continue;
        const line = code.slice(0, index).split('\n').length;
        dead.push(`${path}:${line} ${tag.replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    }
    expect(dead).toEqual([]);
  });

  it('un interrupteur se déclare `role="switch"` et vit dans une seule primitive', () => {
    // Deux implémentations seulement : la primitive web et le shim
    // react-native-web (`Primitives.tsx`) qui partage la même API.
    const declaring = sources
      .filter(({ text }) => /role="switch"/.test(stripCodeComments(text)))
      .map(({ path }) => path);
    expect(declaring.sort()).toEqual([
      'src/components/ui/Primitives.tsx',
      'src/components/ui/Switch.tsx',
    ]);
    const shared = read('src/components/ui/Switch.tsx');
    expect(shared).toContain('role="switch"');
    expect(shared).toContain('aria-checked={checked}');
  });
});

describe('thème — une seule échelle de titres', () => {
  it('les titres d’écran passent par `.page-title` / `.page-title-lg`', () => {
    const offenders: string[] = [];
    for (const { path, text } of sources) {
      const code = stripCodeComments(text);
      for (const m of code.matchAll(/<h1[^>]*className="([^"]*)"/g)) {
        if (path.includes('__dev')) continue;
        const cls = m[1];
        if (/page-title/.test(cls)) continue;
        // Deux échelles légitimes : le logotype de l'écran de démarrage et le
        // titre « display » de l'onboarding (38 px, une seule fois par écran).
        if (path.endsWith('app/splash.tsx')) continue;
        if (/\btext-display\b/.test(cls)) continue;
        // Titre de barre d'outils d'une séance (18 px, tronqué) : ce n'est pas
        // un titre d'écran, c'est le rappel du contexte de la séance.
        if (/\btruncate\b/.test(cls) && /\btext-lg\b/.test(cls)) continue;
        // Les héros de l'accueil, l'explorateur, la progression et le profil
        // ont leur propre échelle (CSS dédiée) : ils titrent une section, pas
        // un écran.
        if (/\b(home-|explore-|progress-|settings-|profile-)\w*/.test(cls)) continue;
        offenders.push(`${path}: ${cls}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('l’échelle des titres est fluide, pas une taille fixe par écran', () => {
    expect(globals).toMatch(/\.page-title\s*\{[\s\S]{0,200}?font-size:\s*clamp\(/);
    expect(globals).toMatch(/\.page-title-lg\s*\{[\s\S]{0,200}?font-size:\s*clamp\(/);
  });
});
