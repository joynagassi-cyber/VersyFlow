/**
 * L5 — Une seule décision de thème, un seul écrivain.
 *
 * `resolveTheme` est pure : on peut donc la tester cas par cas, sans
 * navigateur, et vérifier que le plan produit est exactement ce que le DOM
 * recevra. `applyThemePlan` est le seul code qui écrit sur la racine ; ces
 * tests vérifient aussi qu'il ne se contredit jamais (une clé posée ne
 * figure pas dans les retraits, les retraits passent avant les poses).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ACCENT_VARS,
  applyThemePlan,
  imagePath,
  DEFAULT_PRESET_ID,
  resolveTheme,
  type ThemeInput,
  type ThemePlan,
} from '../../src/theme/resolve-theme';

const base: ThemeInput = {
  presetId: 'lara-red',
  accent: 'lara-red',
  backgroundType: 'none',
  gradientId: null,
  colorThemeId: null,
  isDark: false,
  reducedTransparency: false,
  highContrast: false,
  wide: false,
};

const accent = {
  primary: '#e6067a',
  primaryLight: '#ff4d9d',
  primaryDark: '#a80052',
  accent: '#ffc1e3',
  accentLight: '#ffe3f2',
};

describe('resolveTheme — décision pure', () => {
  it('pose le preset actif et n’invente rien quand aucun fond n’est choisi', () => {
    const plan = resolveTheme(base);
    expect(plan.attributes['data-preset']).toBe('lara-red');
    expect(plan.vars['--app-bg-image']).toBeUndefined();
    expect(plan.vars['--theme-image']).toBeUndefined();
    // Aucune variable d'accent maison : le preset tweakcn est la source.
    expect(Object.keys(plan.vars).filter((k) => ACCENT_VARS.includes(k as never))).toEqual([]);
  });

  it('retombe sur le thème par défaut Lara Red si aucun preset n’est persisté', () => {
    // Le défaut a changé au contrat n°3 : `lara-red` (tweakcn
    // cmvukmb1k000004iifp7x5wji) remplace `quantum-rose`. La constante est
    // lue depuis le module généré pour qu'un futur changement reste prouvé ici.
    expect(DEFAULT_PRESET_ID).toBe('lara-red');
    expect(resolveTheme({ ...base, presetId: null }).attributes['data-preset']).toBe('lara-red');
  });

  it('un dégradé remplace le fond et fournit ses couleurs d’accent', () => {
    const plan = resolveTheme({ ...base, backgroundType: 'gradient', gradientId: 'warm-flame' });
    expect(plan.attributes['data-app-bg']).toBe('gradient');
    expect(plan.vars['--app-bg-image']).toContain('linear-gradient');
    expect(plan.removedVars).toContain('--theme-image');
    expect(plan.removedAttributes).toContain('data-theme-image');
    expect(plan.vars['--color-primary']).toBe('#ff9a9e');
    expect(plan.vars['--color-accent']).toBe('#fad0c4');
  });

  it('un thème image pose l’accent et l’illustration, sans attends l’extraction', () => {
    const plan = resolveTheme({
      ...base,
      backgroundType: 'image',
      colorThemeId: 'esprit-pentecote',
      accentValues: accent,
    });
    expect(plan.vars['--color-primary']).toBe('#e6067a');
    expect(plan.vars['--ion-color-primary']).toBe('#e6067a');
    expect(plan.vars['--theme-image']).toBe('url(/themes/esprit/esprit-pentecote-portrait.webp)');
    expect(plan.attributes['data-theme-image']).toBe('on');
    expect(plan.attributes['data-theme-image-mode']).toBe('light');
  });

  it('passe à l’illustration paysage au-delà de 1024 px', () => {
    const plan = resolveTheme({
      ...base,
      backgroundType: 'image',
      colorThemeId: 'esprit-pentecote',
      accentValues: accent,
      wide: true,
    });
    expect(plan.vars['--theme-image']).toContain('-landscape.webp');
    expect(imagePath('esprit-pentecote', false)).toContain('-portrait.webp');
    expect(imagePath('esprit-pentecote', true)).toContain('-landscape.webp');
  });

  it('pose l’image de fond sans attendre l’extraction de l’accent', () => {
    const plan = resolveTheme({ ...base, backgroundType: 'image', colorThemeId: 'esprit-feu' });
    // Le fond est une décision synchrone : l'image est TOUJOURS posée, même
    // quand l'échantillonnage des pixels (asynchrone) n'a pas encore eu lieu.
    // C'est ce qui manquait : `--theme-image` n'était écrit que si
    // `accentValues` existait déjà, donc le fond restait blanc.
    expect(plan.vars['--theme-image']).toContain('-portrait.webp');
    expect(plan.attributes['data-theme-image']).toBe('on');
    expect(plan.removedVars).not.toContain('--theme-image');
    // …et aucun accent n'est inventé tant que l'extraction n'a pas eu lieu.
    expect(plan.vars['--color-primary']).toBeUndefined();
  });

  it('traduit les réglages d’accessibilité en attributs', () => {
    const plan = resolveTheme({ ...base, reducedTransparency: true, highContrast: true });
    expect(plan.attributes['data-transparency']).toBe('reduced');
    expect(plan.attributes['data-contrast']).toBe('high');
    const off = resolveTheme(base);
    expect(off.removedAttributes).toContain('data-transparency');
    expect(off.removedAttributes).toContain('data-contrast');
  });

  it('écrit la police d’interface seulement si elle est fournie', () => {
    const family = "'Lora', Georgia, serif";
    expect(resolveTheme({ ...base, uiFontFamily: family }).vars['--font-sans']).toBe(family);
    expect(resolveTheme(base).vars['--font-sans']).toBeUndefined();
  });

  it('ne se contredit jamais : aucune clé à la fois posée et retirée', () => {
    const plans = [
      resolveTheme(base),
      resolveTheme({ ...base, backgroundType: 'gradient', gradientId: 'plum-plate' }),
      resolveTheme({ ...base, backgroundType: 'image', colorThemeId: 'esprit-feu', accentValues: accent }),
      resolveTheme({ ...base, reducedTransparency: true, highContrast: true, uiFontFamily: 'x' }),
    ];
    for (const plan of plans) {
      for (const key of Object.keys(plan.attributes)) {
        expect(plan.removedAttributes).not.toContain(key);
      }
      for (const key of Object.keys(plan.vars)) {
        expect(plan.removedVars).not.toContain(key);
      }
    }
  });

  it('est déterministe : deux appels identiques donnent le même plan', () => {
    const input: ThemeInput = { ...base, backgroundType: 'gradient', gradientId: 'sunny-morning' };
    expect(resolveTheme(input)).toEqual(resolveTheme({ ...input }));
  });

  it('ne touche pas au DOM quand on ne fait que décider', () => {
    const before = document.documentElement.outerHTML;
    resolveTheme({ ...base, backgroundType: 'gradient', gradientId: 'true-sunset' });
    expect(document.documentElement.outerHTML).toBe(before);
  });
});

describe('applyThemePlan — l’unique écrivain', () => {
  function fakeRoot() {
    const attributes = new Map<string, string>([['data-theme', 'light']]);
    const vars = new Map<string, string>([['--color-primary', 'old']]);
    const calls: string[] = [];
    return {
      attributes,
      vars,
      calls,
      setAttribute: (k: string, v: string) => {
        calls.push(`set:${k}`);
        attributes.set(k, v);
      },
      removeAttribute: (k: string) => {
        calls.push(`rm:${k}`);
        attributes.delete(k);
      },
      style: {
        setProperty: (k: string, v: string) => {
          calls.push(`set:${k}`);
          vars.set(k, v);
        },
        removeProperty: (k: string) => {
          calls.push(`rm:${k}`);
          vars.delete(k);
        },
      },
    };
  }

  it('retire avant de poser, pour qu’une valeur ne se fasse pas effacer', () => {
    const root = fakeRoot();
    const plan: ThemePlan = resolveTheme({ ...base, backgroundType: 'image', colorThemeId: 'esprit-feu', accentValues: accent });
    applyThemePlan(root, plan);
    expect(root.attributes.get('data-preset')).toBe('lara-red');
    expect(root.attributes.get('data-theme-image')).toBe('on');
    expect(root.vars.get('--color-primary')).toBe('#e6067a');
    expect(root.calls.indexOf('rm:--color-primary')).toBeLessThan(root.calls.indexOf('set:--color-primary'));
  });

  it('efface réellement l’accent quand on revient au preset seul', () => {
    const root = fakeRoot();
    root.vars.set('--theme-image', 'url(/x.png)');
    root.attributes.set('data-theme-image', 'on');
    applyThemePlan(root, resolveTheme(base));
    expect(root.vars.get('--theme-image')).toBeUndefined();
    expect(root.attributes.get('data-theme-image')).toBeUndefined();
    expect(root.vars.get('--color-primary')).toBeUndefined();
    // Le mode de thème lui-même n'est jamais touché par le plan.
    expect(root.attributes.get('data-theme')).toBe('light');
  });
});

describe('L5 — un seul écrivain dans le code', () => {
  const root = resolve(__dirname, '../..');
  const themeManager = readFileSync(resolve(root, 'src/components/ThemeManager.tsx'), 'utf8');

  it('ThemeManager ne pose plus d’attribut ni de variable lui-même', () => {
    expect(themeManager).not.toMatch(/setAttribute\(/);
    expect(themeManager).not.toMatch(/style\.setProperty\(/);
    expect(themeManager).not.toMatch(/style\.removeProperty\(/);
    expect(themeManager).toMatch(/applyThemeToDocument\(/);
    expect(themeManager).toMatch(/resolveTheme\(/);
  });

  it('theme-presets passe par l’écrivain unique', () => {
    const presets = readFileSync(resolve(root, 'src/theme/theme-presets.ts'), 'utf8');
    expect(presets).not.toMatch(/document\.documentElement/);
    expect(presets).toMatch(/applyThemeToDocument\(/);
  });
});
