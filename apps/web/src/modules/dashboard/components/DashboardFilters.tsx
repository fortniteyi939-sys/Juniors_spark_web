import {
  COHORTS,
  COURSES,
  PERIODS,
  PROGRAMS,
  ROLES,
  parseCohort,
  parseCourse,
  parsePeriod,
  parseProgram,
  parseRole,
  type DashboardFilters as Filters,
} from '../types'

interface DashboardFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onExport: () => void
  canExport: boolean
}

/** Filtros globales del dashboard (spec 4.1). El selector de rol simula la sesión en el demo. */
export function DashboardFilters({ filters, onChange, onExport, canExport }: DashboardFiltersProps) {
  return (
    <>
      <select
        aria-label="Periodo"
        value={filters.period}
        onChange={(e) => onChange({ ...filters, period: parsePeriod(e.target.value) })}
      >
        {PERIODS.map((days) => (
          <option key={days} value={days}>
            {days} días
          </option>
        ))}
      </select>
      <select
        aria-label="Rol"
        value={filters.role}
        onChange={(e) => onChange({ ...filters, role: parseRole(e.target.value) })}
      >
        {ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Curso"
        value={filters.course}
        onChange={(e) => onChange({ ...filters, course: parseCourse(e.target.value) })}
      >
        {COURSES.map((course) => (
          <option key={course} value={course}>
            {course}
          </option>
        ))}
      </select>
      <select
        aria-label="Cohorte"
        value={filters.cohort}
        onChange={(e) => onChange({ ...filters, cohort: parseCohort(e.target.value) })}
      >
        {COHORTS.map((cohort) => (
          <option key={cohort} value={cohort}>
            {cohort}
          </option>
        ))}
      </select>
      <select
        aria-label="Programa"
        value={filters.program}
        onChange={(e) => onChange({ ...filters, program: parseProgram(e.target.value) })}
      >
        {PROGRAMS.map((program) => (
          <option key={program} value={program}>
            {program}
          </option>
        ))}
      </select>
      <button type="button" className="btn" onClick={onExport} disabled={!canExport}>
        Exportar CSV
      </button>
    </>
  )
}
