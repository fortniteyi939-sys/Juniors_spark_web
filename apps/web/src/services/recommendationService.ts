import type { FeedbackAction, Recommendation } from '@/modules/recommendations/types'
import { DEMO_RECOMMENDATIONS } from './demo/demoData'

/*
 * Cliente de dominio "recomendaciones". Hoy usa datos DEMO.
 *   listRecommendations        -> GET  /api/v1/recommendations
 *   sendRecommendationFeedback -> POST /api/v1/recommendations/{id}/feedback
 */

export async function listRecommendations(): Promise<Recommendation[]> {
  return [...DEMO_RECOMMENDATIONS]
}

export async function sendRecommendationFeedback(_id: string, _action: FeedbackAction): Promise<void> {
  // DEMO: el feedback no se persiste. En producción se registra para evaluar utilidad y aceptación.
}
