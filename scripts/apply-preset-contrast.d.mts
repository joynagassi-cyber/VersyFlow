/**
 * Types des helpers exportés par `apply-preset-contrast.mjs`, réutilisés par
 * `scripts/import-vendored-themes.mjs` et par les tests de design (le module
 * n'a plus d'effet de bord à l'import : voir la garde IS_MAIN).
 */
export const TARGET: number;
export function hexToRgb(hex: string): [number, number, number];
export function rgbToHex(rgb: [number, number, number]): string;
export function luminance(hex: string): number;
export function contrast(a: string, b: string): number;
export function rgbToHsl(rgb: [number, number, number]): [number, number, number];
export function hslToRgb(hsl: [number, number, number]): [number, number, number];
export interface PairFix {
  bg: string;
  fg: string;
  ratio: number;
  changed: boolean;
  reason: string;
}
export function ensurePair(bg: string, fg: string, label?: string): PairFix;
