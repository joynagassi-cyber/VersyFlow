/**
 * Jauge en demi-cercle — un pourcentage unique, lu d'un geste.
 *
 * Utilisée pour la rétention et la régularité : un arc qui se remplit, un
 * chiffre au centre, une borne basse et haute nommées. L'arc suit les jetons
 * (accent ou succès), jamais une couleur figée.
 */

export interface GaugeChartProps {
  /** Pourcentage, 0 → 100. */
  value: number;
  label: string;
  /** Texte sous la jauge (ex. « 18 / 42 versets »). */
  hint?: string;
  size?: number;
  color?: string;
}

export function GaugeChart({ value, label, hint, size = 180, color = 'var(--acc)' }: GaugeChartProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // demi-cercle
  const filled = (clamped / 100) * circumference;
  const height = size / 2 + stroke;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${height}`} width="100%" className="max-w-[220px]" role="presentation">
        <path
          d={`M ${stroke / 2} ${height - stroke / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${height - stroke / 2}`}
          fill="none"
          stroke="var(--color-surface-tint)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${height - stroke / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${height - stroke / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
        />
        <text
          x={size / 2}
          y={height - stroke - 4}
          textAnchor="middle"
          fill="var(--tx)"
          fontSize="26"
          fontWeight="800"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <p className="mt-1 text-center text-sm font-semibold text-text-primary">{label}</p>
      {hint && <p className="text-center text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
