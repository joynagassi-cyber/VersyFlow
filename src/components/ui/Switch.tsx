/**
 * Switch — interrupteur du système de design.
 *
 * Trois écrans (réglages Famille, réglages, rappels) recopiaient le même
 * `<button role="switch">` avec des classes légèrement différentes : hauteur
 * 24 px (sous la cible tactile), pouce en `bg-surface` invisible sur un preset
 * sombre, aucune transition. Ici, une seule implémentation :
 *
 *   – cible tactile de 40 × 48 px (`.touch-target`), piste de 24 px ;
 *   – `role="switch"` + `aria-checked` + nom accessible obligatoire ;
 *   – piste pleine d'accent quand actif, teinte neutre sinon ;
 *   – pouce `on-primary` sur l'accent (contraste garanti par le thème),
 *     `surface` + liseré au repos ;
 *   – mouvement ``--motion-fast`` / ``--ease-standard``, donc neutralisé par
 *     `prefers-reduced-motion` (règle globale).
 *
 * Aucune couleur littérale : tout vient des jetons du preset actif.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  /** État courant. */
  checked: boolean;
  /** Bascule demandée par l'utilisateur. */
  onCheckedChange: (checked: boolean) => void;
  /** Nom accessible — obligatoire, jamais déduit du contexte. */
  label: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch = React.memo(function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative -my-2 inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-full',
        disabled && 'opacity-45',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-6 w-11 items-center rounded-full border p-[2px]',
          'transition-colors duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
          checked ? 'border-primary bg-primary' : 'border-border bg-surface-tint',
        )}
      >
        <span
          className={cn(
            'block h-[18px] w-[18px] rounded-full',
            'transition-transform duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
            checked
              ? 'translate-x-[20px] bg-[color:var(--color-on-primary)]'
              : 'translate-x-0 bg-surface shadow-sm',
          )}
        />
      </span>
    </button>
  );
});

export default Switch;
