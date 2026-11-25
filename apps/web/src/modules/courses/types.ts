export type CourseStatus = 'draft' | 'review' | 'published'
export type CourseLevel = 'Básico' | 'Intermedio' | 'Avanzado'

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  published: 'Publicado',
}

export const COURSE_LEVELS: readonly CourseLevel[] = ['Básico', 'Intermedio', 'Avanzado']

export interface CourseUnit {
  title: string
  lessons: number
  resources: number
  activities: number
}


export interface Course {
  id: string
  code: string
  title: string
  level: CourseLevel
  instructor: string
  status: CourseStatus
  version: string
  startsAt: string
  competencies: string[]
  units: CourseUnit[]
}
