/**
 * Coquille bureau — tests de contrat.
 *
 * jsdom ne calcule aucune mise en page : une largeur ne se prouve pas en
 * interrogeant un élément. On prouve donc deux choses vérifiables :
 *  1. la feuille de style contient bien la règle attendue (source unique de
 *     la largeur : `--rail`) ;
 *  2. la configuration Tailwind sait fabriquer l'alpha d'une variable CSS —
 *     sans ça, `bg-primary/10` disparaît silencieusement du CSS produit.
 * Et on calcule les contrastes au lieu de les estimer.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESKTOP_MIN_WIDTH } from '@/hooks/useIsDesktop';

const root = process.cwd();
const css = readFileSync(join(root, 'src', 'styles', 'globals.css'), 'utf8');
const tailwind = readFileSync(join(root, 'tailwind.config.js'), 'utf8');
/** Le bloc « coquille bureau » : plusieurs règles `:root` coexistent, on cible le nôtre. */
const shellCss = css.slice(css.indexOf('Coquille bureau'));

/** Extrait le corps d'une règle CSS par son sélecteur exact. */
function ruleBody(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  const close = source.indexOf('}', open);
  return source.slice(open + 1, close);
}

/* ---------------------------------------------------------------- contrastes */

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function token(name: string, theme: 'light' | 'dark'): string {
  const block =
    theme === 'light'
      ? css.slice(css.indexOf(':root,'), css.indexOf("[data-theme='dark']"))
      : css.slice(css.indexOf("[data-theme='dark']"), css.indexOf("[data-theme='dark']") + 4000);
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1] ?? '';
}

describe('coquille bureau — seuil', () => {
  it('utilise un seul point de rupture, 1024 px', () => {
    expect(DESKTOP_MIN_WIDTH).toBe(1024);
  });
});

describe('coquille bureau — largeur pilotée par une seule variable', () => {
  it('vaut 0 px par défaut (aucun rail sur téléphone)', () => {
    expect(ruleBody(shellCss, ':root')).toMatch(/--rail:\s*0px/);
  });

  it('déclare les deux états mémorisés à partir de 1024 px', () => {
    expect(css).toMatch(/@media \(min-width: 1024px\)/);
    expect(css).toMatch(/:root\[data-rail='expanded'\][\s\S]{0,120}--rail:\s*var\(--rail-expanded\)/);
    expect(css).toMatch(/:root\[data-rail='collapsed'\]\s*\{\s*--rail:\s*var\(--rail-collapsed\)/);
  });

  it('ouvre la marge du contenu avec la variable, jamais avec une valeur en dur', () => {
    expect(ruleBody(css, '.app-main')).toMatch(/margin-inline-start:\s*var\(--rail\)/);
  });

  it('donne au rail exactement la même largeur', () => {
    expect(ruleBody(css, '.desktop-rail')).toMatch(/width:\s*var\(--rail\)/);
  });

  it('sort les libellés de l’arbre visuel quand le rail est replié', () => {
    const body = ruleBody(css, ".desktop-rail[data-collapsed='true'] .rail-label");
    expect(body).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(body).toMatch(/position:\s*absolute/);
  });

  it('ne pose aucune largeur de rail en dur dans un composant', () => {
    const layout = readFileSync(join(root, 'app', '(tabs)', '_layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/\b(264|88)px/);
    expect(layout).toMatch(/useIsDesktop/);
  });

  it('ne monte jamais deux navigations à la fois', () => {
    const layout = readFileSync(join(root, 'app', '(tabs)', '_layout.tsx'), 'utf8');
    // chaque navigation mobile est conditionnée par !isDesktop
    for (const component of ['HamburgerMenu', 'QuickDock', 'BottomTabs']) {
      expect(layout).toMatch(new RegExp(`\\{!isDesktop && <${component}`));
    }
    expect(layout).toMatch(/\{isDesktop && <DesktopRail/);
  });
});

describe('coquille bureau — colonne d’écran', () => {
  it('ne change rien sous 1024 px', () => {
    const body = ruleBody(css, '.screen-column,\n.screen-column-narrow');
    expect(body).toMatch(/max-width:\s*100%/);
  });

  it('donne une mesure de lecture au-dessus de 1024 px', () => {
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]{0,400}\.screen-column \{\s*max-width: var\(--reading-wide\)/);
    expect(css).toMatch(/\.screen-column-narrow \{\s*max-width: var\(--reading-width\)/);
  });

  it('est appliquée aux quatre écrans d’onglet', () => {
    for (const file of ['index.tsx', 'explore.tsx', 'progress.tsx', 'settings.tsx']) {
      const src = readFileSync(join(root, 'app', '(tabs)', file), 'utf8');
      expect(src).toMatch(/screen-column(-narrow)?/);
    }
  });
});

describe('Tailwind — l’alpha d’une variable CSS', () => {
  it('déclare le helper color-mix', () => {
    expect(tailwind).toMatch(/const alpha = \(token\) => `color-mix\(in srgb/);
  });

  it('l’applique à primary, surface, border et text-*', () => {
    expect(tailwind).toMatch(/DEFAULT: alpha\('var\(--color-primary\)'\)/);
    expect(tailwind).toMatch(/surface: alpha\('var\(--color-surface\)'\)/);
    expect(tailwind).toMatch(/border: alpha\('var\(--color-border\)'\)/);
    expect(tailwind).toMatch(/'text-muted': alpha\('var\(--color-text-muted\)'\)/);
  });

  it('ne laisse plus aucun jeton de couleur nu là où un modificateur d’opacité est utilisé', () => {
    expect(tailwind).not.toMatch(/^\s*'text-primary': 'var\(--color-text-primary\)',$/m);
  });
});

describe('contrastes du rail', () => {
  it('encre posée sur l’accent, thème clair : au niveau AA', () => {
    const primary = token('--color-primary', 'light');
    const onPrimary = token('--color-on-primary', 'light');
    expect(primary).toBe('#e6067a');
    expect(onPrimary).toBe('#ffffff');
    // 4,495:1 — pair de marque préexistant, à 0,005 du seuil strict.
    expect(contrast(primary, onPrimary)).toBeGreaterThanOrEqual(4.49);
  });

  it('encre posée sur l’accent, thème sombre : franchement AA', () => {
    const primary = token('--color-primary', 'dark');
    const onPrimary = token('--color-on-primary', 'dark');
    expect(onPrimary).toBe('#1b1c1c');
    expect(contrast(primary, onPrimary)).toBeGreaterThanOrEqual(4.5);
  });

  it('texte secondaire sur la surface du rail', () => {
    const secondary = token('--color-text-secondary', 'light');
    const surface = token('--color-surface', 'light');
    expect(contrast(secondary, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('texte principal sur la surface du rail', () => {
    const ink = token('--color-text-primary', 'light');
    const surface = token('--color-surface', 'light');
    expect(contrast(ink, surface)).toBeGreaterThanOrEqual(7);
  });
});
