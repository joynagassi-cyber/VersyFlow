import { useEffect, useState } from 'react';

/**
 * Vrai après `delay` millisecondes.
 *
 * Sert aux **squelettes de chargement** : sans délai, tout chargement rapide
 * (cache chaud, navigation interne, données déjà en mémoire) faisait apparaître
 * puis disparaître la silhouette dans la même fraction de seconde — un
 * clignotement gris perçu comme un défaut d'affichage, jamais comme un
 * chargement. Sous ce seuil, on ne montre rien : le contenu arrive avant que
 * l'œil ait eu le temps de voir une intention.
 *
 * 220 ms est le point d'équilibre retenu : en dessous (~100 ms) la perception
 * est « instantanée » ; au-delà (~1 s) l'utilisateur a besoin de savoir que
 * quelque chose se passe.
 *
 * Le minuteur est annulé au démontage : un écran qui démonte son squelette
 * avant le délai ne laisse aucun `setState` en vol.
 */
export function useDelayedFlag(delay = 220): boolean {
  const [ready, setReady] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return ready;
}

export default useDelayedFlag;
