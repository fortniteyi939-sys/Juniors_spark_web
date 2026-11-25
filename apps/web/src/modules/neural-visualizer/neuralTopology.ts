import type { NetworkLayer } from './types'

/**
 * Topología DEMO de la EduMaster Multi-Task Learning Network.
 * En producción vendrá de GET /api/v1/ml/models (metadatos del grafo y estado real).
 */
export const DEMO_LAYERS: readonly NetworkLayer[] = [
  { name: 'Entrada', neurons: 8, color: 'pr', detail: 'Actividad, intentos, progreso · [B,8]' },
  { name: 'Embeddings', neurons: 6, color: 'pr', detail: 'Vector de características · [B,32]' },
  { name: 'GRU', neurons: 7, color: 'vi', detail: 'Secuencia de eventos · [B,T,64]' },
  { name: 'Fusión Dense', neurons: 6, color: 'pr', detail: 'Concat + Dense + LayerNorm + Dropout · [B,64]' },
  { name: 'Salidas', neurons: 4, color: 'gr', detail: 'Finalización · Dominio · Riesgo · Ranking' },
]

export const MODEL_META = {
  name: 'mtl-demo',
  version: 'v0.1-DEMO',
  dataset: 'demo_sint_2026.11',
} as const

export const MAX_EPOCH = 40

/** Curva de pérdida simulada para la demostración de entrenamiento. */
export function trainingLoss(epoch: number): number {
  return 1.2 * Math.exp(-epoch / 12) + 0.2
}
