/**
 * ThemeManager - applies the persisted theme mode + accent color on mount and
 * on change. Mounted once in main.tsx so the correct theme & accent are in
 * place before any screen paints.
 *
 *  - Syncs `appearance-store.themeMode` into `useTheme` (drives `data-theme`).
 *  - Applies the accent preset (`--color-primary*` / `--color-accent` / Ionic)
 *    based on the chosen accent + the effective dark state.
 *  - When the accent is an image-based color theme (theme-catalog), also sets
 *    `--theme-image` so the full-screen portrait illustration is applied.
 *  - Applies the Bible reading typography (`--reading-*` vars) from the
 *    appearance store's bibleFont* fields, and lazy-loads the chosen
 *    @fontsource family so the webfont is only fetched when selected.
 */
import { useEffect, useState } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/theme/useTheme';
import { applyAccentPreset, clearAccentPreset } from '@/theme/theme-presets';
import { applyReadingVars, findBibleFont, findUiFont, loadBibleFont } from '@/theme/theme-fonts';
import { GRADIENTS } from '@/theme/tweakcn-presets';

/** Preset tweakcn appliqué quand aucun choix explicite n'est persisté. */
const DEFAULT_PRESET_ID = 'quantum-rose';

export function ThemeManager() {
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const accent = useAppearanceStore((s) => s.accent);
  const presetId = useAppearanceStore((s) => s.presetId);
  const backgroundType = useAppearanceStore((s) => s.backgroundType);
  const gradientId = useAppearanceStore((s) => s.gradientId);
  const uiFontId = useAppearanceStore((s) => s.uiFontId);
  const colorThemeId = useAppearanceStore((s) => s.colorThemeId);
  const bibleFontFamily = useAppearanceStore((s) => s.bibleFontFamily);
  const bibleFontSize = useAppearanceStore((s) => s.bibleFontSize);
  const bibleLineHeight = useAppearanceStore((s) => s.bibleLineHeight);
  const bibleLetterSpacing = useAppearanceStore((s) => s.bibleLetterSpacing);
  const bibleLineLength = useAppearanceStore((s) => s.bibleLineLength);
  const theme = useTheme();
  // Re-applique le fond image quand le viewport traverse le seuil desktop
  // (portrait mobile <-> paysage large), p.ex. rotation ou redimensionnement.
  const [viewportWide, setViewportWide] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  );
  useEffect(() => {
    const onResize = () => setViewportWide(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Follow a manual override; for 'system' the useTheme hook tracks the OS.
  useEffect(() => {
    if (themeMode === 'system') return;
    theme.setThemeMode(themeMode);
  }, [themeMode, theme]);

  // Apply the accent color for the current effective dark state, and the
  // image-based theme background (when an image theme is active).
  useEffect(() => {
    const root = document.documentElement;
    // La plateforme repose sur les presets tweakcn : il y en a TOUJOURS un
    // d'actif (défaut Quantum Rose, proche de l'identité d'origine).
    root.setAttribute('data-preset', presetId ?? DEFAULT_PRESET_ID);
    clearAccentPreset();
    // Fond d'app personnalisé : un dégradé prime sur tout le reste ; une
    // image repasse par applyAccentPreset (fond + accent extrait de l'image).
    if (backgroundType === 'gradient' && gradientId) {
      const gradient = GRADIENTS.find((g) => g.id === gradientId);
      root.setAttribute('data-app-bg', 'gradient');
      if (gradient) root.style.setProperty('--app-bg-image', gradient.css);
      root.style.removeProperty('--theme-image');
      root.removeAttribute('data-theme-image');
      return;
    }
    root.removeAttribute('data-app-bg');
    root.style.removeProperty('--app-bg-image');
    root.style.removeProperty('--theme-image');
    root.removeAttribute('data-theme-image');
    if (backgroundType === 'image' && colorThemeId) {
      applyAccentPreset(accent, theme.isDark, colorThemeId);
    }
  }, [accent, colorThemeId, presetId, backgroundType, gradientId, theme.isDark, theme, viewportWide]);

  // Bible reading typography: lazy-load the chosen webfont (offline-first,
  // only on selection change) and write the live --reading-* vars so the
  // manuscript styles in globals.css follow the user's settings.
  useEffect(() => {
    void loadBibleFont(bibleFontFamily);
  }, [bibleFontFamily]);

  // Police d'interface personnalisée : écrase --font-sans du preset.
  useEffect(() => {
    const font = findUiFont(uiFontId);
    if (font.id !== 'system') void loadBibleFont(font.id);
    document.documentElement.style.setProperty('--font-sans', font.family);
  }, [uiFontId]);

  useEffect(() => {
    applyReadingVars({
      family: findBibleFont(bibleFontFamily).family,
      size: bibleFontSize,
      lineHeight: bibleLineHeight,
      letterSpacing: bibleLetterSpacing,
      lineLength: bibleLineLength,
    });
  }, [bibleFontFamily, bibleFontSize, bibleLineHeight, bibleLetterSpacing, bibleLineLength]);

  return null;
}

export default ThemeManager;
