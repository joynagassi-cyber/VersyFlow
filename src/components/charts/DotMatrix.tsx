/**
 * Matrice de points — la régularité en pastilles.
 *
 * Une pastille par jour sur sept colonnes : pleine et foncée quand la journée
 * a été pratiquée, vide quand elle ne l'a pas été. Plus lisible qu'un chiffre
 * (« 71 % ») parce qu'on voit *où* sont les trous, pas seulement combien.
 */

export interface DotMatrixProps {
  /** Valeur de chaque jour, du plus ancien au plus récent. */
  values: number[];
  /** Nombre de colonnes (7 = une semaine par ligne). */
  columns?: number;
  color?: string;
  /** Libellés d'infobulle par point. */
  describe?: (value: number, index: number) => string;
}

export function DotMatrix({ values, columns = 7, color = 'var(--acc)', describe }: DotMatrixProps) {
  const max = Math.max(1, ...values);
  const rows: number[][] = [];
  for (let index = 0; index < values.length; index += columns) {
    rows.push(values.slice(index, index + columns));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5">
          {row.map((value, index) => {
            const globalIndex = rowIndex * columns + index;
            const intensity = value > 0 ? 0.35 + (value / max) * 0.65 : 0;
            return (
              <span
                key={index}
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    value > 0 ? `color-mix(in srgb, ${color} ${Math.round(intensity * 100)}%, var(--gc))` : 'var(--bd)',
                }}
                title={describe ? describe(value, globalIndex) : `${value}`}
              />
            );
          })}
          {row.length < columns &&
            Array.from({ length: columns - row.length }, (_, index) => (
              <span key={`pad-${index}`} className="h-2.5 w-2.5" aria-hidden="true" />
            ))}
        </div>
      ))}
    </div>
  );
}
