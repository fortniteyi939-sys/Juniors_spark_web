import type { RegionProgress } from '@/components/charts/GeoProgress'
import type { SkillMastery } from '@/modules/skill-mastery/types'

export type Role = 'inst' | 'doc' | 'est'
export type PeriodDays = 7 | 30 | 90

export const PERIODS: readonly PeriodDays[] = [7, 30, 90]

export const ROLES: readonly { value: Role; label: string }[] = [
  { value: 'inst', label: 'Administrador' },
  { value: 'doc', label: 'Docente' },
  { value: 'est', label: 'Estudiante' },
]

export const COURSES = ['Todos los cursos', 'Matemática I', 'Programación', 'Estadística'] as const
export type CourseFilter = (typeof COURSES)[number]

export const COHORTS = ['Todas las cohortes', 'Cohorte 2026-I', 'Cohorte 2026-II'] as const
export type CohortFilter = (typeof COHORTS)[number]

export const PROGRAMS = ['Todos los programas', 'Ciencia de Datos', 'Desarrollo Web'] as const
export type ProgramFilter = (typeof PROGRAMS)[number]

export interface DashboardFilters {
  period: PeriodDays
  role: Role
  course: CourseFilter
  cohort: CohortFilter
  program: ProgramFilter
}

export const DEFAULT_FILTERS: DashboardFilters = {
  period: 30,
  role: 'inst',
  course: 'Todos los cursos',
  cohort: 'Todas las cohortes',
  program: 'Todos los programas',
}

export function parsePeriod(value: string): PeriodDays {
  const n = Number(value)
  return n === 7 || n === 90 ? n : 30
}

export function parseRole(value: string): Role {
  return ROLES.find((r) => r.value === value)?.value ?? 'inst'
}

export function parseCourse(value: string): CourseFilter {
  return COURSES.find((c) => c === value) ?? COURSES[0]
}

export function parseCohort(value: string): CohortFilter {
  return COHORTS.find((c) => c === value) ?? COHORTS[0]
}

export function parseProgram(value: string): ProgramFilter {
  return PROGRAMS.find((c) => c === value) ?? PROGRAMS[0]
}

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

export type KpiTone = 'default' | 'success' | 'ai' | 'warning'

/** Cada KPI declara valor, variación, fuente y fecha de actualización (spec 4.1). */
export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  source: string
  tone: KpiTone
}

export interface DashboardSummary {
  kpis: Kpi[]
  completionPct: number
  updatedAt: string
  isDemo: boolean
}

export interface ProgressTrend {
  hours: number[]
  activities: number[]
}

export interface DashboardData {
  summary: DashboardSummary
  trend: ProgressTrend
  mastery: SkillMastery
  geo: RegionProgress[]
}
