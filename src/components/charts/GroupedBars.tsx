/**
 * Barres groupées — deux séries comparées côte à côte.
 *
 * Ici : cette semaine contre la semaine précédente, jour par jour. Deux
 * couleurs, deux épaisseurs de barre, une légende explicite : on compare des
 * hauteurs voisines, ce qu'une superposition ne permet pas de faire.
 */

export interface GroupedBarsProps {
  labels: string[];
  seriesA: { label: string; values: number[]; color: string };
  seriesB: { label: string; values: number[]; color: string };
  height?: number;
}

export function GroupedBars({ labels, seriesA, seriesB, height = 120 }: GroupedBarsProps) {
  const max = Math.max(1, ...seriesA.values, ...seriesB.values);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {labels.map((label, index) => (
          <div key={`${label}-${index}`} className="flex h-full flex-1 items-end justify-center gap-[3px]">
            <span
              className="w-1.5 rounded-t-[3px] transition-[height] duration-300 motion-reduce:transition-none"
              style={{
                height: `${Math.max(seriesA.values[index] > 0 ? 6 : 2, (seriesA.values[index] / max) * 100)}%`,
                backgroundColor: seriesA.color,
                opacity: 0.85,
              }}
              title={`${seriesA.label} · ${label} : ${seriesA.values[index]}`}
            />
            <span
              className="w-1.5 rounded-t-[3px] transition-[height] duration-300 motion-reduce:transition-none"
              style={{
                height: `${Math.max(seriesB.values[index] > 0 ? 6 : 2, (seriesB.values[index] / max) * 100)}%`,
                backgroundColor: seriesB.color,
                opacity: 0.55,
              }}
              title={`${seriesB.label} · ${label} : ${seriesB.values[index]}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-2xs text-text-muted">
        {labels.map((label, index) => (
          <span key={`${label}-axis-${index}`} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-2xs">
        {[seriesA, seriesB].map((series) => (
          <li key={series.label} className="flex items-center gap-1.5 text-text-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
