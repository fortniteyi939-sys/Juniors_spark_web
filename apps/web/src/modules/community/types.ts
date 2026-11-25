export interface CommunitySpace {
  id: string
  course: string
  members: number
  unread: number
}

/** Tipo de hilo de comunidad. */
export type ThreadKind = 'announcement' | 'debate'

export const THREAD_KIND_LABELS: Record<ThreadKind, string> = {
  announcement: 'Anuncio',
  debate: 'Debate',
}


/** Interfaz de hilo de comunidad. */
export interface Thread {
  id: string
  spaceId: string
  kind: ThreadKind
  title: string
  author: string
  replies: number
  at: string
  /** Reportes de contenido pendientes de moderación. */
  reports: number
}
