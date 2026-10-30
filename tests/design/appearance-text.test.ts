import { describe, expect, it } from 'vitest';
import { APPEARANCE_UI_FONTS, APPEARANCE_READING_FONTS, findBibleFont, uiFontFamilyOf } from '@/theme/theme-fonts';
import { resolveTheme } from '@/theme/resolve-theme';
import { useAppearanceStore } from '@/store/appearance-store';

describe('onglet Texte', () => {
  it('propose trois polices interface et six polices lecture sans perdre les anciens identifiants', () => {
    expect(APPEARANCE_UI_FONTS.map((font) => font.id)).toEqual(['system', 'lora', 'spectral']);
    expect(APPEARANCE_READING_FONTS).toHaveLength(6);
    expect(new Set(APPEARANCE_READING_FONTS.map((font) => font.id)).size).toBe(6);
    expect(findBibleFont('spectral').id).toBe('spectral');
    expect(uiFontFamilyOf('spectral')).toContain('Spectral');
  });
  it('retire la police forcée pour retrouver celle du thème', () => {
    const base = { presetId: null, accent: '', backgroundType: 'none' as const, gradientId: null, colorThemeId: null, isDark: false, reducedTransparency: false, highContrast: false, wide: false };
    expect(resolveTheme({ ...base, uiFontFamily: uiFontFamilyOf('lora') }).vars['--font-sans']).toContain('Lora');
    expect(resolveTheme({ ...base, uiFontFamily: uiFontFamilyOf('system') }).removedVars).toContain('--font-sans');
  });
  it('réinitialise le texte sans toucher au fond, à l’accent ni au verre', () => {
    const store = useAppearanceStore.getState();
    const before = useAppearanceStore.getState();
    store.setUiFontId('lora'); store.setBibleFontFamily('lora'); store.setBibleFontSize(22);
    store.setBibleLineHeight(2); store.setBibleLetterSpacing(0.05); store.setBibleLineLength(70);
    store.resetTextSettings();
    const after = useAppearanceStore.getState();
    expect([after.uiFontId, after.bibleFontFamily, after.bibleFontSize, after.bibleLineHeight]).toEqual(['system', 'source-serif-4', 19, 1.75]);
    expect(after.backgroundType).toBe(before.backgroundType);
    expect(after.colorThemeId).toBe(before.colorThemeId);
    expect(after.fixedAccentId).toBe(before.fixedAccentId);
    expect(after.glassSettings).toEqual(before.glassSettings);
  });
});
