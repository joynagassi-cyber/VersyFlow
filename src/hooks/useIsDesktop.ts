import { useEffect, useState } from 'react';

/**
 * Point de rupture bureau — une seule source.
 *
 * Monatage piloté par React, style piloté par le CSS : c'est ce seuil qui
 * décide si le rail existe dans le DOM (pas un `display:none`, qui laisserait
 * la navigation lisible par un lecteur d'écran et captable au clavier).
 */
export const DESKTOP_MIN_WIDTH = 1024;

const QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

function current(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(current);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    // Re-synchronise au montage (le premier rendu peut précéder le listener).
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
