import { useState } from 'react'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/lib/format'
import { listCourses } from '@/services/moduleService'
import { COURSE_LEVELS, COURSE_STATUS_LABELS, type Course, type CourseStatus, type CourseUnit } from '../types'

const UNIT_COLUMNS: readonly Column<CourseUnit>[] = [
  { key: 'title', header: 'Unidad', render: (u) => <b>{u.title}</b> },
  { key: 'lessons', header: 'Lecciones', numeric: true, render: (u) => u.lessons },
  { key: 'resources', header: 'Recursos', numeric: true, render: (u) => u.resources },
  { key: 'activities', header: 'Actividades', numeric: true, render: (u) => u.activities },
]

const TONES: Record<CourseStatus, 'ok' | 'warn' | 'muted'> = { published: 'ok', review: 'warn', draft: 'muted' }

type CoursesTab = 'catalogo' | 'unidades'
const TABS: readonly { id: CoursesTab; label: string }[] = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'unidades', label: 'Unidades y versiones' },
]

export function CoursesPage() {
  const data = useAsyncData(listCourses, [])
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<CoursesTab>('catalogo')

  const columns: Column<Course>[] = [
    { key: 'code', header: 'Código', render: (c) => c.code },
    {
      key: 'title',
      header: 'Curso',
      render: (c) => (
        <button type="button" className="link" onClick={() => {
            setSelectedId(c.id)
            setTab('unidades')
          }} aria-label={`Ver unidades de ${c.title}`}>
          {c.title}
        </button>
      ),
    },
    { key: 'level', header: 'Nivel', render: (c) => c.level },
    { key: 'instructor', header: 'Docente', render: (c) => c.instructor },
    { key: 'skills', header: 'Competencias', render: (c) => c.competencies.join(', ') },
    { key: 'status', header: 'Estado', render: (c) => <StatusBadge tone={TONES[c.status]}>{COURSE_STATUS_LABELS[c.status]}</StatusBadge> },
    { key: 'version', header: 'Versión', numeric: true, render: (c) => `v${c.version}` },
    { key: 'starts', header: 'Inicio', render: (c) => formatDate(c.startsAt) },
  ]

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Catálogo académico"
        title="Cursos y contenidos"
        description="Código, nivel, docente, estado, competencias, unidades y versionado con control de publicación."
      />
      <Tabs label="Secciones de cursos" tabs={TABS} value={tab} onChange={setTab} />
      <AsyncView state={data} onRetry={data.reload}>
        {(courses) => {
          const q = query.trim().toLowerCase()
          const visible = courses.filter(
            (c) =>
              (level === 'all' || c.level === level) &&
              (status === 'all' || c.status === status) &&
              (q === '' || `${c.code} ${c.title} ${c.instructor}`.toLowerCase().includes(q)),
          )
          const selected = courses.find((c) => c.id === selectedId) ?? visible[0]
          return (
            <div className="gd">
              {tab === 'catalogo' ? (
              <TabPanel id="catalogo">
              <section className="card c12">
                <div className="fb">
                  <input type="search" aria-label="Buscar curso" placeholder="Buscar por código, curso o docente" value={query} onChange={(e) => setQuery(e.target.value)} />
                  <select aria-label="Nivel" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="all">Todos los niveles</option>
                    {COURSE_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">Todos los estados</option>
                    {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {COURSE_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <DataTable
                  caption="Catálogo de cursos"
                  columns={columns}
                  rows={visible}
                  rowKey={(c) => c.id}
                  pageSize={5}
                  emptyTitle="Ningún curso coincide"
                  emptyHint="Prueba con otra búsqueda o limpia los filtros."
                />
              </section>
              </TabPanel>
              ) : selected ? (
                <TabPanel id="unidades">
                <section className="card c12">
                  <h2>
                    {selected.code} · {selected.title}
                  </h2>
                  <p className="sub">Unidades, lecciones, recursos y actividades. Publicar exige revisión previa; cada cambio queda en auditoría.</p>
                  <DataTable caption={`Unidades de ${selected.title}`} columns={UNIT_COLUMNS} rows={selected.units} rowKey={(u) => u.title} />
                </section>
                </TabPanel>
              ) : (
                <p className="note">Ningún curso seleccionado.</p>
              )}
            </div>
          )
        }}
      </AsyncView>
    </>
  )
}
