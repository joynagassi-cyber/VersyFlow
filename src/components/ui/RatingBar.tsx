import { cn } from '@/lib/utils';

export interface RatingOption {
  value: number | string;
  label: string;
  hint?: string;
  className?: string;
}

interface RatingBarProps {
  options: RatingOption[];
  onSelect: (value: number | string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Generic rating row (used for the FSRS 4-button scale:
 * Again / Hard / Good / Easy). Colors are supplied per option so the caller
 * stays decoupled from the FSRS domain.
 */
export function RatingBar({ options, onSelect, disabled, className }: RatingBarProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(o.value)}
          className={cn(
            'flex flex-col items-center justify-center rounded-2xl py-3 text-xs font-semibold transition active:scale-[0.97] disabled:opacity-40',
            o.className,
          )}
        >
          <span>{o.label}</span>
          {o.hint && <span className="mt-0.5 text-[10px] font-medium opacity-80">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
