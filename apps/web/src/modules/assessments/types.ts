export type AssessmentType = 'mcq' | 'tf' | 'short' | 'file' | 'practice'
export type AssessmentStatus = 'draft' | 'published' | 'closed'

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  mcq: 'Opción múltiple',
  tf: 'Verdadero/falso',
  short: 'Respuesta corta',
  file: 'Entrega de archivo',
  practice: 'Actividad práctica',
}

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Cerrada',
}


export interface Assessment {
  id: string
  title: string
  course: string
  type: AssessmentType
  weightPct: number
  dueAt: string
  maxAttempts: number
  submissions: number
  status: AssessmentStatus
  /** Promedio de la nota OFICIAL (escala 0-20); null si aún no hay notas confirmadas. */
  officialAvg: number | null
  /** Promedio de la ESTIMACIÓN predictiva (no oficial); se muestra separado (spec 4.6). */
  aiEstimateAvg: number | null
}
