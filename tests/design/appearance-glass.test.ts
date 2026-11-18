import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GLASS_PRESETS, useAppearanceStore } from '@/store/appearance-store';
import { fr } from '@/i18n/locales/fr';
import { en } from '@/i18n/locales/en';

describe('onglet Glass (glassmorphisme)', () => {
  it('utilise bien backdrop-filter blur en CSS et libelle l’onglet « Glass » en FR comme en EN', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    expect(css).toMatch(/backdrop-filter:\s*blur\(var\(--glass-blur\)\)/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(var\(--gb\)\)\s*saturate\(1\.6\)/);
    expect(fr.appearanceEditor.glass).toBe('Glass');
    expect(en.appearanceEditor.glass).toBe('Glass');
    expect(fr.appearanceEditor.glassField_glassBlur).toBe('Flou Glass');
    expect(fr.appearanceEditor.glassField_glassAlpha).toBe('Opacité Glass');
    expect(fr.appearanceEditor.glassPresets).toBe('Préréglages Glass');
    expect(fr.appearanceEditor.resetGlass).toBe('Réinitialiser Glass');
  });
  it('rend les réglages accessibles même sans image et signale leur effet différé', () => {
    const screen = readFileSync('app/settings/appearance.tsx', 'utf8');
    expect(screen).toContain('<BackgroundControls showPreview={false} />');
    expect(screen).toContain('appearanceEditor.glassNeedsImage');
    expect(screen).toContain('appearance-preview-image');
  });
  it('réinitialise les quatre paramètres sans toucher au fond ni aux autres préférences', () => {
    const store = useAppearanceStore.getState();
    const before = useAppearanceStore.getState();
    store.applyGlassPreset('doux');
    store.setGlassSettings({ glassBlur: 3 });
    expect(useAppearanceStore.getState().glassPreset).toBe('custom');
    store.applyGlassPreset('equilibre');
    const after = useAppearanceStore.getState();
    expect(after.glassSettings).toEqual(GLASS_PRESETS.equilibre);
    expect(after.backgroundType).toBe(before.backgroundType);
    expect(after.fixedAccentId).toBe(before.fixedAccentId);
    expect(after.bibleFontSize).toBe(before.bibleFontSize);
    expect(after.reducedTransparency).toBe(before.reducedTransparency);
  });
  it('utilise une surface opaque lorsque la transparence est réduite', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    expect(css).toMatch(/data-transparency='reduced'\] :is\(\.g1,\.g2,\.g3\)[\s\S]*?background: var\(--gc\)/);
  });
});
