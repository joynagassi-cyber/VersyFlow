/**
 * Carte de synthèse — le format des tableaux de bord de référence : une icône,
 * un titre, une valeur qui domine, une phrase qui l'explique, et une vignette
 * qui donne le rythme sans quitter la carte.
 *
 * La vignette n'est jamais décorative : elle montre les sept derniers jours,
 * donc elle contextualise immédiatement le grand chiffre. Cliquable quand une
 * page détaille le sujet, ce qui garde la carte utile au clavier.
 */

import type { ReactNode } from 'react';
import type { Icon as IconSvgElement } from '@solar-icons/react/lib/types';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ChevronRightIcon as ChevronRight } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  icon: IconSvgElement;
  value: ReactNode;
  unit?: string;
  hint: string;
  /** Vignette (mini-graphique) rendue à droite ou dessous. */
  visual: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function StatCard({ title, icon, value, unit, hint, visual, onClick, className }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-text-secondary">
          <DuoIcon icon={icon} size={20} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{title}</span>
        {onClick && <DuoIcon icon={ChevronRight} size={16} className="shrink-0 text-text-muted" />}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="stat-card-value flex items-baseline gap-1 text-text-primary">
            {value}
            {unit && <span className="text-sm font-semibold text-text-muted">{unit}</span>}
          </p>
          <p className="mt-1 truncate text-xs text-text-muted">{hint}</p>
        </div>
        <div className="min-w-0 shrink-0">{visual}</div>
      </div>
    </>
  );

  const classes = cn('stat-card g2 rounded-2xl bg-surface p-4 text-left shadow-sm', className);

  return onClick ? (
    <button type="button" onClick={onClick} className={cn(classes, 'stat-card--action')}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}
