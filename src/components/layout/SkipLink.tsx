/**
 * SkipLink — règle H01 du playbook UX/UI : tout est utilisable au clavier.
 *
 * Sans lien d'évitement, atteindre le contenu au clavier oblige à traverser
 * l'en-tête, le rail et les onglets à chaque écran. Le lien est le premier
 * élément focusable du document ; il n'est visible qu'au focus (`:focus-visible`
 * dans `globals.css`), donc il ne change rien au rendu à la souris.
 */
import { useTranslation } from 'react-i18next';

export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const { t } = useTranslation();
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {t('a11y.skipToContent', 'Aller au contenu principal')}
    </a>
  );
}

export default SkipLink;
