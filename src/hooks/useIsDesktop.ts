import { useEffect, useState } from 'react';

/**
 * Points de rupture — une seule source, deux seuils.
 *
 *  768 px : la tablette. Le rail de navigation apparaît (replié : les icônes
 *           suffisent, l'écran est encore étroit) et la barre d'onglets basse
 *           disparaît : jamais deux navigations montées en même temps.
 * 1024 px : le bureau. Le rail peut se déplier et le contenu cesse de
 *           s'étirer (`.screen-column`).
 */
export const TABLET_MIN_WIDTH = 700;
export const DESKTOP_MIN_WIDTH = 1100;

const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;
const TABLET_QUERY = `(min-width: ${TABLET_MIN_WIDTH}px)`;

function matches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

function useMediaQuery(query: string): boolean {
  const [result, setResult] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setResult(event.matches);
    // Re-synchronise au montage (le premier rendu peut précéder le listener).
    setResult(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return result;
}

/** ≥ 1024 px : rail dépliable, colonne de lecture. */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}

/** ≥ 768 px : le rail remplace la barre d'onglets basse (mode replié). */
export function useIsRail(): boolean {
  return useMediaQuery(TABLET_QUERY);
}
