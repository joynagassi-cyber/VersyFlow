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
 *  - aucune couleur codée en dur : les teintes viennent de `--skeleton-base` et
 *    `--skeleton-sheen`, dérivées des jetons de surface et de texte par thème ;
 *  - **délai d'apparition** (`useDelayedFlag`, 220 ms) : un chargement rapide ne
 *    produit plus de clignotement — le bloc n'apparaît que s'il y a vraiment
 *    quelque chose à attendre ;
 *  - apparition en fondu (240 ms) : jamais de bloc qui « claque » à l'écran ;
 *  - `role="status"` + texte lisible par les lecteurs d'écran (« Chargement »),
 *    la silhouette elle-même est `aria-hidden` ;
 *  - le balayage lumineux s'arrête sous `prefers-reduced-motion` (I03) ;
 *  - pas de boucle décorative longue : deux balayages, puis repos.
 */
import { useTranslation } from 'react-i18next';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';

interface ScreenSkeletonProps {
  /** Nombre de cartes fantômes sous le titre. */
  rows?: number;
  /** `true` quand le squelette remplace un écran complet (sous l'en-tête). */
  withTitle?: boolean;
  /** Délai avant apparition, en ms. `0` force l'affichage (tests, captures). */
  delay?: number;
  /** Retire les marges externes : le squelette suit alors un conteneur déjà réglé. */
  flush?: boolean;
}

export function ScreenSkeleton({
  rows = 3,
  withTitle = true,
  delay = 220,
  flush = false,
}: ScreenSkeletonProps) {
  const { t } = useTranslation();
  const visible = useDelayedFlag(delay);

  return (
    <div
      className={`screen-skeleton screen-column-narrow${flush ? ' screen-skeleton--flush' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-visible={visible ? 'true' : 'false'}
    >
      <span className="sr-only">{t('common.loading', 'Chargement...')}</span>
      <div aria-hidden="true" className="skeleton-body">
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
 * spinner et sans boucle infinie (le balayage s'arrête au bout de deux cycles).
 * Même délai d'apparition, pour la même raison : pas de clignotement.
 */
export function SkeletonLines({
  lines = 3,
  className,
  delay = 220,
}: {
  lines?: number;
  className?: string;
  delay?: number;
}) {
  const widths = ['w-3/4', 'w-2/3', 'w-full', 'w-1/2', 'w-5/6'];
  const visible = useDelayedFlag(delay);
  return (
    <div className={`skeleton-lines ${className ?? ''}`} aria-hidden="true" data-visible={visible ? 'true' : 'false'}>
      <div className="skeleton-body space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={`skeleton-bar h-4 ${widths[index % widths.length]}`} />
        ))}
      </div>
    </div>
  );
}
