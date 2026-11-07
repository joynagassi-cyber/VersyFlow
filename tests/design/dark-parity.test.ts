/**
 * Le mode sombre est-il une PALETTE ou un PATCH ?
 *
 * C'est la seule question qui compte ici, et l'ancien fichier
 * (`dark-restraint.test.ts`) y répondait mal : il affirmait que le sombre
 * devait contenir `--gc: #171717`, `--tx: #f3f3f3` et un accent désaturé à
 * 45 %. Autrement dit, il **verrouillait** les défauts :
 *
 *   1. **incomplet** — cinq jetons (`--bl`, `--gb`, `--ga`, `--veil`,
 *      `--premium-on`) n'existaient que dans le bloc clair, et le sombre en
 *      héritait par accident ;
 *   2. **figé** — les valeurs ne suivaient aucun preset ;
 *   3. **non conforme** — `--gc` valait la SURFACE en clair (#ffffff) et le
 *      FOND en sombre (#171717) : les cartes sombres n'avaient aucune
 *      élévation, et l'accent y subissait une désaturation que le clair ne
 *      subit pas.
 *
 * Les tests ci-dessous énoncent l'inverse : parité des jetons, valeurs
 * dérivées du preset, et une seule formule appliquée aux deux modes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const raw = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');
/** Les commentaires expliquent les anciennes valeurs : ils ne les déclarent pas. */
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

/** Corps d'un bloc, depuis son sélecteur jusqu'à l'accolade fermante de tête. */
function bodyOf(anchor: string): string {
  const start = css.indexOf(anchor);
  expect(start, `sélecteur absent : ${anchor}`).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  return css.slice(open + 1, close);
}

const LIGHT = ":root, :root[data-theme='light'], .appearance-preview[data-theme='light']";
const DARK = ":root[data-theme='dark'], .appearance-preview[data-theme='dark']";

const light = bodyOf(LIGHT);
const dark = bodyOf(DARK);
/** Bloc commun aux deux modes (sélecteurs listés ensemble). */
const shared = css.slice(
  css.indexOf(':root,\n:root[data-theme=\'light\'],\n:root[data-theme=\'dark\'],'),
  css.indexOf(LIGHT),
);

function tokens(body: string): string[] {
  return [...body.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);
}

describe('parité des modes — le sombre est complet', () => {
  it('déclare les mêmes jetons que le clair (ou les hérite du bloc commun)', () => {
    // Les jetons communs aux deux modes vivent dans un bloc partagé : c'est
    // leur absence TOTALE qui compte, pas leur absence du bloc sombre.
    const declared = new Set([...tokens(light), ...tokens(shared)]);
    const available = new Set([...tokens(dark), ...tokens(shared)]);
    const missing = [...declared].filter((t) => !available.has(t));
    // Un jeton absent du sombre n'est pas « neutre » : il retombe sur la valeur
    // du clair, ce qui avait produit `--premium-on: #1a0b14` en mode sombre.
    expect(missing, `jetons manquants en sombre : ${missing.join(', ')}`).toEqual([]);
  });

  it('les cinq jetons qui manquaient réellement sont présents', () => {
    for (const token of ['--bl', '--gb', '--ga', '--veil', '--premium-on']) {
      const inSharedOrDark = tokens(shared).includes(token) || tokens(dark).includes(token);
      expect(inSharedOrDark, `${token} doit exister pour les deux modes`).toBe(true);
    }
  });

  it('le sombre n’a plus de bloc de correctifs réservé aux composants', () => {
    // Chaque `html[data-theme='dark'] .composant` était un pansement posé sur
    // un mode au lieu d'une règle commune. Seule exception admise : masquer
    // l'icône de fermeture d'un bouton Ionic, qui n'est pas une couleur.
    const patches = [...css.matchAll(/html\[data-theme='dark'\]\s+\.([\w-]+)/g)].map((m) => m[1]);
    expect(new Set(patches)).toEqual(new Set(['app-main']));
  });
});

describe('dynamisme — aucune teinte figée dans les jetons de surface', () => {
  const hexes = (body: string) => [...body.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0]);

  it('le bloc commun ne contient aucune couleur littérale', () => {
    expect(hexes(shared)).toEqual([]);
  });

  it('les blocs de mode ne contiennent aucune couleur littérale', () => {
    // Les triplets (`--gc-rgb: 30, 30, 30`) sont des NOMBRES, pas des couleurs :
    // ce sont les seules valeurs que le CSS ne sait pas dériver, et
    // `applySurfaceTriplets` les recalcule sur le preset réel au premier rendu.
    expect(hexes(light)).toEqual([]);
    expect(hexes(dark)).toEqual([]);
  });

  it('chaque jeton de couleur dérive d’une variable du preset', () => {
    for (const [name, body] of [
      ['clair', light],
      ['sombre', dark],
    ] as const) {
      for (const [, token, value] of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
        if (/-rgb$|strength|saturation/.test(token)) continue;
        // Chaque valeur doit être calculée : var(), color-mix(), rgb() ou calc().
        expect(
          /var\(|color-mix\(|rgb\(|calc\(/.test(value),
          `${name} ${token} est figé : ${value.trim()}`,
        ).toBe(true);
      }
    }
  });

  it('la surface suit le preset au lieu d’un gris de mode', () => {
    // `--gc: rgb(var(--gc-rgb))` et des triplets fournis par le thème : la
    // carte sombre n'est plus #171717 (le fond) mais la surface du preset.
    expect(shared).toContain('--gc: rgb(var(--gc-rgb))');
    expect(shared).toContain('--bg: rgb(var(--bg-rgb))');
  });
});

describe('conformité — même formule, même rôle, dans les deux modes', () => {
  it('l’accent n’est plus désaturé dans un seul mode', () => {
    // L'ancienne règle : color-mix(primary 45 %, --mut), uniquement en sombre.
    expect(css).not.toMatch(/color-mix\(in srgb, var\(--color-primary\) 45%/);
    expect(shared).toContain('--acc: var(--color-primary)');
    expect(shared).toContain('--acc2: var(--color-accent)');
  });

  it('l’encre d’accent est calculée depuis l’accent, dans les deux modes', () => {
    expect(light).toMatch(/--acc-text:\s*color-mix\(in srgb, var\(--acc\)/);
    expect(dark).toMatch(/--acc-text:\s*color-mix\(in srgb, var\(--acc\)/);
  });

  it('le texte posé sur l’accent est défini dans les deux modes', () => {
    expect(light).toMatch(/--premium-on:/);
    expect(dark).toMatch(/--premium-on:/);
  });

  it('les surfaces d’accent sont peintes par une règle unique', () => {
    // Une seule règle, sans préfixe de mode : c'est la définition de
    // « conforme ». Les mêmes sélecteurs ne doivent pas exister en double.
    const base = css.match(/\.mobile-tabs \[aria-current='page'\] > \.bg-primary,\n\.desktop-rail button\.bg-primary,/);
    expect(base).not.toBeNull();
    expect(css).not.toMatch(/html\[data-theme='dark'\] \.desktop-rail button\.bg-primary/);
    expect(css).not.toMatch(/html\[data-theme='dark'\] \.mobile-header \.text-primary/);
  });

  it('le voile sur image suit la surface du preset, pas un rgba figé', () => {
    const veil = css.slice(css.indexOf("html[data-bg='image']::after {"));
    expect(veil).toContain('var(--veil-strength)');
    expect(veil).not.toContain('rgba(8,8,8');
    expect(veil).not.toContain('rgba(255,236,244');
  });

  it('le logo n’est plus désaturé par une règle propre au sombre', () => {
    expect(css).not.toMatch(/html\[data-theme='dark'\] \.brand-tile/);
    expect(css).toContain('filter: saturate(var(--brand-saturation))');
  });
});

describe('triplets RGB — la seule valeur que le CSS ne peut pas dériver', () => {
  it('ils sont calculés depuis le preset après application du thème', async () => {
    const { toRgbTriplet, readSurfaceTriplets } = await import('@/theme/surface-triplets');

    expect(toRgbTriplet('#171717')).toBe('23, 23, 23');
    expect(toRgbTriplet('#fff')).toBe('255, 255, 255');
    expect(toRgbTriplet('rgba(30, 30, 30, 0.5)')).toBe('30, 30, 30');
    // Une valeur non exploitable ne doit jamais produire un triplet inventé :
    // un gris faux repeindrait tout le verre de l'application.
    expect(toRgbTriplet('color-mix(in srgb, red, blue)')).toBeNull();
    expect(toRgbTriplet('transparent')).toBeNull();
    expect(toRgbTriplet('')).toBeNull();

    const triplets = readSurfaceTriplets((name) => {
      const vars: Record<string, string> = {
        '--card': '#1e1e1e',
        '--background': '#121212',
        '--foreground': '#f3f3f3',
        '--color-surface': '#ffffff',
      };
      return vars[name] ?? '';
    });
    // `--card` est la valeur BRUTE du preset : elle doit primer sur
    // `--color-surface`, qui peut être rendue translucide par une image.
    expect(triplets).toEqual({ gc: '30, 30, 30', bg: '18, 18, 18', text: '243, 243, 243' });
  });
});

describe('contraste des encres de mode', () => {
  /** Luminance relative WCAG d'un hex. */
  const lum = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it('les paires de texte des deux modes tiennent AA sur leur surface', () => {
    // Valeurs du thème de base, telles que les déclarent les blocs.
    const pairs = [
      ['clair — texte/surface', '#1b1c1c', '#ffffff'],
      ['clair — secondaire/surface', '#5a4044', '#ffffff'],
      ['sombre — texte/surface', '#ffffff', '#1e1e1e'],
      ['sombre — secondaire/surface', '#cbb3c0', '#1e1e1e'],
    ] as const;
    for (const [label, fg, bg] of pairs) {
      expect(contrast(fg, bg), `${label} = ${contrast(fg, bg).toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('l’écart de contraste entre les deux modes reste modéré', () => {
    // « Le sombre n'est pas aussi conforme que le clair » : ici, la mesure.
    const light = contrast('#1b1c1c', '#ffffff');
    const dark = contrast('#ffffff', '#1e1e1e');
    expect(Math.abs(light - dark)).toBeLessThan(1.5);
  });

  it('les surfaces pleines d’accent utilisent l’encre déclarée par le preset', () => {
    // `--color-on-primary` suit `--primary-foreground`, donc un preset à texte
    // noir sur accent clair ne se retrouve pas avec du blanc illisible.
    // `--on-accent` vaut `--color-on-primary` par défaut : l'encre du preset,
    // valable en clair comme en sombre puisque chaque preset la déclare.
    expect(shared).toContain('--on-accent: var(--color-on-primary)');
    expect(css).toMatch(/\.desktop-rail button\.bg-primary[\s\S]{0,120}color: var\(--on-accent\)/);
  });
});

describe('chrome du navigateur', () => {
  it('la couleur de barre n’est plus écrite en dur dans index.html', async () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    // Elle était figée à #D81B97 : une barre magenta au-dessus d'un écran
    // sombre, dans une teinte qui n'était même pas celle de la marque.
    expect(html).toMatch(/<meta name="theme-color"[^>]*content="[^"]*"/);

    const { tripletToHex, applyThemeColor } = await import('@/theme/surface-triplets');
    expect(tripletToHex('18, 18, 18')).toBe('#121212');
    expect(tripletToHex('300, 0, 0')).toBeNull();
    expect(tripletToHex('pas un triplet')).toBeNull();

    // Sur un document sans balise, elle est créée plutôt que silencieusement
    // ignorée : une barre non alignée est un défaut visible sur mobile.
    const doc = new DOMParser().parseFromString('<html><head></head><body></body></html>', 'text/html');
    applyThemeColor('18, 18, 18', doc);
    expect(doc.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#121212');
  });
});

describe('structure du fichier', () => {
  it('les accolades sont équilibrées', () => {
    const open = (css.match(/\{/g) ?? []).length;
    const close = (css.match(/\}/g) ?? []).length;
    expect(open).toBe(close);
  });

  it('aucune déclaration ne flotte hors d’un bloc', () => {
    // Une déclaration sortie de son accolade est SILENCIEUSEMENT ignorée par le
    // moteur CSS : la variable retombe sur sa valeur précédente sans aucune
    // erreur. C'est arrivé pendant cette réécriture (`--on-accent` sorti de son
    // bloc) ; seul le build l'a signalé. On mesure donc la profondeur réelle.
    let depth = 0;
    const orphans: string[] = [];
    raw.split('\n').forEach((line, index) => {
      const text = line.trim();
      if (depth === 0 && /^--[a-z0-9-]+\s*:/.test(text)) {
        orphans.push(`l.${index + 1}: ${text}`);
      }
      for (const char of line) {
        if (char === '{') depth += 1;
        if (char === '}') depth = Math.max(0, depth - 1);
      }
    });
    expect(orphans).toEqual([]);
  });
});
