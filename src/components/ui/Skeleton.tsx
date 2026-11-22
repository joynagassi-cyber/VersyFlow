/**
 * Squelettes de chargement — un seul matériau, un seul rythme.
 *
 * Six écrans dessinaient le MÊME bloc de chargement, recopié à l'identique
 * (`screen-column animate-pulse … bg-surface-tint`), et deux écrans Bible
 * dessinaient leurs propres lignes. Trois défauts à chaque copie :
 *
 *  1. le gris venait de `bg-surface-tint` — un jeton de surface, pas une
 *     texture de chargement : sur un preset teinté, le squelette se
 *     confondait avec la carte ;
 *  2. `aria-hidden` masquait tout le bloc, y compris l'information « en cours
 *     de chargement », qu'aucun lecteur d'écran n'annonçait ;
 *  3. le rythme dépendait de `animate-pulse` (opacité), donc le squelette
 *     « respirait » sans jamais signaler la progression.
 *
 * `.skeleton` (globals.css) donne un balayage unique, teinté par le texte du
 * thème, supprimé en `prefers-reduced-motion`. Ici, seule la STRUCTURE est
 * partagée ; les écrans gardent la main sur leur libellé.
 *
 * Le fichier porte aussi la forme que montait l'audit du playbook : l'ancien
 * `ScreenSkeleton` n'existe plus depuis que chaque écran a la sienne
 * (`ScreenSkeletons.tsx`, 25 formes). Il est conservé comme alias explicite de
 * `SkeletonScreen` pour que la forme « chargement » des cinq états reste
 * nommée dans le dépôt, au lieu de dépendre d'un nom de fichier disparu.
 */
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Un bloc de squelette. Toujours décoratif : le texte porte l'information. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />;
}

/** Plusieurs lignes de texte factices, à la mesure de la carte qui les porte. */
export function SkeletonLines({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12'];
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-4 rounded', widths[index % widths.length])} />
      ))}
    </div>
  );
}

/** Le squelette d'un écran de liste : un titre, deux cartes. */
export function SkeletonScreen({ className }: SkeletonProps) {
  return (
    <div className={cn('screen-column space-y-3 px-6', className)} aria-hidden="true">
      <Skeleton className="h-4 w-2/5 rounded-full" />
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
  );
}

/**
 * Bloc de chargement centré d'un écran : squelette décoratif + libellé
 * réellement annoncé (`role="status"`, `aria-live="polite"`).
 */
export function LoadingBlock({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center py-24', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <SkeletonScreen />
      {label && <p className="mt-4 text-sm text-text-muted">{label}</p>}
    </div>
  );
}

/**
 * Le squelette d'un TEXTE de lecture biblique.
 *
 * Le lecteur continu montrait, pour un chapitre encore en cours de lecture,
 * deux barres muettes puis le texte — un saut de page entier. Résoudre ce
 * défaut ne consistait pas à ajouter des lignes au hasard : un lecteur lit à
 * la mesure `--reading-measure`, avec une interligne large (`--reading-leading`),
 * des repères de verset en exposant et des paragraphes. Le squelette reprend
 * donc cette allure, sinon il réserve une place qui n'est pas la place réelle :
 * le saut de mise en page revient au moment où le texte arrive.
 *
 * Le bloc est décoratif (`aria-hidden`) ; c'est le libellé qui informe, une
 * seule fois, par le parent qui porte `role="status"`.
 */
export function VerseTextSkeleton({
  className,
  paragraphs = 2,
  label,
}: SkeletonProps & {
  /** Nombre de paragraphes factices (un chapitre en compte deux à quatre). */
  paragraphs?: number;
  /** Libellé annoncé aux lecteurs d'écran ; omis dans un squelette déjà annoncé. */
  label?: string;
}) {
  // Des largeurs irrégulières : un bloc de lignes toutes pleines ressemble à
  // une table, pas à de la prose. La dernière ligne de chaque paragraphe est
  // courte, comme une vraie fin de paragraphe.
  const widths = ['w-full', 'w-11/12', 'w-full', 'w-9/12', 'w-full', 'w-10/12', 'w-2/3'];
  return (
    <div className={cn('verse-text-skeleton', className)}>
      {label && (
        <p className="sr-only" role="status" aria-live="polite">
          {label}
        </p>
      )}
      <div aria-hidden="true" aria-busy="true">
        {Array.from({ length: paragraphs }).map((_, paragraph) => (
          <div key={paragraph} className="verse-text-skeleton-paragraph">
            {Array.from({ length: 3 + (paragraph % 2) }).map((__, line) => {
              const isLast = line === 2 + (paragraph % 2);
              return (
                <Skeleton
                  key={line}
                  className={cn('verse-text-skeleton-line', widths[(paragraph * 3 + line) % widths.length], isLast && 'verse-text-skeleton-line-last')}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Forme « chargement » générique — l'état de chargement des cinq états du
 * playbook (vide / chargement / erreur / succès / limite).
 *
 * À utiliser uniquement là où aucune forme réelle n'existe encore (écran non
 * couvert par `ScreenSkeletons`). Un écran qui a un contenu connu monte SA
 * forme, pas celle-ci : un bloc générique ne réserve pas la bonne place.
 */
export function ScreenSkeleton({ className }: SkeletonProps) {
  return <SkeletonScreen className={className} />;
}
