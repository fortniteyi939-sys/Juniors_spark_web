import { useState } from 'react'
import { PageHeader } from '@/app/layouts/PageHeader'
import { AsyncView } from '@/components/feedback/AsyncView'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { MODEL_META } from '@/modules/neural-visualizer/neuralTopology'
import type { TutorItem } from '@/services/demo/moduleData'
import { getTutorData } from '@/services/moduleService'

type Status = TutorItem['status']

const STATUS_LABELS: Record<Status, string> = {
  new: 'Nueva',
  accepted: 'Aceptada',
  dismissed: 'Descartada',
  completed: 'Completada',
  expired: 'Expirada',
}

const STATUS_TONES: Record<Status, BadgeTone> = {
  new: 'ai',
  accepted: 'ok',
  dismissed: 'muted',
  completed: 'ok',
  expired: 'warn',
}

interface BoardProps {
  initial: readonly TutorItem[]
  pool: readonly Omit<TutorItem, 'status' | 'useful'>[]
}

function TutorBoard({ initial, pool }: BoardProps) {
  const [items, setItems] = useState<readonly TutorItem[]>(initial)
  const [requested, setRequested] = useState(0)

  const update = (id: string, patch: Partial<TutorItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const requestHelp = () => {
    const next = pool[requested]
    if (!next) return
    setRequested((n) => n + 1)
    setItems((prev) => [{ ...next, status: 'new', useful: false }, ...prev])
  }

  const total = items.length
  const accepted = items.filter((i) => i.status === 'accepted' || i.status === 'completed').length
  const useful = items.filter((i) => i.useful).length
  const pct = (n: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`)

  return (
    <div className="gd">
      <section className="card c12">
        <p className="note">
          Las sugerencias son estimaciones del modelo {MODEL_META.version}, no diagnósticos. Se combinan con reglas de negocio y el
          docente puede revisarlas o anularlas (spec 4.5 y 9.3).
        </p>
        <div className="st">
          <div>
            Recomendaciones<b>{total}</b>
          </div>
          <div>
            Tasa de aceptación<b>{pct(accepted)}</b>
          </div>
          <div>
            Marcadas útiles<b>{pct(useful)}</b>
          </div>
        </div>
        <div className="fb" style={{ marginTop: 14 }}>
          <button type="button" className="btn" onClick={requestHelp} disabled={requested >= pool.length}>
            Pedir ayuda al tutor
          </button>
          {requested >= pool.length ? <small>No hay más sugerencias DEMO disponibles.</small> : null}
        </div>
        {items.length === 0 ? (
          <EmptyState title="Sin recomendaciones vigentes">Pide ayuda para generar sugerencias.</EmptyState>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="r">
                <b>
                  {item.title} <StatusBadge tone={STATUS_TONES[item.status]}>{STATUS_LABELS[item.status]}</StatusBadge>
                </b>
                <small>
                  Competencia a reforzar: {item.competency} · Evidencia previa: {item.priorActivity} · Dificultad estimada:{' '}
                  {item.difficulty} · Objetivo: {item.goal}
                </small>
                <div className="bt">
                  {item.status === 'new' ? (
                    <>
                      <button type="button" className="btn sm" onClick={() => update(item.id, { status: 'accepted' })}>
                        Aceptar
                      </button>
                      <button type="button" className="btn g sm" onClick={() => update(item.id, { status: 'dismissed' })}>
                        Descartar
                      </button>
                    </>
                  ) : null}
                  {item.status === 'accepted' ? (
                    <button type="button" className="btn sm" onClick={() => update(item.id, { status: 'completed' })}>
                      Marcar completada
                    </button>
                  ) : null}
                  <button type="button" className="btn g sm" aria-pressed={item.useful} onClick={() => update(item.id, { useful: !item.useful })}>
                    {item.useful ? 'Marcada útil' : 'Marcar útil'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export function AiTutorPage() {
  const data = useAsyncData(getTutorData, [])
  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="IA Tutor y recomendaciones"
        title="IA Tutor"
        description="Recursos, actividades y rutas según brechas y progreso, con motivo explicado y feedback registrado."
      />
      <AsyncView state={data} onRetry={data.reload}>
        {({ initial, pool }) => <TutorBoard initial={initial} pool={pool} />}
      </AsyncView>
    </>
  )
}
