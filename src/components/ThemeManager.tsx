/**
 * ThemeManager - applies the persisted theme mode + accent color on mount and
 * on change. Mounted once in main.tsx so the correct theme & accent are in
 * place before any screen paints.
 *
 *  - Syncs `appearance-store.themeMode` into `useTheme` (drives `data-theme`).
 *  - Rassemble l'état d'apparence et le confie à `resolveTheme` (fonction
 *    pure, `src/theme/resolve-theme.ts`) ; l'application passe par l'unique
 *    écrivain `applyThemeToDocument`. Ce composant ne pose plus aucun
 *    attribut ni aucune variable lui-même.
 *  - Thème image : l'accent est extrait de l'illustration, en asynchrone.
 *  - Applies the Bible reading typography (`--reading-*` vars) from the
 *    appearance store's bibleFont* fields, and lazy-loads the chosen
 *    @fontsource family so the webfont is only fetched when selected.
 */
import { useEffect, useState } from 'react';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/theme/useTheme';
import { applyAccentPreset } from '@/theme/theme-presets';
import { applyReadingVars, findBibleFont, findUiFont, loadBibleFont } from '@/theme/theme-fonts';
import { applyThemeToDocument, resolveTheme } from '@/theme/resolve-theme';
import { applyAppIcon } from '@/theme/app-icons';

export function ThemeManager() {
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const accent = useAppearanceStore((s) => s.accent);
  const presetId = useAppearanceStore((s) => s.presetId);
  const reducedTransparency = useAppearanceStore((s) => s.reducedTransparency);
  const highContrast = useAppearanceStore((s) => s.highContrast);
  const backgroundType = useAppearanceStore((s) => s.backgroundType);
  const gradientId = useAppearanceStore((s) => s.gradientId);
  const uiFontId = useAppearanceStore((s) => s.uiFontId);
  const appIconId = useAppearanceStore((s) => s.appIconId);
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

  /**
   * Thème : UNE décision (`resolveTheme`, pure) puis UNE écriture
   * (`applyThemeToDocument`). L'effet ne décide plus rien lui-même — il
   * rassemble l'état, ce qui rend le rendu reproductible et testable.
   */
  useEffect(() => {
    applyThemeToDocument(
      resolveTheme({
        presetId,
        accent,
        backgroundType,
        gradientId,
        colorThemeId,
        isDark: theme.isDark,
        reducedTransparency,
        highContrast,
        uiFontFamily: findUiFont(uiFontId).family,
        wide: viewportWide,
      }),
    );
    // Thème image : l'accent est échantillonné sur l'illustration, donc
    // asynchrone. Le plan ci-dessus n'y touche pas ; on le complète ici.
    if (backgroundType === 'image' && colorThemeId) {
      applyAccentPreset(accent, theme.isDark, colorThemeId);
    }
  }, [
    accent,
    backgroundType,
    colorThemeId,
    gradientId,
    highContrast,
    presetId,
    reducedTransparency,
    theme.isDark,
    theme,
    uiFontId,
    viewportWide,
  ]);

  // Bible reading typography: lazy-load the chosen webfont (offline-first,
  // only on selection change) and write the live --reading-* vars so the
  // manuscript styles in globals.css follow the user's settings.
  useEffect(() => {
    void loadBibleFont(bibleFontFamily);
  }, [bibleFontFamily]);

  // Police d'interface : le chargement du webfont vit ici, l'écriture de
  // `--font-sans` dans le plan de thème (cf. effet principal).
  useEffect(() => {
    const font = findUiFont(uiFontId);
    if (font.id !== 'system') void loadBibleFont(font.id);
  }, [uiFontId]);

  useEffect(() => {
    void applyAppIcon(appIconId);
  }, [appIconId]);

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
