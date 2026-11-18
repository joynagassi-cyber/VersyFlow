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
