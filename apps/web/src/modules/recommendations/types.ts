export type FeedbackAction = 'accepted' | 'dismissed' | 'useful'

export const FEEDBACK_LABELS: Record<FeedbackAction, string> = {
  accepted: 'Aceptada',
  dismissed: 'Descartada',
  useful: 'Útil',
}


export interface Recommendation {
  id: string
  title: string
  /** Motivo explicable de la sugerencia (spec 4.5). */
  reason: string
}
