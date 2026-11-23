/**
 * SkipLink — le premier élément focusable de la page.
 *
 * Pourquoi il manquait : le playbook (H01) exige que tout soit utilisable au
 * clavier sans piège. Or `MobileShell` monte un tiroir, `DesktopRail` monte
 * un rail de neuf entrées, puis `DesktopHeader` cinq commandes : au clavier,
 * atteindre le contenu d'un écran profond demandait de tabuler une vingtaine
 * de fois, à CHAQUE navigation. Le lien n'existe pas pour les utilisateurs de
 * souris ou de lecteur d'écran à la souris : il n'apparaît qu'au focus clavier.
 *
 * Ce qu'il fait, et rien de plus :
 *  - il pointe vers `#main-content`, la région nommée que les deux coquilles
 *    portent déjà (`<main aria-label="Contenu de l'écran">` pour mobile et
 *    bureau) ;
 *  - il déplace le focus sur la cible après le saut, sinon le focus reste sur
 *    le lien (Safari et certains lecteurs d'écran ignorent le `href="#…"`
 *    seul) ;
 *  - il est visuellement caché, mais il redevient visible au focus clavier :
 *    un lien d'évitement invisible au focus ne sert à rien.
 */
import { useTranslation } from 'react-i18next';

export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href="#main-content"
      className="skip-link"
      onClick={(event) => {
        const target = document.getElementById('main-content');
        if (!target) return;
        event.preventDefault();
        target.focus({ preventScroll: false });
        target.scrollIntoView({ block: 'start' });
      }}
    >
      {t('shell.skipToContent', 'Aller au contenu')}
    </a>
  );
}

export default SkipLink;
