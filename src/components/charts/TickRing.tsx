/**
 * Anneau à graduations — la jauge « score » des tableaux de bord de référence.
 *
 * Trente-six tirets disposés en cercle ; la part allumée porte la valeur, la
 * part éteinte reste visible comme une échelle (on voit le chemin restant, pas
 * seulement le remplissage). Le chiffre au centre est le seul texte : pas de
 * légende à décoder.
 */

export interface TickRingProps {
  /** Valeur affichée au centre. */
  value: number | string;
  /** Proportion allumée, 0 → 1. */
  ratio: number;
  label?: string;
  size?: number;
  ticks?: number;
  color?: string;
}

export function TickRing({ value, ratio, label, size = 132, ticks = 36, color = 'var(--acc)' }: TickRingProps) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const lit = Math.round(clamped * ticks);
  const center = size / 2;
  const outer = center - 4;
  const inner = outer - 11;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="presentation" aria-hidden="true">
        {Array.from({ length: ticks }, (_, index) => {
          const angle = (Math.PI * 2 * index) / ticks - Math.PI / 2;
          const on = index < lit;
          return (
            <line
              key={index}
              x1={center + Math.cos(angle) * inner}
              y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * outer}
              y2={center + Math.sin(angle) * outer}
              stroke={on ? color : 'var(--bd)'}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={on ? 1 : 0.65}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-text-primary tabular-nums">{value}</span>
        {label && <span className="max-w-[80px] text-center text-2xs leading-tight text-text-muted">{label}</span>}
      </div>
    </div>
  );
}
