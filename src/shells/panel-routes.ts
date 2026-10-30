/**
 * Où le panneau secondaire de bureau a une utilité réelle.
 *
 * Une seule liste, lue par le shell (qui le monte) et par le contexte (qui
 * l'annonce aux écrans). Deux copies de cette règle finiraient par diverger :
 * un écran croirait avoir un panneau qui n'existe pas.
 */

export const READING_PANEL_ROUTES = [
  '/bible',
  '/memorization',
  '/memory',
  '/review/session',
  '/review/queue',
  '/comparison',
] as const;

export function isReadingRoute(pathname: string): boolean {
  return READING_PANEL_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
