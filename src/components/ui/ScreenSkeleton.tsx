/**
 * ScreenSkeleton — règle E04 du playbook : « le chargement réserve la place du
 * contenu (squelette), sans faire sauter la mise en page ».
 *
 * Pourquoi pas un spinner : un spinner ne réserve aucune hauteur, donc l'écran
 * saute quand le contenu arrive (CLS, règle I02), et il n'apprend rien sur la
 * forme de ce qui vient. Le squelette dessine la silhouette réelle de l'écran
 * (titre + cartes) avec les mêmes hauteurs, puis disparaît sans décalage.
 *
 * Contraintes tenues ici :
 *  - aucune couleur codée en dur : uniquement les jetons de surface et de bord ;
 *  - `role="status"` + texte lisible par les lecteurs d'écran (« Chargement »),
 *    la silhouette elle-même est `aria-hidden` ;
 *  - l'animation de pulsation s'arrête sous `prefers-reduced-motion` (I03) ;
 *  - pas de boucle décorative longue : 1,4 s, deux cycles maximum.
 */
import { useTranslation } from 'react-i18next';

interface ScreenSkeletonProps {
  /** Nombre de cartes fantômes sous le titre. */
  rows?: number;
  /** `true` quand le squelette remplace un écran complet (sous l'en-tête). */
  withTitle?: boolean;
}

export function ScreenSkeleton({ rows = 3, withTitle = true }: ScreenSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div
      className="screen-skeleton screen-column-narrow"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t('common.loading', 'Chargement...')}</span>
      <div aria-hidden="true">
        {withTitle && <div className="skeleton-bar h-8 w-2/3" />}
        <div className="mt-3 skeleton-bar h-4 w-1/2" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-bar h-4 w-1/3" />
              <div className="mt-3 skeleton-bar h-3 w-5/6" />
              <div className="mt-2 skeleton-bar h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScreenSkeleton;

/**
 * SkeletonLines — squelette de **texte** à l'intérieur d'un bloc existant
 * (une carte, un panneau). Même rôle que `ScreenSkeleton` : réserver la place
 * exacte du contenu pour que rien ne saute quand il arrive (règle E04), sans
 * spinner et sans boucle infinie (la pulsation s'arrête au bout de deux cycles).
 */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-3/4', 'w-2/3', 'w-full', 'w-1/2', 'w-5/6'];
  return (
    <div className={`space-y-3 ${className ?? ''}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`skeleton-bar h-4 ${widths[index % widths.length]}`} />
      ))}
    </div>
  );
}
