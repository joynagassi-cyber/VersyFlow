/**
 * FamilyKit — les briques d'interface des écrans Famille.
 *
 * Les 21 écrans du dossier `stitch_monochrome_pink_ui_kit/m*` partagent le même
 * vocabulaire visuel : une carte de section, une tuile de statistique, un
 * avatar d'initiale, une barre de progression, un sélecteur segmenté. Ces
 * briques sont écrites **une seule fois** ici pour que les écrans restent des
 * écrans et que les écarts entre eux se voient tout de suite.
 *
 * Aucune couleur littérale : tout passe par les jetons du thème actif
 * (`text-primary`, `bg-surface-tint`, `border-border`, …), donc un changement
 * de preset ou de thème image se propage sans retoucher un écran.
 */

import type { ReactNode } from 'react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import type { IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

/** Carte de section : titre, action éventuelle, contenu. */
export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-surface p-4 shadow-sm', className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && (
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">{title}</h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Tuile de statistique : valeur forte, libellé discret. */
export function StatTile({
  value,
  label,
  hint,
  className,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl bg-surface-tint p-3 text-center', className)}>
      <p className="text-xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

/** Avatar d'initiale, teinté par l'accent du thème. */
export function MemberAvatar({
  name,
  size = 40,
  muted = false,
  className,
}: {
  name: string;
  size?: number;
  muted?: boolean;
  className?: string;
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        muted ? 'bg-surface-tint text-text-muted' : 'bg-primary text-on-primary',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/** Barre de progression accessible (valeur annoncée, pas seulement peinte). */
export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-tint', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Sélecteur segmenté — un seul choix actif, annoncé par `aria-pressed`. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      className="flex gap-1 rounded-full bg-surface-tint p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              active ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Ligne d'information : icône, libellé, valeur. */
export function InfoRow({
  icon,
  label,
  value,
  onClick,
  trailing,
}: {
  icon?: IconSvgElement;
  label: string;
  value?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      {icon && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-tint text-primary">
          <DuoIcon icon={icon} size={16} />
        </span>
      )}
      <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
      {value !== undefined && <span className="text-sm text-text-muted">{value}</span>}
      {trailing}
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-3 py-2">{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2 text-left">
      {content}
    </button>
  );
}

/** Encart d'explication honnête : ce que l'écran montre, et d'où ça vient. */
export function HintNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-surface-tint px-3 py-2 text-xs leading-5 text-text-muted">
      {children}
    </p>
  );
}
