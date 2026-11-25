import type { Kpi, KpiTone } from '@/modules/dashboard/types'
import { Skeleton } from '@/components/feedback/Skeleton'

const TONE_CLASS: Record<KpiTone, string> = {
  default: '',
  success: 'g',
  ai: 'v',
  warning: 'a',
}

interface KpiCardProps {
  kpi: Kpi
  /** Fecha ISO de actualización del dato (spec 4.1: valor, variación, fecha y origen). */
  updatedAt: string
}

export function KpiCard({ kpi, updatedAt }: KpiCardProps) {
  const time = new Date(updatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  return (
    <article className={`card m ${TONE_CLASS[kpi.tone]}`.trim()}>
      <span>{kpi.label}</span>
      <strong>{kpi.value}</strong>
      <small className={kpi.trend === 'up' ? 'up' : 'dn'}>{kpi.delta} vs. periodo anterior</small>
      <small>
        {kpi.source} · <time dateTime={updatedAt}>{time}</time>
      </small>
    </article>
  )
}

export function KpiCardSkeleton() {
  return (
    <article className="card m" aria-hidden="true">
      <Skeleton height={10} width="60%" />
      <Skeleton height={22} width="50%" />
      <Skeleton height={10} width="80%" />
      <Skeleton height={10} width="70%" />
    </article>
  )
}
