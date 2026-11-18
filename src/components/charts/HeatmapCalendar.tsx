/**
 * Carte de chaleur des révisions — une case par jour, l'intensité porte la
 * quantité (pas la couleur seule : chaque case expose sa valeur en `title`
 * et la légende nomme les niveaux).
 *
 * Quatre paliers d'opacité calculés sur le maximum réel : une semaine calme
 * reste lisible à côté d'un pic, au lieu d'être écrasée par lui.
 */

export interface HeatmapCalendarProps {
  /** Colonnes de 7 jours, `null` = case hors calendrier. */
  cells: (number | null)[][];
  max: number;
  /** Libellés des jours (L, M, M, J, V, S, D) — déjà traduits. */
  weekdayLabels?: string[];
  /** Mois couverts, pour le repère du bas. */
  monthLabels?: string[];
}

const LEVELS = [0.16, 0.34, 0.56, 0.78, 1];

export function HeatmapCalendar({ cells, max, weekdayLabels, monthLabels }: HeatmapCalendarProps) {
  const levelOf = (count: number) => {
    if (count <= 0) return -1;
    const ratio = max > 0 ? count / max : 0;
    const index = Math.min(LEVELS.length - 1, Math.floor(ratio * LEVELS.length));
    return Math.max(0, index);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5">
        {weekdayLabels && (
          <div className="flex shrink-0 flex-col justify-between py-0 text-2xs text-text-muted" aria-hidden="true">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="h-[11px] leading-[11px]">
                {index % 2 === 1 ? label : ''}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-[3px]">
          {cells.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-[3px]">
              {column.map((count, rowIndex) => {
                const level = count === null ? -2 : levelOf(count);
                return (
                  <span
                    key={rowIndex}
                    title={count === null ? undefined : `${count}`}
                    className="heatmap-cell"
                    data-level={level}
                    style={
                      level >= 0
                        ? { backgroundColor: `color-mix(in srgb, var(--acc) ${Math.round(LEVELS[level] * 100)}%, var(--gc))` }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-2xs text-text-muted">
        <span>{monthLabels?.join(' · ')}</span>
        <span className="flex items-center gap-1">
          Moins
          {LEVELS.map((alpha) => (
            <span
              key={alpha}
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: `color-mix(in srgb, var(--acc) ${Math.round(alpha * 100)}%, var(--gc))` }}
            />
          ))}
          Plus
        </span>
      </div>
    </div>
  );
}
