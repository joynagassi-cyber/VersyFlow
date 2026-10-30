import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GLASS_PRESETS, useAppearanceStore } from '@/store/appearance-store';

describe('onglet Verre', () => {
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
