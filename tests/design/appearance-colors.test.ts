import { describe, it, expect, afterEach } from 'vitest';
import { FIXED_ACCENTS, findFixedAccent } from '@/theme/fixed-accents';
import { PRESET_CATALOG } from '@/theme/preset-catalog';
import { resolveTheme } from '@/theme/resolve-theme';
import { accentPlan } from '@/theme/theme-presets';
import { useAppearanceStore } from '@/store/appearance-store';

const base = { presetId: null, accent: '', backgroundType: 'image' as const, gradientId: null, colorThemeId: 'nat-trees', isDark: false, reducedTransparency: false, highContrast: false, wide: false };
afterEach(() => useAppearanceStore.getState().setFixedAccentId(null));

describe('onglet Couleurs', () => {
  it('utilise six accents provenant des thèmes existants', () => {
    expect(FIXED_ACCENTS).toHaveLength(6);
    expect(new Set(FIXED_ACCENTS.map((a) => a.id)).size).toBe(6);
    for (const choice of FIXED_ACCENTS) expect(PRESET_CATALOG.find((p) => p.id === choice.id)?.primary).toBe(choice.color);
  });
  it('applique et retire l’accent fixe sans remplacer le fond image', () => {
    const choice = FIXED_ACCENTS[0];
    const fixed = resolveTheme({ ...base, fixedAccentId: choice.id });
    expect(fixed.attributes['data-fixed-accent']).toBe(choice.id);
    expect(fixed.vars['--fixed-accent']).toBe(choice.color);
    expect(fixed.vars['--tint']).toBe(choice.color);
    expect(fixed.vars['--theme-image']).toContain('nat-trees');
    const auto = resolveTheme({ ...base, fixedAccentId: null });
    expect(auto.removedVars).toContain('--fixed-accent');
    expect(auto.removedAttributes).toContain('data-fixed-accent');
    expect(auto.vars['--theme-image']).toBe(fixed.vars['--theme-image']);
  });
  it('ne laisse pas une extraction tardive écraser le voile fixe', () => {
    const values = { primary: '#123456', primaryLight: '#123456', primaryDark: '#123456', accent: '#123456', accentLight: '#123456', tint: '#987654' };
    expect(accentPlan(values, '/x.png', false, true).vars['--tint']).toBeUndefined();
    expect(accentPlan(values, '/x.png', false, false).vars['--tint']).toBe('#987654');
  });
  it('ignore les identifiants inconnus et ne modifie pas le fond', () => {
    const previous = useAppearanceStore.getState().backgroundType;
    useAppearanceStore.getState().setFixedAccentId('unknown');
    expect(useAppearanceStore.getState().fixedAccentId).toBeNull();
    expect(findFixedAccent('unknown')).toBeNull();
    expect(useAppearanceStore.getState().backgroundType).toBe(previous);
  });
});
