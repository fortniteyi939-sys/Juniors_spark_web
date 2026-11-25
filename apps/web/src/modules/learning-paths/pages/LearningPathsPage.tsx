import { useState } from 'react'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDateTime } from '@/lib/format'
import { listLearningPaths } from '@/services/moduleService'
import { PATH_STATUS_LABELS, type LearningPath, type PathStatus, type PathStep } from '../types'

const STEP_COLUMNS: readonly Column<PathStep>[] = [
  { key: 'order', header: '#', render: (s) => s.order },
  { key: 'course', header: 'Curso', render: (s) => <b>{s.course}</b> },
  { key: 'competency', header: 'Competencia', render: (s) => s.competency },
  { key: 'prereq', header: 'Prerrequisito', render: (s) => s.prerequisite ?? '—' },
  { key: 'weeks', header: 'Semanas', numeric: true, render: (s) => s.weeks },
  { key: 'goal', header: 'Criterio de logro', render: (s) => s.achievement },
]

type PathsTab = 'catalogo' | 'secuencia'
const TABS: readonly { id: PathsTab; label: string }[] = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'secuencia', label: 'Secuencia e historial' },
]

export function LearningPathsPage() {
  const data = useAsyncData(listLearningPaths, [])
  const [status, setStatus] = useState<'all' | PathStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<PathsTab>('catalogo')

  const columns: Column<LearningPath>[] = [
    {
      key: 'title',
      header: 'Ruta',
      render: (p) => (
        <>
          <button type="button" className="link" onClick={() => {
              setSelectedId(p.id)
              setTab('secuencia')
            }} aria-label={`Ver detalle de ${p.title}`}>
            {p.title}
          </button>
          <br />
          <small>{p.objective}</small>
        </>
      ),
    },
    { key: 'status', header: 'Estado', render: (p) => <StatusBadge tone={p.status === 'published' ? 'ok' : 'muted'}>{PATH_STATUS_LABELS[p.status]}</StatusBadge> },
    { key: 'version', header: 'Versión', numeric: true, render: (p) => `v${p.version}` },
    { key: 'steps', header: 'Pasos', numeric: true, render: (p) => p.steps.length },
    { key: 'weeks', header: 'Duración', numeric: true, render: (p) => `${p.steps.reduce((sum, s) => sum + s.weeks, 0)} sem.` },
    { key: 'cohort', header: 'Asignada a', render: (p) => p.cohort },
    { key: 'progress', header: 'Avance', numeric: true, render: (p) => `${p.progressPct}%` },
  ]

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Planes y rutas"
        title="Rutas de aprendizaje"
        description="Objetivos, competencias, prerrequisitos, duración y criterios de logro; asignación por cohorte con historial."
        actions={
          <select aria-label="Estado de la ruta" value={status} onChange={(e) => setStatus(e.target.value as 'all' | PathStatus)}>
            <option value="all">Todos los estados</option>
            {(Object.keys(PATH_STATUS_LABELS) as PathStatus[]).map((s) => (
              <option key={s} value={s}>
                {PATH_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        }
      />
      <Tabs label="Secciones de rutas" tabs={TABS} value={tab} onChange={setTab} />
      <AsyncView state={data} onRetry={data.reload}>
        {(paths) => {
          const visible = paths.filter((p) => status === 'all' || p.status === status)
          const selected = visible.find((p) => p.id === selectedId) ?? visible[0]
          return (
            <div className="gd">
              {tab === 'catalogo' ? (
              <TabPanel id="catalogo">
              <section className="card c12">
                <h2>Catálogo de rutas</h2>
                <p className="sub">Datos DEMO. Flujo: crear → definir pasos y competencias → validar prerrequisitos → publicar → asignar.</p>
                <DataTable caption="Rutas de aprendizaje" columns={columns} rows={visible} rowKey={(p) => p.id} />
              </section>
              </TabPanel>
              ) : selected ? (
                <TabPanel id="secuencia">
                <div className="gd">
                  <section className="card c8">
                    <h2>{selected.title}: secuencia</h2>
                    <p className="sub">Los cursos deben estar publicados y disponibles antes de asignar la ruta.</p>
                    <DataTable caption={`Pasos de ${selected.title}`} columns={STEP_COLUMNS} rows={selected.steps} rowKey={(s) => String(s.order)} />
                  </section>
                  <section className="card c4">
                    <h2>Historial de cambios</h2>
                    <p className="sub">Se conserva quién cambió qué y cuándo.</p>
                    <ul>
                      {selected.history.map((h) => (
                        <li key={h.at} className="a">
                          <time dateTime={h.at}>{formatDateTime(h.at)}</time>
                          <span>
                            {h.change} <small>({h.by})</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                </TabPanel>
              ) : (
                <p className="note">Ninguna ruta seleccionada.</p>
              )}
            </div>
          )
        }}
      </AsyncView>
    </>
  )
}
