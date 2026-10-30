import * as React from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { DuoIcon } from '@/components/ui/DuoIcon';
import type { Icon as IconSvgElement } from '@solar-icons/react/lib/types';
import { StarIcon } from '@/components/ui/solar-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Icône Solar (composant) ou nœud déjà rendu — les deux formes existent
   * dans les écrans ; les deux sont acceptées, rendues à la même taille.
   */
  icon?: IconSvgElement | React.ReactNode;
  /** Ancien point d'entrée (nœud libre) — conservé pour les écrans existants. */
  children?: React.ReactNode;
  showLogo?: boolean;
  /**
   * `outline` (défaut) : l'état occupe un emplacement à remplir, cadre
   * pointillé. `inline` : l'état vit DANS une carte déjà dessinée (réglages,
   * liste de section) — pas de second cadre.
   */
  tone?: 'outline' | 'inline';
  className?: string;
}

/**
 * État vide — un seul vocabulaire pour les 40 écrans qui en ont un.
 *
 * Trois défauts étaient recopiés à l'identique dans les écrans :
 *   1. l'icône était parfois un emoji (« 👨‍👩‍👧‍👦 »), parfois un SVG, parfois un
 *      point d'interrogation : trois iconographies pour le même rôle ;
 *   2. le titre et la description n'avaient ni la même taille ni le même
 *      espacement, et la description dépassait la mesure de lecture ;
 *   3. l'action était tantôt un `<button>` bleu, tantôt un lien texte.
 *
 * Ici : une pastille d'icône neutre (`.icon-chip`), un titre dans la serif du
 * preset (`.empty-title`), une description bornée à 34 caractères de mesure, et l'action
 * qui réutilise le `Button` de l'application. Le cadre pointillé signale un
 * emplacement à remplir ; `tone="inline"` le retire quand l'état vit DANS une
 * carte (réglages, listes de section).
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  children,
  showLogo,
  tone = 'outline',
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        tone === 'outline' && 'rounded-2xl border border-dashed border-border',
        className,
      )}
    >
      <div className="icon-chip flex h-16 w-16 items-center justify-center rounded-full">
        {showLogo ? (
          <Logo size={40} />
        ) : React.isValidElement(icon) ? (
          icon
        ) : icon ? (
          <DuoIcon icon={icon as IconSvgElement} size={28} />
        ) : (
          (children ?? <DuoIcon icon={StarIcon} size={26} className="text-text-muted" />)
        )}
      </div>
      <p className="empty-title">{title}</p>
      {description && (
        <p className="max-w-[34ch] text-sm leading-relaxed text-text-muted">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button type="button" size="sm" className="mt-1" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
