import { EmptyState } from '@/components/feedback/EmptyState'

export interface RegionProgress {
  name: string
  /** Progreso medio agregado de la región (0-100). */
  pct: number
  students: number
}

/** Progreso por región, solo agregados (spec 1.1: nunca exposición individual innecesaria). */
export function GeoProgress({ regions }: { regions: readonly RegionProgress[] }) {
  if (regions.length === 0) return <EmptyState title="Sin datos geográficos" />
  return (
    <div className="bars" role="list" aria-label="Progreso medio por región">
      {regions.map((region) => (
        <div className="row" role="listitem" key={region.name} title={`${region.students} estudiantes`}>
          <span>{region.name}</span>
          <div className="track" aria-hidden="true">
            <i style={{ width: `${region.pct}%` }} />
          </div>
          <b>{region.pct}%</b>
        </div>
      ))}
    </div>
  )
}
