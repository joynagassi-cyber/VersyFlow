/**
 * Contrastes **composités** — pas seulement les jetons théoriques.
 *
 * Ce que l'audit existant ne mesurait pas :
 *  1. `--color-text-muted` / `--color-text-tertiary` n'étaient surchargés par
 *     aucun preset : les valeurs de repli (#98989e / #6a5a63) tombaient à
 *     2,75:1 — sous AA — alors qu'elles portent 375 libellés dans l'app.
 *  2. Le verre posé sur une photo : la carte est un mélange
 *     `surface ⨉ voile ⨉ image`. Une opacité de 42 % sur une photo sombre
 *     (mode clair) ou claire (mode sombre) fait chuter le texte secondaire.
 *
 * Les ratios sont calculés ici, sur les mêmes valeurs que le CSS.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/* -------------------------------------------------------------- couleurs --- */

type Rgb = [number, number, number];

const hexToRgb = (hex: string): Rgb => {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (rgb: Rgb): number =>
  0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

const contrast = (a: Rgb, b: Rgb): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return la > lb ? (la + 0.05) / (lb + 0.05) : (lb + 0.05) / (la + 0.05);
};

/** `over` posé sur `under` avec l'opacité `alpha` (mélange sRGB simple). */
const composite = (under: Rgb, over: Rgb, alpha: number): Rgb => [
  over[0] * alpha + under[0] * (1 - alpha),
  over[1] * alpha + under[1] * (1 - alpha),
  over[2] * alpha + under[2] * (1 - alpha),
];

/* --------------------------------------------------------------- sources --- */

const globals = readFileSync('src/styles/globals.css', 'utf8');
const vendored = readFileSync('src/styles/vendored-themes.css', 'utf8');
const tweakcn = readFileSync('src/styles/tweakcn-presets.css', 'utf8');
const presetsCss = `${vendored}\n${tweakcn}`;

interface PresetBlock {
  name: string;
  dark: boolean;
  body: string;
}

const presetBlocks: PresetBlock[] = [...presetsCss.matchAll(/(:root[^{]*)\{([^}]*)\}/g)]
  .filter((match) => /--muted-foreground:/.test(match[2]))
  .map((match) => {
    const selector = match[1];
    const name = (selector.match(/data-preset='([^']+)'/) ?? [])[1] ?? selector;
    return { name, dark: /data-theme='dark'/.test(selector), body: match[2] };
  });

const token = (body: string, name: string): string | null => {
  const match = body.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match ? match[1] : null;
};

/* ------------------------------------------------------------------ tests --- */

describe('jetons de texte atténué', () => {
  it('ne sont plus des gris fixés à la main hors AA', () => {
    // Les deux blocs de repli (clair et sombre) doivent dériver du preset.
    const rootBlocks = [...globals.matchAll(/:root[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
    const light = rootBlocks.find((b) => /--color-text-muted:/.test(b)) ?? '';
    const dark =
      [...globals.matchAll(/\[data-theme='dark'\][^{]*\{([^}]*)\}/g)]
        .map((m) => m[1])
        .find((b) => /--color-text-muted:/.test(b)) ?? '';

    expect(light).toContain('--color-text-muted: var(--color-text-secondary)');
    expect(dark).toContain('--color-text-muted: var(--color-text-secondary)');
    expect(light).toContain('--color-text-tertiary: var(--color-text-secondary)');
    expect(dark).toContain('--color-text-tertiary: var(--color-text-secondary)');
  });

  it('vérifie les anciennes valeurs : elles étaient sous 4,5:1', () => {
    // Preuve chiffrée du défaut corrigé (aucun preset ne surchargeait ces jetons).
    expect(contrast(hexToRgb('#98989e'), hexToRgb('#fafafa'))).toBeLessThan(4.5);
    expect(contrast(hexToRgb('#6a5a63'), hexToRgb('#18181b'))).toBeLessThan(4.5);
    // La valeur de repli des thèmes image reste, elle, largement au-dessus.
    expect(contrast(hexToRgb('#5b4a57'), hexToRgb('#ffffff'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hexToRgb('#c3c3c3'), hexToRgb('#121212'))).toBeGreaterThanOrEqual(4.5);
  });

  it('mesure le texte secondaire sur les 78 blocs de preset', () => {
    expect(presetBlocks.length).toBe(78);
    const failures: string[] = [];
    let worst = { ratio: Infinity, where: '' };
    for (const block of presetBlocks) {
      const fg = token(block.body, 'muted-foreground');
      const bg = token(block.body, 'background');
      const card = token(block.body, 'card');
      if (!fg || !bg || !card) continue;
      for (const [label, surface] of [
        ['background', bg],
        ['card', card],
      ] as const) {
        const ratio = contrast(hexToRgb(fg), hexToRgb(surface));
        const where = `${block.name}${block.dark ? '/dark' : ''} ${label}`;
        if (ratio < worst.ratio) worst = { ratio, where };
        if (ratio < 4.5) failures.push(`${where}: ${ratio.toFixed(2)}:1`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
    expect(worst.ratio).toBeGreaterThanOrEqual(4.49);
  });
});

describe('verre sur photo — contrastes composités', () => {
  /** Valeurs du CSS : voile noir, verre blanc (clair) / ardoise (sombre). */
  const GLASS_LIGHT = hexToRgb('#ffffff');
  const GLASS_DARK = hexToRgb('#0f172a');
  const VEIL = hexToRgb('#000000');
  const IMAGE_EXTREMES: Array<[string, Rgb]> = [
    ['photo noire', hexToRgb('#000000')],
    ['photo blanche', hexToRgb('#ffffff')],
  ];

  const floor = Number(
    (globals.match(/--glass-alpha-min:\s*([\d.]+)/) ?? [])[1] ?? 0,
  );
  const texLight = hexToRgb('#1b1220');
  const texLightMuted = hexToRgb('#5b4a57');
  const texDark = hexToRgb('#f3f3f3');
  const texDarkMuted = hexToRgb('#c3c3c3');

  it('le plancher d’opacité du verre est déclaré et appliqué', () => {
    expect(floor).toBeGreaterThanOrEqual(0.8);
    // Les cartes g1/g2/g3 (dont la barre d'onglets et les cartes d'accueil)
    // sont les surfaces réellement utilisées : même plancher.
    for (const cls of ['g1', 'g2', 'g3']) {
      expect(globals).toContain(
        `html[data-bg='image'] .${cls} { background: rgba(var(--gc-rgb), max(`,
      );
    }
    expect(globals).toContain(
      'html[data-bg=\'image\'] :is(.card-glass, .surface-glass, .bible-card) {\n  background: rgba(var(--glass-rgb), max(var(--glass-alpha), var(--glass-alpha-min)));',
    );
  });

  it('tient AA dans les 4 combinaisons extrêmes, quel que soit le voile', () => {
    const failures: string[] = [];
    for (const veilAlpha of [0, 0.6, 1]) {
      for (const [imageName, image] of IMAGE_EXTREMES) {
        for (const [mode, glass, text, muted] of [
          ['clair', GLASS_LIGHT, texLight, texLightMuted],
          ['sombre', GLASS_DARK, texDark, texDarkMuted],
        ] as const) {
          const backdrop = composite(image, VEIL, veilAlpha);
          const card = composite(backdrop, glass, floor);
          for (const [role, color] of [
            ['texte', text],
            ['texte secondaire', muted],
          ] as const) {
            const ratio = contrast(color, card);
            const where = `${mode} · ${imageName} · voile ${veilAlpha} · ${role}`;
            if (ratio < 4.5) failures.push(`${where} = ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('documente pourquoi 42 % ne suffisait pas', () => {
    const defaultAlpha = 0.42; // preset « équilibre »
    const backdrop = composite(hexToRgb('#000000'), VEIL, 1);
    const card = composite(backdrop, GLASS_LIGHT, defaultAlpha);
    expect(contrast(texLightMuted, card)).toBeLessThan(4.5);
  });

  it('le texte de l’accueil profite d’un voile de 90 % sur la carte du jour', () => {
    // `.home-daily-card::after` = color-mix(var(--gc) 90%, transparent).
    const surface = hexToRgb('#ffffff');
    const card = composite(hexToRgb('#000000'), surface, 0.9);
    expect(contrast(texLight, card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(texLightMuted, card)).toBeGreaterThanOrEqual(4.5);
  });
});
