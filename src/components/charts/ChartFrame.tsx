/**
 * Cadre commun des graphiques.
 *
 * Tous les graphiques du produit vivent dans ce cadre : un titre, un
 * sous-titre chiffré, une légende facultative, et — quand il n'y a rien à
 * montrer — une phrase qui dit *pourquoi* plutôt qu'un cadre vide.
 *
 * Accessibilité : le graphique est une `figure` avec un `aria-label` qui
 * résume la tendance en mots, et le détail reste disponible en `figcaption`.
 * Un lecteur d'écran n'a pas besoin de deviner une courbe : il lit
 * « 42 révisions sur 30 jours, pic à 9 le 12 octobre ».
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChartFrameProps {
  title: string;
  /** Résumé chiffré sous le titre. */
  subtitle?: string;
  /** Légende : pastille + libellé. */
  legend?: { label: string; color: string }[];
  /** Phrase lue par les lecteurs d'écran (résumé de la forme). */
  summary: string;
  /** Rendu quand il n'y a pas de données. */
  empty?: { title: string; hint?: string };
  hasData?: boolean;
  children: ReactNode;
  className?: string;
  /** Le graphique occupe deux colonnes dans la grille des stats. */
  wide?: boolean;
}

export function ChartFrame({
  title,
  subtitle,
  legend,
  summary,
  empty,
  hasData = true,
  children,
  className,
  wide,
}: ChartFrameProps) {
  return (
    <figure
      className={cn(
        'stats-chart g2 rounded-2xl bg-surface p-4 shadow-sm',
        wide && 'stats-chart--wide',
        className,
      )}
      role="group"
      aria-label={title}
    >
      <figcaption className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-md font-bold text-text-primary">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {legend && legend.length > 0 && (
          <ul className="flex shrink-0 flex-wrap justify-end gap-x-3 gap-y-1">
            {legend.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-2xs text-text-muted">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </figcaption>

      {hasData ? (
        <div className="relative" role="img" aria-label={`${title}. ${summary}`}>
          {children}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 py-6 text-center">
          <p className="text-sm font-semibold text-text-secondary">{empty?.title ?? 'Rien à afficher pour l’instant'}</p>
          {empty?.hint && <p className="text-xs text-text-muted">{empty.hint}</p>}
        </div>
      )}
    </figure>
  );
}
