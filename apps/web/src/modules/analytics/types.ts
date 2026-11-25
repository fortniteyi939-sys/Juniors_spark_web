export interface CourseAnalytics {
  course: string
  /** Participación: % de matriculados con actividad válida en el periodo. */
  participationPct: number
  activeHours: number
  submissions: number
  attempts: number
  progressPct: number
  completionPct: number
  /** Dominio medio estimado (no certificado por docente). */
  masteryPct: number
}

/** Definición de indicadores para analítica (spec 4.3). */
export interface IndicatorDefinition {
  name: string
  definition: string
  source: string
}
