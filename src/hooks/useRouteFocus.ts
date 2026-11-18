/**
 * useRouteFocus — règle H04 du playbook UX/UI :
 * « le focus est déplacé après une navigation, sans le voler ».
 *
 * Pourquoi : en SPA, changer de route ne change pas le document ; le focus
 * reste sur le lien cliqué et le lecteur d'écran ne sait pas que l'écran a
 * changé. On déplace donc le focus sur la zone principale (`#main-content`,
 * rendue focusable par `tabIndex={-1}`), sauf si :
 *  - c'est le premier rendu (le focus doit rester où l'utilisateur l'a mis) ;
 *  - un dialogue modal est ouvert (on ne sort pas du dialogue) ;
 *  - le focus est déjà à l'intérieur de la zone principale (l'utilisateur
 *    vient de cliquer un onglet : le voler le ramènerait en haut sans raison).
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteFocus(targetId = 'main-content'): void {
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    // Un dialogue modal capte le focus : ne pas l'écraser.
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

    const active = document.activeElement;
    if (active && target.contains(active)) return;

    target.focus({ preventScroll: true });
  }, [pathname, targetId]);
}

export default useRouteFocus;
