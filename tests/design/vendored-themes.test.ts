/**
 * Thèmes ajoutés au contrat n°3 (registre officiel tweakcn) — preuves.
 *
 * Ces tests lisent les fichiers GÉNÉRÉS (`src/styles/vendored-themes.css`,
 * `src/theme/vendored-themes.ts`) et la source figée
 * (`scripts/data/vendored-themes.json`). Ils ne recopient aucune couleur :
 * si quelqu'un édite un fichier généré à la main, ou si le script de
 * génération diverge, l'un de ces tests tombe.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_VENDORED_PRESET_ID, VENDORED_PRESETS } from '../../src/theme/vendored-themes';
import { DEFAULT_PRESET, PRESET_CATALOG, findPreset } from '../../src/theme/preset-catalog';
import { resolveTheme } from '../../src/theme/resolve-theme';
import { uiFontFamilyOf } from '../../src/theme/theme-fonts';
import { contrast, TARGET } from '../../scripts/apply-preset-contrast.mjs';

const root = resolve(__dirname, '../..');
const css = readFileSync(resolve(root, 'src/styles/vendored-themes.css'), 'utf8');
const data = JSON.parse(readFileSync(resolve(root, 'scripts/data/vendored-themes.json'), 'utf8'));

const BLOCK = /(:root((?:\[[^\]]+\])+)\s*\{)([^}]*)(\})/g;
const HEX = /^#[0-9a-f]{6}$/;

interface Block {
  name: string;
  dark: boolean;
  body: string;
}

const blocks: Block[] = [...css.matchAll(BLOCK)]
  .filter((m) => /data-preset=/.test(m[2]))
  .map((m) => ({
    name: (m[2].match(/data-preset='([a-z0-9-]+)'/) ?? [])[1],
    dark: /data-theme='dark'/.test(m[2]),
    body: m[3],
  }));

const tokenIn = (body: string, token: string): string | null => {
  const m = body.match(new RegExp(`--${token}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

describe('thèmes vendus — intégrité de la génération', () => {
  it('génère un bloc clair et un bloc sombre par thème', () => {
    expect(data.themes).toHaveLength(14);
    expect(new Set(blocks.map((b) => b.name)).size).toBe(14);
    expect(blocks.filter((b) => b.dark)).toHaveLength(14);
    expect(blocks).toHaveLength(28);
  });

  it('les fichiers générés sont à jour vis-à-vis de la source (script idempotent)', () => {
    // Sort en code 1 si un fichier généré ne correspond plus à la source.
    expect(() =>
      execFileSync('node', ['scripts/import-vendored-themes.mjs', '--check'], {
        cwd: root,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('chaque bloc porte tous les jetons sémantiques, en hexadécimal', () => {
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
      'secondary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
      'destructive',
      'destructive-foreground',
      'border',
      'input',
      'ring',
    ];
    const missing: string[] = [];
    for (const block of blocks) {
      for (const token of required) {
        const value = tokenIn(block.body, token);
        if (!value || !HEX.test(value)) missing.push(`${block.name}${block.dark ? ' (sombre)' : ''} → --${token}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('le pont vers les variables historiques est posé dans chaque bloc', () => {
    for (const block of blocks) {
      expect(tokenIn(block.body, 'color-on-primary')).toBe('var(--primary-foreground)');
      expect(tokenIn(block.body, 'color-primary')).toBe('var(--primary)');
      expect(tokenIn(block.body, 'color-text-secondary')).toBe('var(--muted-foreground)');
      expect(tokenIn(block.body, 'color-surface')).toBe('var(--card)');
    }
  });

  it('chaque thème cite son URL de registre officielle', () => {
    for (const theme of data.themes) {
      expect(theme.source).toMatch(/^https:\/\/tweakcn\.com\/r\/themes\/[a-z0-9]+$/);
    }
  });

  it('les thèmes conçus pour le sombre ont un bloc clair identique au sombre', () => {
    for (const theme of data.themes.filter((t: { darkOnly?: boolean }) => t.darkOnly)) {
      const light = blocks.find((b) => b.name === theme.id && !b.dark);
      const dark = blocks.find((b) => b.name === theme.id && b.dark);
      expect(light, theme.id).toBeDefined();
      expect(dark, theme.id).toBeDefined();
      // Mêmes valeurs de couleur : seuls l'ordre des lignes peut différer.
      const colors = (body: string) =>
        [...body.matchAll(/--(?!radius|tracking|spacing|font|shadow)[a-z0-9-]+:\s*(#[0-9a-f]{6});/g)]
          .map((m) => m[0])
          .sort();
      expect(colors(light!.body)).toEqual(colors(dark!.body));
    }
  });
});

describe('thèmes vendus — thème par défaut', () => {
  const blockOf = (id: string, dark = false) =>
    blocks.find((b) => b.name === id && b.dark === dark)?.body ?? '';

  it('est `lara-red` et il est unique dans la source', () => {
    expect(DEFAULT_VENDORED_PRESET_ID).toBe('lara-red');
    expect(data.themes.filter((t: { default?: boolean }) => t.default)).toHaveLength(1);
    expect(VENDORED_PRESETS[0].id).toBe('lara-red');
    expect(VENDORED_PRESETS[0].isDefault).toBe(true);
  });

  it('sert exactement la couleur primaire demandée (oklch 0.6370 0.2370 25.3310)', () => {
    // oklch(0.6370 0.2370 25.3310) = #fb2c36 (identique à red-500 de Tailwind v4).
    expect(tokenIn(blockOf('lara-red'), 'primary')).toBe('#fb2c36');
    // Mode sombre : oklch(0.6450 0.2460 16.4390), valeur officielle du preset.
    expect(tokenIn(blockOf('lara-red', true), 'primary')).toBe('#ff2056');
  });

  it('porte radius 0.5rem, échelle de rayons 1 et interlettrage 0em', () => {
    const light = blockOf('lara-red');
    expect(tokenIn(light, 'radius')).toBe('0.5rem');
    expect(tokenIn(light, 'radius-scale')).toBe('1');
    expect(tokenIn(light, 'tracking-normal')).toBe('0em');
    // Ombre demandée : 0 1px 4px à 10 % d'opacité.
    expect(tokenIn(light, 'shadow-preset-sm')).toContain('0 1px 4px');
    expect(tokenIn(light, 'shadow-preset-sm')).toContain('/ 0.10');
  });

  it('porte la spécification typographique demandée', () => {
    const light = blockOf('lara-red');
    expect(tokenIn(light, 'font-sans')).toContain('Inter');
    expect(tokenIn(light, 'font-serif')).toContain('Noto Serif Georgian');
    expect(tokenIn(light, 'font-mono')).toContain('JetBrains Mono');
  });
});

describe('thèmes vendus — accessibilité', () => {
  it('aucun texte posé sur un accent ne reste sous AA 4,5:1', () => {
    const bad: string[] = [];
    for (const block of blocks) {
      for (const [fgToken, bgToken] of [
        ['primary-foreground', 'primary'],
        ['secondary-foreground', 'secondary'],
        ['accent-foreground', 'accent'],
        ['destructive-foreground', 'destructive'],
      ]) {
        const fg = tokenIn(block.body, fgToken);
        const bg = tokenIn(block.body, bgToken);
        if (!fg || !bg) continue;
        const ratio = contrast(fg, bg);
        if (ratio < TARGET) bad.push(`${block.name}${block.dark ? ' (sombre)' : ''} ${fgToken}/${bgToken} = ${ratio.toFixed(2)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('le texte secondaire passe AA sur le fond et sur la carte', () => {
    const bad: string[] = [];
    for (const block of blocks) {
      const fg = tokenIn(block.body, 'muted-foreground');
      if (!fg) continue;
      for (const surface of ['background', 'card']) {
        const bg = tokenIn(block.body, surface);
        if (!bg) continue;
        const ratio = contrast(fg, bg);
        if (ratio < TARGET) bad.push(`${block.name}${block.dark ? ' (sombre)' : ''} muted-foreground/${surface} = ${ratio.toFixed(2)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('le rapport de contraste documente chaque correction', () => {
    const report = readFileSync(resolve(root, 'docs/design/vendored-theme-contrast.md'), 'utf8');
    expect(report).toContain('AA 4.5:1');
    // Des corrections existent (thèmes officiels non conformes d'origine) et
    // chacune est tracée : le rapport ne peut pas être vide sans mentir.
    expect(report.split('\n| ').length).toBeGreaterThan(1);
  });
});

describe('catalogue de presets', () => {
  it('expose les thèmes vendus en tête, puis les 25 presets historiques', () => {
    expect(PRESET_CATALOG).toHaveLength(39);
    expect(PRESET_CATALOG.slice(0, 14).map((p) => p.id)).toEqual(VENDORED_PRESETS.map((p) => p.id));
  });

  it('le preset par défaut est unique et résolvable', () => {
    expect(DEFAULT_PRESET).toBe('lara-red');
    expect(findPreset(DEFAULT_PRESET)?.isDefault ?? true).toBe(true);
    expect(PRESET_CATALOG.filter((p) => p.id === DEFAULT_PRESET)).toHaveLength(1);
  });

  it('n’a aucun identifiant en double entre les deux familles', () => {
    const ids = PRESET_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('expose un aperçu utilisable (pastille + fond + carte) pour chaque thème vendu', () => {
    for (const preset of PRESET_CATALOG.slice(0, 14)) {
      for (const key of ['swatch', 'bg', 'card', 'fg', 'primary', 'accent', 'primaryFg'] as const) {
        expect(preset[key], `${preset.id}.${key}`).toMatch(HEX);
      }
    }
  });
});

describe('typographie du thème — la spécification du preset survit', () => {
  const input = {
    presetId: 'emerald',
    accent: 'emerald',
    backgroundType: 'none' as const,
    gradientId: null,
    colorThemeId: null,
    isDark: false,
    reducedTransparency: false,
    highContrast: false,
    wide: false,
  };

  it('« police du thème » ne pose aucune famille : le preset gagne', () => {
    // Avant ce correctif, le réglage `system` imposait « Inter » à tous les
    // thèmes et la police de Geist (Emerald), DM Sans, Outfit, etc. ne
    // s'appliquait jamais.
    expect(uiFontFamilyOf('system')).toBeUndefined();
    expect(uiFontFamilyOf(null)).toBeUndefined();
    expect(resolveTheme(input).vars['--font-sans']).toBeUndefined();
  });

  it('un choix explicite de l’utilisateur l’emporte sur le preset', () => {
    const plan = resolveTheme({ ...input, uiFontFamily: "'Lora', Georgia, serif" });
    expect(plan.vars['--font-sans']).toBe("'Lora', Georgia, serif");
    expect(uiFontFamilyOf('lora')).toContain('Lora');
  });
});
