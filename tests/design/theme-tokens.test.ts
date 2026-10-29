/**
 * Contrat des jetons de thème — le socle du § 2 du cahier des charges.
 *
 * Ce fichier vérifie trois choses que l'œil ne peut pas voir :
 *  1. le format : tout jeton animé via `@property --x { syntax: '<color>' }`
 *     doit contenir une couleur CSS valide (jamais un triplet HSL nu) ;
 *  2. la cohérence : le pont `--color-*` (utilisé par les composants) doit
 *     suivre les jetons dynamiques, sinon un changement de thème laisse des
 *     surfaces sur une ancienne couleur ;
 *  3. le contraste : chaque preset, en clair ET en sombre, doit passer 4,5:1
 *     sur les quatre paires de texte que l'interface utilise réellement.
 *
 * Les valeurs ne sont pas recopiées : tout est lu dans les fichiers générés.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const presetCss = readFileSync(join(root, 'src/styles/tweakcn-presets.css'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const tailwind = readFileSync(join(root, 'tailwind.config.js'), 'utf8');

const TARGET = 4.5;
const PRESET_BLOCK = /(:root((?:\[[^\]]+\])+)\s*\{)([^}]*)(\})/g;

interface PresetBlock {
  selector: string;
  name: string;
  dark: boolean;
  body: string;
}

function presetBlocks(css: string): PresetBlock[] {
  return [...css.matchAll(PRESET_BLOCK)]
    .filter((m) => /data-preset=/.test(m[2]))
    .map((m) => ({
      selector: m[2],
      name: (m[2].match(/data-preset=['"]([a-z0-9-]+)['"]/) ?? [])[1],
      dark: /data-theme=['"]dark['"]/.test(m[2]),
      body: m[3],
    }));
}

const blocks = presetBlocks(presetCss);

function tokenIn(body: string, name: string): string | null {
  const m = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

/* --------------------------------------------------------------- contrastes */

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

describe('jetons — format', () => {
  it('aucun jeton n’est un triplet HSL nu (incompatible avec @property <color>)', () => {
    expect(presetCss).not.toMatch(/--[a-z-]+:\s*\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/);
    expect(globals).not.toMatch(/hsl\(var\(--/);
  });

  it('le pont shadcn ne réinjecte jamais hsl(var(--token))', () => {
    expect(tailwind).not.toMatch(/hsl\(var\(--/);
  });

  it('chaque bloc de preset définit les jetons du contrat', () => {
    const required = [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'primary',
      'primary-foreground',
      'secondary',
      'muted',
      'muted-foreground',
      'accent',
      'border',
      'ring',
    ];
    const missing: string[] = [];
    for (const block of blocks) {
      for (const token of required) {
        const value = tokenIn(block.body, token);
        if (!value || !HEX.test(value)) {
          missing.push(`${block.name}${block.dark ? ' (sombre)' : ''} → --${token}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('le catalogue compte 25 presets, en clair et en sombre', () => {
    expect(new Set(blocks.map((b) => b.name)).size).toBe(25);
    expect(blocks.filter((b) => b.dark).length).toBe(25);
  });
});

describe('jetons — cohérence du pont', () => {
  it('--color-on-primary suit --primary-foreground dans chaque preset', () => {
    const broken = blocks
      .filter((b) => tokenIn(b.body, 'color-on-primary') !== 'var(--primary-foreground)')
      .map((b) => `${b.name}${b.dark ? ' (sombre)' : ''}`);
    expect(broken).toEqual([]);
  });

  it('--color-primary et --color-text-secondary suivent leurs jetons dynamiques', () => {
    for (const block of blocks) {
      expect(tokenIn(block.body, 'color-primary')).toBe('var(--primary)');
      expect(tokenIn(block.body, 'color-text-secondary')).toBe('var(--muted-foreground)');
    }
  });

  it('les valeurs initiales de @property ne sont pas du noir', () => {
    const declarations = [...globals.matchAll(/@property\s+(--[a-z-]+)\s*\{([^}]*)\}/g)];
    expect(declarations.length).toBeGreaterThanOrEqual(4);
    for (const [, name, body] of declarations) {
      if (!/syntax:\s*'<color>'/.test(body)) continue;
      const initial = (body.match(/initial-value:\s*([^;]+);/) ?? [])[1]?.trim();
      expect(initial).toMatch(HEX);
      if (name !== '--accent') {
        // --accent est une teinte claire par nature ; les autres non.
        expect(luminance(initial)).toBeGreaterThan(0.05);
      }
    }
  });

  it('le socle définit les jetons avant tout preset', () => {
    for (const name of ['--primary', '--primary-foreground', '--ring', '--accent', '--tint']) {
      expect(globals).toMatch(new RegExp(`${name}:\\s*#[0-9a-fA-F]{6};`));
    }
  });
});

describe('jetons — contrastes mesurés', () => {
  const pairs: Array<[string, string, string]> = [
    ['texte sur fond', 'foreground', 'background'],
    ['texte sur carte', 'card-foreground', 'card'],
    ['texte sur accent', 'primary-foreground', 'primary'],
    ['texte secondaire sur carte', 'muted-foreground', 'card'],
    ['texte secondaire sur fond', 'muted-foreground', 'background'],
  ];

  it.each(pairs)('%s : ≥ 4,5:1 sur les 50 blocs', (_label, fore, back) => {
    const failures: string[] = [];
    let worst = { ratio: Infinity, where: '' };
    for (const block of blocks) {
      const fg = tokenIn(block.body, fore);
      const bg = tokenIn(block.body, back);
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      const where = `${block.name}${block.dark ? ' (sombre)' : ''} ${fg} sur ${bg}`;
      if (ratio < worst.ratio) worst = { ratio, where };
      if (ratio < TARGET) failures.push(`${where} = ${ratio.toFixed(2)}:1`);
    }
    if (failures.length) throw new Error(`${failures.length} paire(s) sous 4,5:1\n${failures.join('\n')}`);
    expect(worst.ratio).toBeGreaterThanOrEqual(TARGET);
  });
});

describe('jetons — alpha Tailwind', () => {
  const alphaWrapped = [
    'primary',
    'surface',
    'background',
    'border',
    'accent',
    'on-primary',
    'card',
    'popover',
    'muted',
    'ring',
  ];

  it.each(alphaWrapped)('%s est dérivable en alpha (color-mix)', (token) => {
    const pattern = new RegExp(`${token}['"]?:\\s*(\\{[^}]*)?alpha\\('var\\(--`);
    expect(tailwind).toMatch(pattern);
  });

  it('la recette de verre bg-card/40 est donc générable', () => {
    expect(tailwind).toMatch(/card: \{ DEFAULT: alpha\('var\(--card\)'\)/);
    // backdrop-blur-2xl vient de `blur` (défaut Tailwind) : 40 px, valeur
    // vérifiée dans le paquet installé, pas supposée.
    const blurDefaults = readFileSync(
      join(root, 'node_modules/tailwindcss/stubs/config.full.js'),
      'utf8',
    );
    expect(blurDefaults).toMatch(/backdropBlur: \({ theme }\) => theme\('blur'\)/);
    expect(blurDefaults).toMatch(/'2xl': '40px'/);
    // La feuille globale utilise la même valeur pour .card-glass.
    expect(globals).toMatch(/\.card-glass[\s\S]{0,400}blur\(40px\)/);
  });
});
