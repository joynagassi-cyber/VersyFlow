/**
 * Radar — le profil d'équilibre sur plusieurs axes.
 *
 * Sert à voir d'un coup d'œil ce qui est travaillé et ce qui ne l'est pas :
 * régularité, volume, maîtrise, révisions, ancienneté, diversité. Chaque axe
 * est normalisé de 0 à 1 par l'appelant, donc l'échelle reste honnête.
 * Les sommets portent leur valeur, les libellés restent lisibles en clair
 * comme en sombre.
 */

export interface RadarAxis {
  label: string;
  /** Valeur normalisée, 0 → 1. */
  value: number;
  /** Valeur affichable (ex. « 12 jours »). */
  display?: string;
}

export interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
  color?: string;
}

export function radarPoints(axes: RadarAxis[], radius: number, center: number): { x: number; y: number }[] {
  return axes.map((axis, index) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const value = Math.min(1, Math.max(0, axis.value));
    return {
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
    };
  });
}

export function RadarChart({ axes, size = 220, color = 'var(--acc)' }: RadarChartProps) {
  if (axes.length < 3) return null;
  const center = size / 2;
  const radius = center - 28;
  const rings = [0.25, 0.5, 0.75, 1];

  const outer = axes.map((_, index) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  });

  const shape = radarPoints(axes, radius, center);
  const polygon = shape.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[260px]" role="presentation">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={outer
            .map(({ x, y }) => `${(center + (x - center) * ring).toFixed(1)},${(center + (y - center) * ring).toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke="var(--bd)"
          strokeWidth="1"
        />
      ))}
      {outer.map(({ x, y }, index) => (
        <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="var(--bd)" strokeWidth="1" />
      ))}

      <polygon points={polygon} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {shape.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r="2.6" fill={color}>
          <title>{`${axes[index].label} : ${axes[index].display ?? axes[index].value}`}</title>
        </circle>
      ))}

      {outer.map(({ x, y }, index) => {
        const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
        const labelX = center + Math.cos(angle) * (radius + 18);
        const labelY = center + Math.sin(angle) * (radius + 18);
        return (
          <text
            key={index}
            x={labelX}
            y={labelY}
            textAnchor={Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'}
            dominantBaseline="middle"
            fill="var(--mut)"
            fontSize="10"
            fontWeight="600"
          >
            {axes[index].label}
          </text>
        );
      })}
    </svg>
  );
}
