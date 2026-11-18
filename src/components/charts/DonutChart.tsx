/**
 * Anneau (donut) — la part de chaque statut dans le total.
 *
 * Un seul chiffre au centre (le total), les segments autour, et une légende
 * chiffrée fournie par l'appelant : la couleur ne porte jamais l'information
 * seule. Les arcs sont dessinés en `stroke-dasharray` sur des cercles, ce qui
 * donne des extrémités nettes sans calcul de chemin.
 */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  slices: DonutSlice[];
  /** Grand chiffre au centre. */
  centerValue: string | number;
  centerLabel?: string;
  size?: number;
  thickness?: number;
}

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  size = 128,
  thickness = 14,
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-tint)"
          strokeWidth={thickness}
        />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {slices.map((slice) => {
            const fraction = total > 0 ? Math.max(0, slice.value) / total : 0;
            const length = fraction * circumference;
            const dash = `${length} ${circumference - length}`;
            const circle = (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              >
                <title>{`${slice.label} : ${slice.value}`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-text-primary tabular-nums">{centerValue}</span>
        {centerLabel && <span className="text-2xs text-text-muted">{centerLabel}</span>}
      </div>
    </div>
  );
}
