/**
 * Bible reading font registry — the 10 selectable reading typefaces and the
 * CSS variables that drive the manuscript rendering (`.verse-flow`, etc.).
 *
 * Fonts are self-hosted via @fontsource (npm) so the app stays offline-first:
 * each family ships its woff2 files inside the bundle and is lazy-loaded only
 * when the user picks it (`loadBibleFont`), keeping the initial chunk lean.
 *
 * The live values are written to `<html>` as `--reading-*` CSS vars by
 * `applyReadingVars` (called from ThemeManager on every change of the
 * appearance store's bibleFont* fields). `globals.css` consumes those vars
 * with static fallbacks so the UI stays readable even before hydration.
 */

export interface BibleFontEntry {
  /** Stable id persisted in the appearance store (bibleFontFamily). */
  id: string;
  /** Display label, also the i18n key suffix (`settings.fontFamily.<id>`). */
  label: string;
  /** CSS font-family stack used in the rendered text. */
  family: string;
}

export const BIBLE_FONTS: BibleFontEntry[] = [
  { id: 'source-serif-4', label: 'Source Serif 4', family: "'Source Serif 4', Georgia, serif" },
  { id: 'lora', label: 'Lora', family: "'Lora', Georgia, serif" },
  { id: 'eb-garamond', label: 'EB Garamond', family: "'EB Garamond', Georgia, serif" },
  { id: 'crimson-pro', label: 'Crimson Pro', family: "'Crimson Pro', Georgia, serif" },
  { id: 'libre-baskerville', label: 'Libre Baskerville', family: "'Libre Baskerville', Georgia, serif" },
  { id: 'spectral', label: 'Spectral', family: "'Spectral', Georgia, serif" },
  { id: 'bitter', label: 'Bitter', family: "'Bitter', Georgia, serif" },
  { id: 'merriweather', label: 'Merriweather', family: "'Merriweather', Georgia, serif" },
  { id: 'noto-serif', label: 'Noto Serif', family: "'Noto Serif', Georgia, serif" },
  { id: 'playfair-display', label: 'Playfair Display', family: "'Playfair Display', Georgia, serif" },
];

export const DEFAULT_BIBLE_FONT_ID = BIBLE_FONTS[0].id;

/** Lazy-load the given @fontsource family (weight 400 + 600/700 where it
 *  exists). Vite resolves each import to its bundled woff2 assets. */
const FONT_MODULES: Record<string, () => Promise<unknown>> = {
  'source-serif-4': () => import('@fontsource/source-serif-4/400.css'),
  lora: () => import('@fontsource/lora/400.css'),
  'eb-garamond': () => import('@fontsource/eb-garamond/400.css'),
  'crimson-pro': () => import('@fontsource/crimson-pro/400.css'),
  'libre-baskerville': () => import('@fontsource/libre-baskerville/400.css'),
  spectral: () => import('@fontsource/spectral/400.css'),
  bitter: () => import('@fontsource/bitter/400.css'),
  merriweather: () => import('@fontsource/merriweather/400.css'),
  'noto-serif': () => import('@fontsource/noto-serif/400.css'),
  'playfair-display': () => import('@fontsource/playfair-display/400.css'),
};

export function findBibleFont(id: string | null | undefined): BibleFontEntry {
  return BIBLE_FONTS.find((f) => f.id === id) ?? BIBLE_FONTS[0];
}

/**
 * Load the chosen family's webfont if not already in the module cache.
 * No-op for unknown ids (the CSS stack falls back to Georgia).
 */
export function loadBibleFont(id: string): Promise<void> {
  const load = FONT_MODULES[id];
  if (!load) return Promise.resolve();
  return load().then(() => undefined);
}

export interface ReadingVars {
  family: string;
  /** px */
  size: number;
  /** unitless multiplier */
  lineHeight: number;
  /** em */
  letterSpacing: number;
  /** column width in `em` (approx. character count) */
  lineLength: number;
}

/**
 * Write the live reading values onto <html> as `--reading-*` vars.
 * Safe no-op in non-DOM environments (tests).
 */
export function applyReadingVars(vars: ReadingVars): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--reading-font-family', vars.family);
  root.style.setProperty('--reading-font-size', `${vars.size}px`);
  root.style.setProperty('--reading-line-height', String(vars.lineHeight));
  root.style.setProperty('--reading-letter-spacing', `${vars.letterSpacing}em`);
  root.style.setProperty('--reading-line-length', `${vars.lineLength}em`);
}

/**
 * Six polices d'INTERFACE sélectionnables (personnalisation) — familles
 * élégantes déjà auto-hébergées via @fontsource, chargées à la demande
 * avec le même chargeur que les polices de lecture.
 */
export interface UiFontEntry { id: string; label: string; family: string; style: string }
export const UI_FONTS: UiFontEntry[] = [
  // `system` ne force aucune police : l'interface suit `--font-sans` du preset
  // actif (Inter pour le thème par défaut, Geist pour Emerald, etc.).
  { id: 'system', label: 'Police du thème', family: '', style: 'Suit le thème choisi' },
  { id: 'playfair-display', label: 'Playfair — Éditorial', family: "'Playfair Display', Georgia, serif", style: 'Élégant, haut de gamme' },
  { id: 'lora', label: 'Lora — Littéraire', family: "'Lora', Georgia, serif", style: 'Doux et chaleureux' },
  { id: 'spectral', label: 'Spectral — Raffiné', family: "'Spectral', Georgia, serif", style: 'Fin et précieux' },
  { id: 'crimson-pro', label: 'Crimson — Classique', family: "'Crimson Pro', Georgia, serif", style: 'Traditionnel et noble' },
  { id: 'merriweather', label: 'Merriweather — Lecture', family: "'Merriweather', Georgia, serif", style: 'Robuste et lisible' },
];
export function findUiFont(id: string | null | undefined): UiFontEntry {
  return UI_FONTS.find((f) => f.id === id) ?? UI_FONTS[0];
}

/** Famille à POSER explicitement, ou `undefined` pour laisser le thème décider. */
export function uiFontFamilyOf(id: string | null | undefined): string | undefined {
  const font = findUiFont(id);
  return font.id === 'system' || !font.family ? undefined : font.family;
}
