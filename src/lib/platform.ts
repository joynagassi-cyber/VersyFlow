/**
 * Platform helpers shared across the app.
 *
 * - `isNativePlatform()` — guards against the Capacitor runtime: returns true
 *   only when the app is actually running inside a native WebView. Component
 *   code (e.g. `Keyboard.dismiss`) and services (e.g. the notification
 *   service) use it to pick between native plugins and web fallbacks.
 * - `colorTintAlpha` / `colorTintSurface` — CSS `color-mix()` builders for
 *   soft, translucent accent tints of design-token colors.
 */

/**
 * Returns true when running inside a Capacitor native WebView.
 *
 * Follows the same guard pattern as the other Capacitor-aware helpers in
 * the codebase: the `window.Capacitor` global is only defined on native
 * platforms, so its absence means "web fallback".
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

/**
 * A translucent tint of `color` at `alphaPct`% opacity — used for soft
 * circular icon backgrounds. `color` should be a design token value
 * (e.g. `var(--color-primary)`); the result is a plain `color-mix()`
 * expression, so both token and legacy hex values keep rendering.
 */
export function colorTintAlpha(color: string, alphaPct: number): string {
  return `color-mix(in srgb, ${color} ${alphaPct}%, transparent)`;
}

/**
 * A surface-blended tint of `color` at `pct`% strength — used for card
 * outline accents that need to read on both light and dark themes.
 */
export function colorTintSurface(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, var(--color-surface))`;
}
