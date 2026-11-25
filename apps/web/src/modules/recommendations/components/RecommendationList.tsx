import { useState } from 'react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { FEEDBACK_LABELS, type FeedbackAction, type Recommendation } from '../types'

interface RecommendationListProps {
  items: readonly Recommendation[]
  onFeedback: (recommendation: Recommendation, action: FeedbackAction) => Promise<void>
}

interface Entry {
  status: 'saving' | 'done' | 'error'
  action: FeedbackAction
}

const ACTIONS: readonly { action: FeedbackAction; label: string; primary: boolean }[] = [
  { action: 'accepted', label: 'Aceptar', primary: true },
  { action: 'dismissed', label: 'Descartar', primary: false },
  { action: 'useful', label: 'Marcar útil', primary: false },
]

export function RecommendationList({ items, onFeedback }: RecommendationListProps) {
  const [entries, setEntries] = useState<Record<string, Entry>>({})

  const submit = async (recommendation: Recommendation, action: FeedbackAction) => {
    setEntries((prev) => ({ ...prev, [recommendation.id]: { status: 'saving', action } }))
    try {
      await onFeedback(recommendation, action)
      setEntries((prev) => ({ ...prev, [recommendation.id]: { status: 'done', action } }))
    } catch {
      setEntries((prev) => ({ ...prev, [recommendation.id]: { status: 'error', action } }))
    }
  }

  if (items.length === 0) {
    return <EmptyState title="Sin recomendaciones vigentes">El motor aún no generó sugerencias para este filtro.</EmptyState>
  }

  return (
    <ul>
      {items.map((rec) => {
        const entry = entries[rec.id]
        const done = entry?.status === 'done'
        return (
          <li key={rec.id} className="r" style={done ? { borderLeftColor: 'var(--gr)' } : undefined}>
            <b>{rec.title}</b>
            <small>{rec.reason}</small>
            <div className="bt">
              {done ? (
                <span className="pill conn">{FEEDBACK_LABELS[entry.action]} · feedback registrado (DEMO)</span>
              ) : (
                <>
                  {ACTIONS.map(({ action, label, primary }) => (
                    <button
                      key={action}
                      type="button"
                      className={primary ? 'btn sm' : 'btn g sm'}
                      disabled={entry?.status === 'saving'}
                      onClick={() => void submit(rec, action)}
                    >
                      {label}
                    </button>
                  ))}
                  {entry?.status === 'error' ? (
                    <span className="pill off" role="alert">
                      No se pudo registrar. Reintenta.
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
