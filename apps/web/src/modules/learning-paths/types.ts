export type PathStatus = 'draft' | 'published' | 'archived'

export const PATH_STATUS_LABELS: Record<PathStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
}


export interface PathStep {
  order: number
  course: string
  competency: string
  prerequisite: string | null
  weeks: number
  /** Criterio de logro (spec 4.2). */
  achievement: string
}

export interface PathChange {
  at: string
  by: string
  change: string
}

export interface LearningPath {
  id: string
  title: string
  objective: string
  status: PathStatus
  version: number
  cohort: string
  progressPct: number
  steps: PathStep[]
  history: PathChange[]
}
