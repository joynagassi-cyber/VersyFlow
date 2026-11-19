/**
 * Barres empilées — la composition d'une journée ou d'une semaine.
 *
 * Ici : la répartition des quatre notes FSRS (à revoir / difficile / bien /
 * facile). Chaque segment porte son total en `title` ; l'ordre va du plus
 * fragile au plus solide, donc la lecture est la même d'un écran à l'autre.
 */

export interface StackedSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface StackedBarChartProps {
  segments: StackedSegment[];
  height?: number;
  /** Affiche le total à droite. */
  showTotal?: boolean;
  totalLabel?: string;
}

export function StackedBarChart({
  segments,
  height = 18,
  showTotal = true,
  totalLabel,
}: StackedBarChartProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <div>
      <div
        className="flex w-full overflow-hidden rounded-full bg-surface-tint"
        style={{ height }}
        role="presentation"
      >
        {visible.map((segment) => (
          <span
            key={segment.key}
            style={{
              width: `${total > 0 ? (segment.value / total) * 100 : 0}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label} : ${segment.value}`}
          />
        ))}
        {visible.length === 0 && <span className="w-full" style={{ backgroundColor: 'var(--bd)' }} />}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5 text-2xs text-text-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-text-secondary">{segment.label}</span>
            <span className="font-semibold text-text-primary tabular-nums">{segment.value}</span>
          </li>
        ))}
        {showTotal && (
          <li className="ms-auto text-2xs text-text-muted">
            {totalLabel ?? 'Total'} <span className="font-bold text-text-primary tabular-nums">{total}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
