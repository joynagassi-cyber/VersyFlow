/**
 * useRouteFocus — déplacer le focus après une navigation, sans le voler.
 *
 * Le problème réel : dans une application à page unique, changer de route ne
 * change pas le document. Un lecteur d'écran reste donc sur le lien qu'il
 * vient d'activer — souvent dans le tiroir ou la barre latérale — et annonce
 * l'écran précédent. Le playbook (H04) demande un focus déplacé après
 * navigation ; il précise aussi « sans le voler ». Trois garde-fous en
 * découlent :
 *
 *  1. **premier rendu ignoré** : à l'ouverture, le focus reste où le
 *     navigateur l'a mis (barre d'URL, corps du document) ;
 *  2. **focus existant respecté** : si l'utilisateur a déjà placé son focus
 *     dans le nouveau contenu (champ d'un formulaire, bouton d'une boîte de
 *     dialogue), on ne le déplace pas ;
 *  3. **cible réelle** : on cible le `<h1>` de l'écran s'il existe (le titre
 *     annonce l'écran), sinon la région principale. On ne cible jamais le
 *     `body` — y déplacer le focus le renvoie au début du document.
 *
 * La cible reçoit `tabIndex={-1}` à la volée : un titre n'est pas focusable
 * par défaut, et le laisser focusable en permanence ajouterait une étape de
 * tabulation qui ne sert à rien.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteFocus(): void {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    // Le focus a déjà été posé par l'utilisateur ou par l'écran : on n'y touche
    // pas. Un `role="dialog"` ouvert garde la main, par exemple.
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && active.isConnected) {
      const insideMain = active.closest('#main-content');
      if (insideMain) return;
    }

    const main = document.getElementById('main-content');
    if (!main) return;
    const heading = main.querySelector('h1');
    const target: HTMLElement = heading ?? main;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    // Le focus est posé pour l'annonce : le défilement suit la navigation, pas
    // le focus (sinon un titre collé en haut saute sous la barre).
    main.scrollTo?.({ top: 0 });
  }, [pathname]);
}

export default useRouteFocus;
