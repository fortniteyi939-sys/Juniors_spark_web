import { PageHeader } from '@/app/layouts/PageHeader'
import { GeoProgress } from '@/components/charts/GeoProgress'
import { CompletionDonut } from '@/components/charts/CompletionDonut'
import { SkillHeatmap } from '@/components/charts/SkillHeatmap'
import { TrendChart } from '@/components/charts/TrendChart'
import { KpiCard, KpiCardSkeleton } from '@/components/data-display/KpiCard'
import { AsyncView } from '@/components/feedback/AsyncView'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { DashboardIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ActivityFeed } from '@/modules/activity/components/ActivityFeed'
import { useActivityFeed } from '@/modules/activity/hooks/useActivityFeed'
import { NeuralVisualizerPanel } from '@/modules/neural-visualizer/components/NeuralVisualizerPanel'
import { RecommendationList } from '@/modules/recommendations/components/RecommendationList'
import { FEEDBACK_LABELS, type FeedbackAction, type Recommendation } from '@/modules/recommendations/types'
import { getDashboardData } from '@/services/dashboardService'
import { listRecommendations, sendRecommendationFeedback } from '@/services/recommendationService'
import { DashboardFilters } from '../components/DashboardFilters'
import { roleLabel, type DashboardFilters as Filters } from '../types'
import { buildKpiCsv, downloadCsv } from '../utils/exportCsv'

const KPI_SKELETONS = [0, 1, 2, 3, 4, 5]

interface DashboardPageProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function DashboardPage({ filters, onFiltersChange }: DashboardPageProps) {
  const dashboard = useAsyncData(() => getDashboardData(filters), [filters.period, filters.role, filters.course, filters.cohort, filters.program])
  const recommendations = useAsyncData(listRecommendations, [])
  const { events, log } = useActivityFeed()

  const data = dashboard.data

  const handleFiltersChange = (next: Filters) => {
    onFiltersChange(next)
    log(`Filtros aplicados: ${next.period} días · ${roleLabel(next.role)} · ${next.course} · ${next.cohort} · ${next.program}`)
  }

  const handleExport = () => {
    if (!data) return
    downloadCsv('edumaster_demo.csv', buildKpiCsv(data.summary.kpis, filters, new Date()))
    log('Exportación CSV generada (DEMO)')
  }

  const handleFeedback = async (recommendation: Recommendation, action: FeedbackAction) => {
    await sendRecommendationFeedback(recommendation.id, action)
    log(`Recomendación ${FEEDBACK_LABELS[action].toLowerCase()}`)
  }

  return (
    <>
      <PageHeader
        id="resumen"
        icon={<DashboardIcon />}
        eyebrow="Resumen ejecutivo"
        title="Aprendizaje y analítica"
        description="Progreso, competencias y recomendaciones de IA de tu institución."
        actions={
          <DashboardFilters
            filters={filters}
            onChange={handleFiltersChange}
            onExport={handleExport}
            canExport={data !== undefined}
          />
        }
      />

      {dashboard.status === 'error' && !data ? (
        <ErrorState message={dashboard.message} onRetry={dashboard.reload} />
      ) : (
        <div className="kp" aria-busy={dashboard.status === 'loading'}>
          {data
            ? data.summary.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} updatedAt={data.summary.updatedAt} />)
            : KPI_SKELETONS.map((i) => <KpiCardSkeleton key={i} />)}
        </div>
      )}

      <div className="gd">
        <NeuralVisualizerPanel />

        <section className="card c4">
          <h2>Finalización de cursos</h2>
          <p className="sub">Completado, en curso y sin iniciar</p>
          <AsyncView state={dashboard} onRetry={dashboard.reload} skeleton={<Skeleton circle height={150} />}>
            {(d) => <CompletionDonut completedPct={d.summary.completionPct} />}
          </AsyncView>
        </section>

        <section className="card c6" id="analitica">
          <h2>Progreso de aprendizaje</h2>
          <p className="sub">Horas activas y actividades completadas</p>
          <AsyncView state={dashboard} onRetry={dashboard.reload} skeleton={<Skeleton height={200} />}>
            {(d) => <TrendChart hours={d.trend.hours} activities={d.trend.activities} periodDays={filters.period} />}
          </AsyncView>
        </section>

        <section className="card c6" id="skills">
          <h2>Dominio de habilidades</h2>
          <p className="sub">Nivel estimado por IA, no certificado por docente</p>
          <AsyncView state={dashboard} onRetry={dashboard.reload} skeleton={<Skeleton height={190} />}>
            {(d) => <SkillHeatmap {...d.mastery} />}
          </AsyncView>
        </section>

        <section className="card c6" id="geo">
          <h2>Mapa de progreso de aprendizaje</h2>
          <p className="sub">Progreso medio por región; solo agregados, sin datos individuales</p>
          <AsyncView state={dashboard} onRetry={dashboard.reload} skeleton={<Skeleton height={190} />}>
            {(d) => <GeoProgress regions={d.geo} />}
          </AsyncView>
        </section>

        <section className="card c6" id="tutor">
          <h2>Recomendaciones de IA</h2>
          <p className="sub">Estimaciones del modelo v0.1-DEMO, no son diagnósticos</p>
          <AsyncView state={recommendations} onRetry={recommendations.reload}>
            {(items) => <RecommendationList items={items} onFeedback={handleFeedback} />}
          </AsyncView>
        </section>

        <section className="card c12">
          <h2>Actividad reciente</h2>
          <p className="sub">Eventos en tiempo simulado</p>
          <ActivityFeed events={events} />
        </section>
      </div>
    </>
  )
}
