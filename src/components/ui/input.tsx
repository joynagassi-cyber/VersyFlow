import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Champ texte de base — règle F01 du playbook : « chaque champ a un libellé
 * visible, relié au programme ».
 *
 * Le type est une union : soit `label` (rendu en `<label>` englobant, donc
 * relié nativement), soit `aria-label` (quand le libellé visible est déjà
 * affiché par l'écran). Il est **impossible** de compiler un champ sans nom
 * accessible — le compilateur tient la règle, pas la discipline.
 */
type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export type InputProps = BaseInputProps &
  (
    | { /** Libellé affiché au-dessus du champ. */ label: string; 'aria-label'?: string }
    | { label?: undefined; /** Nom accessible quand le libellé est déjà à l'écran. */ 'aria-label': string }
  );

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, type, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-placeholder focus:border-primary',
          className,
        )}
        {...props}
      />
    );

    if (!label) return field;

    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {field}
      </label>
    );
  },
);
Input.displayName = 'Input';

export { Input };
