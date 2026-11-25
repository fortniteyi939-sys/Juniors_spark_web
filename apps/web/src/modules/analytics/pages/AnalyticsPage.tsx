import { useState } from 'react'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toCsv } from '@/lib/csv'
import { PERIODS, parsePeriod, type PeriodDays } from '@/modules/dashboard/types'
import { downloadCsv } from '@/modules/dashboard/utils/exportCsv'
import { INDICATOR_DEFINITIONS } from '@/services/demo/moduleData'
import { listCourseAnalytics } from '@/services/moduleService'
import type { CourseAnalytics, IndicatorDefinition } from '../types'

const nf = new Intl.NumberFormat('es-PE')

const COLUMNS: readonly Column<CourseAnalytics>[] = [
  { key: 'course', header: 'Curso', render: (r) => <b>{r.course}</b> },
  { key: 'part', header: 'Participación', numeric: true, render: (r) => `${r.participationPct}%` },
  { key: 'hours', header: 'Tiempo activo (h)', numeric: true, render: (r) => nf.format(r.activeHours) },
  { key: 'subs', header: 'Entregas', numeric: true, render: (r) => nf.format(r.submissions) },
  { key: 'att', header: 'Intentos', numeric: true, render: (r) => nf.format(r.attempts) },
  { key: 'prog', header: 'Progreso', numeric: true, render: (r) => `${r.progressPct}%` },
  { key: 'comp', header: 'Finalización', numeric: true, render: (r) => `${r.completionPct}%` },
  { key: 'mastery', header: 'Dominio (estimado IA)', numeric: true, render: (r) => `${r.masteryPct}%` },
]

const DEFINITION_COLUMNS: readonly Column<IndicatorDefinition>[] = [
  { key: 'name', header: 'Indicador', render: (d) => <b>{d.name}</b> },
  { key: 'def', header: 'Definición', render: (d) => d.definition },
  { key: 'src', header: 'Fuente', render: (d) => d.source },
]

type AnalyticsTab = 'indicadores' | 'definiciones'
const TABS: readonly { id: AnalyticsTab; label: string }[] = [
  { id: 'indicadores', label: 'Indicadores por curso' },
  { id: 'definiciones', label: 'Definición de indicadores' },
]

export function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [course, setCourse] = useState('all')
  const [tab, setTab] = useState<AnalyticsTab>('indicadores')
  const data = useAsyncData(() => listCourseAnalytics(period), [period])

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Analítica educativa"
        title="Analítica"
        description="Participación, tiempo activo, entregas, intentos, progreso, finalización y dominio por curso."
        actions={
          <>
            <select aria-label="Periodo" value={period} onChange={(e) => setPeriod(parsePeriod(e.target.value))}>
              {PERIODS.map((days) => (
                <option key={days} value={days}>
                  {days} días
                </option>
              ))}
            </select>
            <AsyncView state={data}>
              {(rows) => (
                <>
                  <select aria-label="Curso" value={course} onChange={(e) => setCourse(e.target.value)}>
                    <option value="all">Todos los cursos</option>
                    {rows.map((r) => (
                      <option key={r.course} value={r.course}>
                        {r.course}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const visible = rows.filter((r) => course === 'all' || r.course === course)
                      const csv = toCsv([
                        ['curso', 'participacion_pct', 'horas_activas', 'entregas', 'intentos', 'progreso_pct', 'finalizacion_pct', 'dominio_estimado_pct', 'periodo', 'generado'],
                        ...visible.map((r) => [r.course, String(r.participationPct), String(r.activeHours), String(r.submissions), String(r.attempts), String(r.progressPct), String(r.completionPct), String(r.masteryPct), `${period}d`, new Date().toISOString()]),
                      ])
                      downloadCsv('edumaster_analitica_demo.csv', csv)
                    }}
                  >
                    Exportar CSV
                  </button>
                  <button type="button" className="btn g" disabled title="Requiere el worker de reportes del backend">
                    XLSX
                  </button>
                  <button type="button" className="btn g" disabled title="Requiere el worker de reportes del backend">
                    PDF
                  </button>
                </>
              )}
            </AsyncView>
          </>
        }
      />
      <Tabs label="Secciones de analítica" tabs={TABS} value={tab} onChange={setTab} />
      <div className="gd">
        {tab === 'indicadores' ? (
        <TabPanel id="indicadores">
        <section className="card c12">
          <h2>Indicadores por curso</h2>
          <p className="sub">Datos DEMO. XLSX y PDF se habilitan con el backend; la exportación incluye marca de fecha y filtros aplicados.</p>
          <AsyncView state={data} onRetry={data.reload}>
            {(rows) => (
              <DataTable
                caption="Indicadores de analítica por curso"
                columns={COLUMNS}
                rows={rows.filter((r) => course === 'all' || r.course === course)}
                rowKey={(r) => r.course}
              />
            )}
          </AsyncView>
        </section>
        </TabPanel>
        ) : (
        <TabPanel id="definiciones">
        <section className="card c12">
          <h2>Definición de indicadores</h2>
          <p className="note">Definiciones propuestas a partir de la especificación; deben ser aprobadas por el Product Owner para evitar métricas ambiguas.</p>
          <DataTable caption="Definiciones de indicadores" columns={DEFINITION_COLUMNS} rows={INDICATOR_DEFINITIONS} rowKey={(d) => d.name} />
        </section>
        </TabPanel>
        )}
      </div>
    </>
  )
}
