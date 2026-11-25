import { EmptyState } from '@/components/feedback/EmptyState'

interface TrendChartProps {
  hours: readonly number[]
  activities: readonly number[]
  periodDays: number
}

const WIDTH = 560
const HEIGHT = 200
const X_START = 20
const X_END = 540
const BASELINE = 170
const GRID_LINES = 5

interface Point {
  x: number
  y: number
  value: number
}

function toPoints(values: readonly number[]): Point[] {
  const n = values.length
  return values.map((value, i) => ({
    x: n > 1 ? X_START + (i * (X_END - X_START)) / (n - 1) : (X_START + X_END) / 2,
    y: BASELINE - value,
    value,
  }))
}

interface SeriesProps {
  points: Point[]
  color: string
  label: string
  unit: string
}

function Series({ points, color, label, unit }: SeriesProps) {
  return (
    <g>
      <polyline
        fill="none"
        strokeWidth={2.5}
        strokeLinejoin="round"
        style={{ stroke: color }}
        points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} style={{ fill: color }}>
          <title>{`${label}: ${p.value} ${unit} (punto ${i + 1} de ${points.length})`}</title>
        </circle>
      ))}
    </g>
  )
}

export function TrendChart({ hours, activities, periodDays }: TrendChartProps) {
  if (hours.length === 0 && activities.length === 0) {
    return <EmptyState title="Sin datos en el periodo">Ajusta los filtros para ver la tendencia.</EmptyState>
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="img"
        aria-label={`Tendencia de horas activas y actividades completadas en los últimos ${periodDays} días`}
      >
        {Array.from({ length: GRID_LINES }, (_, i) => (
          <line
            key={i}
            x1={X_START}
            x2={X_END}
            y1={30 + i * 35}
            y2={30 + i * 35}
            stroke="currentColor"
            opacity={0.1}
          />
        ))}
        <Series points={toPoints(hours)} color="var(--ac)" label="Horas activas" unit="h" />
        <Series points={toPoints(activities)} color="var(--vi)" label="Actividades completadas" unit="act." />
        <text x={X_START} y={192} fontSize={10} style={{ fill: 'var(--mu)' }}>
          {`hace ${periodDays} d`}
        </text>
        <text x={X_END} y={192} fontSize={10} textAnchor="end" style={{ fill: 'var(--mu)' }}>
          hoy
        </text>
      </svg>
      <div className="lg">
        <i style={{ background: 'var(--ac)' }} />
        Horas activas
        <i style={{ background: 'var(--vi)' }} />
        Actividades completadas
      </div>
    </>
  )
}
