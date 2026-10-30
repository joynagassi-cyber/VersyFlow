/**
 * L5 — `resolveTheme` : la décision de thème, séparée de son application.
 *
 * Avant ce module, la décision (« quel preset, quel fond, quelles variables »)
 * et l'écriture dans le DOM étaient mélangées dans `ThemeManager` et dans
 * `theme-presets.ts`, chacun posant ses propres attributs et variables. Deux
 * écrivains, donc deux vérités possibles.
 *
 * Désormais :
 *   1. `resolveTheme(state)` est PURE : aucun accès au DOM, au stockage, au
 *      temps. Elle prend un état complet et rend un `ThemePlan` (attributs à
 *      poser, attributs à retirer, variables à poser, variables à retirer).
 *      Elle est donc testable sans navigateur, cas par cas.
 *   2. `applyThemePlan(root, plan)` est le SEUL endroit qui écrit ces
 *      attributs et variables sur l'élément racine.
 *
 * La typographie de lecture (`--reading-*`) garde son propre écrivain
 * (`theme-fonts.applyReadingVars`) : c'est un réglage de lecture, pas un thème.
 */
import { GRADIENTS } from './tweakcn-presets';
import { DEFAULT_VENDORED_PRESET_ID } from './vendored-themes';
import { themeLandscapeUrl, themePortraitUrl } from './theme-catalog';

/** Preset tweakcn appliqué quand aucun choix explicite n'est persisté. */
/**
 * Thème appliqué au premier lancement : `lara-red`, c'est-à-dire le thème
 * tweakcn `cmvukmb1k000004iifp7x5wji` (Inter / Noto Serif Georgian / JetBrains
 * Mono, radius 0.5rem, primaire rouge oklch(0.6370 0.2370 25.3310)).
 * La valeur vient du fichier généré, jamais d'une chaîne recopiée à la main.
 */
export const DEFAULT_PRESET_ID = DEFAULT_VENDORED_PRESET_ID;

export type BackgroundType = 'none' | 'gradient' | 'image';

/** Couleurs d'accent résolues (preset ou extraction depuis l'image). */
export interface ResolvedAccent {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentSecondary?: string;
  tint?: string;
  primaryForeground?: string;
}

export interface ThemeInput {
  presetId: string | null;
  accent: string;
  backgroundType: BackgroundType;
  gradientId: string | null;
  colorThemeId: string | null;
  isDark: boolean;
  reducedTransparency: boolean;
  highContrast: boolean;
  /** Famille de police d'interface déjà résolue (vide = ne pas toucher). */
  uiFontFamily?: string;
  /** Largeur ≥ 1024 px : le fond image passe du portrait au paysage. */
  wide: boolean;
  /**
   * Couleurs de l'accent d'image, quand elles sont connues. Absent = on ne
   * touche pas aux variables d'accent (l'extraction est asynchrone).
   */
  accentValues?: ResolvedAccent | null;
}

export interface ThemePlan {
  attributes: Record<string, string>;
  removedAttributes: string[];
  vars: Record<string, string>;
  removedVars: string[];
}

/** Variables d'accent posées par un thème image (et retirées sinon). */
export const ACCENT_VARS = [
  '--color-primary',
  '--color-primary-light',
  '--color-primary-dark',
  '--color-accent',
  '--color-accent-light',
  '--ion-color-primary',
  '--ion-color-secondary',
  '--primary',
  '--ring',
  '--accent',
  '--tint',
  '--primary-foreground',
  '--color-primary-foreground',
] as const;

export function accentVars(values: ResolvedAccent): Record<string, string> {
  const vars: Record<string, string> = {
    '--color-primary': values.primary,
    '--color-primary-light': values.primaryLight,
    '--color-primary-dark': values.primaryDark,
    '--color-accent': values.accent,
    '--color-accent-light': values.accentLight,
    '--ion-color-primary': values.primary,
    '--ion-color-secondary': values.accent,
    '--primary': values.primary,
    '--ring': values.primary,
    '--accent': values.accentSecondary ?? values.accent,
  };
  if (values.tint) vars['--tint'] = values.tint;
  if (values.primaryForeground) {
    vars['--primary-foreground'] = values.primaryForeground;
    vars['--color-primary-foreground'] = values.primaryForeground;
  }
  return vars;
}

/**
 * Décide du thème. Fonction pure : mêmes entrées → même plan, sans DOM.
 */
export function resolveTheme(input: ThemeInput): ThemePlan {
  const attributes: Record<string, string> = {
    'data-preset': input.presetId ?? DEFAULT_PRESET_ID,
  };
  const removedAttributes: string[] = ['data-app-bg', 'data-theme-image', 'data-theme-image-mode'];
  const vars: Record<string, string> = {};
  const removedVars: string[] = [...ACCENT_VARS, '--app-bg-image', '--theme-image'];

  // Accessibilité : deux états globaux lus par le CSS. Le verre est un
  // confort, jamais une condition de lisibilité.
  if (input.reducedTransparency) attributes['data-transparency'] = 'reduced';
  else removedAttributes.push('data-transparency');
  if (input.highContrast) attributes['data-contrast'] = 'high';
  else removedAttributes.push('data-contrast');

  if (input.uiFontFamily) vars['--font-sans'] = input.uiFontFamily;

  // 1. Un dégradé prime sur tout le reste : il remplace le fond, et aucun
  //    accent n'est écrasé (les couleurs viennent du preset tweakcn actif).
  if (input.backgroundType === 'gradient' && input.gradientId) {
    attributes['data-app-bg'] = 'gradient';
    removedAttributes.push('data-theme-image', 'data-theme-image-mode');
    const gradient = GRADIENTS.find((g) => g.id === input.gradientId);
    if (gradient) vars['--app-bg-image'] = gradient.css;
    return finalize({ attributes, removedAttributes, vars, removedVars });
  }

  // 2. Thème image : l'illustration est le fond, l'accent en est tiré.
  //
  // L'IMAGE N'ATTEND PAS L'ACCENT. L'échantillonnage des pixels est
  // asynchrone (et peut échouer : image pas encore décodée, canvas refusé) ;
  // l'ancienne version ne posait `--theme-image` que si `accentValues` était
  // déjà connu, et retirait la variable sinon — le fond restait donc absent
  // tant que l'accent n'était pas calculé, et redevenait absent à chaque
  // changement de largeur avant la fin de l'échantillonnage. Le fond est une
  // décision synchrone : il est toujours posé. Les accents, eux, restent
  // optionnels et se posent quand ils arrivent.
  if (input.backgroundType === 'image' && input.colorThemeId) {
    if (input.accentValues) Object.assign(vars, accentVars(input.accentValues));
    vars['--theme-image'] = `url(${imagePath(input.colorThemeId, input.wide)})`;
    attributes['data-theme-image'] = 'on';
    attributes['data-theme-image-mode'] = input.isDark ? 'dark' : 'light';
    return finalize({ attributes, removedAttributes, vars, removedVars });
  }

  // 3. Sinon : preset tweakcn seul, aucune variable d'accent maison.
  return finalize({ attributes, removedAttributes, vars, removedVars });
}

/** Portrait sous 1024 px, paysage au-delà. */
export function imagePath(id: string, wide: boolean): string {
  return wide ? themeLandscapeUrl(id) : themePortraitUrl(id);
}

/** Une clé posée ne doit jamais figurer dans la liste des retraits. */
function dedupe(removed: string[], applied: Record<string, string>): string[] {
  return [...new Set(removed)].filter((key) => !(key in applied));
}

/**
 * Dernier passage : dédoublonne les retraits et retire des listes toute clé
 * qui est posée. Un plan ne se contredit donc jamais — c'est une propriété
 * du résolveur, pas une discipline de l'appelant.
 */
function finalize(plan: ThemePlan): ThemePlan {
  return {
    attributes: plan.attributes,
    removedAttributes: dedupe(plan.removedAttributes, plan.attributes),
    vars: plan.vars,
    removedVars: dedupe(plan.removedVars, plan.vars),
  };
}

/**
 * Le seul écrivain. Applique un plan : retraits d'abord, poses ensuite, pour
 * qu'une valeur remplacée ne soit jamais effacée par son propre nettoyage.
 */
export function applyThemePlan(
  root: { setAttribute: (k: string, v: string) => void; removeAttribute: (k: string) => void; style: { setProperty: (k: string, v: string) => void; removeProperty: (k: string) => void } },
  plan: ThemePlan,
): void {
  for (const key of plan.removedVars) root.style.removeProperty(key);
  for (const key of plan.removedAttributes) root.removeAttribute(key);
  for (const [key, value] of Object.entries(plan.attributes)) root.setAttribute(key, value);
  for (const [key, value] of Object.entries(plan.vars)) root.style.setProperty(key, value);
}

/** Applique un plan au document courant (no-op hors navigateur). */
export function applyThemeToDocument(plan: ThemePlan): void {
  if (typeof document === 'undefined') return;
  applyThemePlan(document.documentElement, plan);
}
