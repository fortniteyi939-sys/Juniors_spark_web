import { useState } from 'react'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/lib/format'
import { listAssessments } from '@/services/moduleService'
import { ASSESSMENT_STATUS_LABELS, ASSESSMENT_TYPE_LABELS, type Assessment, type AssessmentType } from '../types'

const grade = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)} / 20`)

const COLUMNS: readonly Column<Assessment>[] = [
  { key: 'title', header: 'Evaluación', render: (a) => <b>{a.title}</b> },
  { key: 'course', header: 'Curso', render: (a) => a.course },
  { key: 'type', header: 'Tipo', render: (a) => ASSESSMENT_TYPE_LABELS[a.type] },
  { key: 'weight', header: 'Ponderación', numeric: true, render: (a) => `${a.weightPct}%` },
  { key: 'due', header: 'Fecha límite', render: (a) => formatDate(a.dueAt) },
  { key: 'attempts', header: 'Intentos', numeric: true, render: (a) => a.maxAttempts },
  { key: 'subs', header: 'Entregas', numeric: true, render: (a) => a.submissions },
  { key: 'status', header: 'Estado', render: (a) => <StatusBadge tone={a.status === 'published' ? 'ok' : 'muted'}>{ASSESSMENT_STATUS_LABELS[a.status]}</StatusBadge> },
  { key: 'official', header: 'Nota oficial (prom.)', numeric: true, render: (a) => grade(a.officialAvg) },
  { key: 'ai', header: 'Estimación IA (no oficial)', numeric: true, render: (a) => grade(a.aiEstimateAvg) },
]

export function AssessmentsPage() {
  const data = useAsyncData(listAssessments, [])
  const [type, setType] = useState<'all' | AssessmentType>('all')

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Evaluación del aprendizaje"
        title="Evaluaciones y actividades"
        description="Bancos de preguntas, rúbricas, intentos, ponderaciones y retroalimentación; la nota oficial se separa de la estimación predictiva."
        actions={
          <select aria-label="Tipo de evaluación" value={type} onChange={(e) => setType(e.target.value as 'all' | AssessmentType)}>
            <option value="all">Todos los tipos</option>
            {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((t) => (
              <option key={t} value={t}>
                {ASSESSMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        }
      />
      <section className="card">
        <p className="note">
          La <b>nota oficial</b> la confirma el docente según la regla del curso. La <b>estimación IA</b> es una predicción y
          nunca reemplaza ni modifica la nota oficial (spec 4.6). Escala DEMO 0–20.
        </p>
        <AsyncView state={data} onRetry={data.reload}>
          {(items) => (
            <DataTable
              caption="Evaluaciones"
              columns={COLUMNS}
              rows={items.filter((a) => type === 'all' || a.type === type)}
              rowKey={(a) => a.id}
              emptyTitle="Sin evaluaciones de este tipo"
            />
          )}
        </AsyncView>
      </section>
    </>
  )
}
