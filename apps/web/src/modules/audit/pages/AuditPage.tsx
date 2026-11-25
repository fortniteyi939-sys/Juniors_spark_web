import { useState } from 'react'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import { downloadCsv } from '@/modules/dashboard/utils/exportCsv'
import { listAuditEvents } from '@/services/moduleService'
import { AUDIT_CATEGORY_LABELS, type AuditCategory, type AuditEvent } from '../types'

const COLUMNS: readonly Column<AuditEvent>[] = [
  { key: 'at', header: 'Fecha', render: (e) => <time dateTime={e.at}>{formatDateTime(e.at)}</time> },
  { key: 'actor', header: 'Actor', render: (e) => e.actor },
  { key: 'action', header: 'Acción', render: (e) => <b>{e.action}</b> },
  { key: 'resource', header: 'Recurso', render: (e) => e.resource },
  { key: 'category', header: 'Categoría', render: (e) => <StatusBadge>{AUDIT_CATEGORY_LABELS[e.category]}</StatusBadge> },
]

export function AuditPage() {
  const data = useAsyncData(listAuditEvents, [])
  const [category, setCategory] = useState<'all' | AuditCategory>('all')

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Control y cumplimiento"
        title="Auditoría"
        description="Bitácora de sesiones, cambios de rol, notas, certificados, exportaciones, datasets y despliegues de modelos."
        actions={
          <select aria-label="Categoría" value={category} onChange={(e) => setCategory(e.target.value as 'all' | AuditCategory)}>
            <option value="all">Todas las categorías</option>
            {(Object.keys(AUDIT_CATEGORY_LABELS) as AuditCategory[]).map((c) => (
              <option key={c} value={c}>
                {AUDIT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        }
      />
      <section className="card">
        <p className="note">El rol Auditor solo tiene lectura. En producción la bitácora estará protegida contra alteración (spec 11).</p>
        <AsyncView state={data} onRetry={data.reload}>
          {(events) => {
            const visible = events.filter((e) => category === 'all' || e.category === category)
            const exportCsv = () => {
              const rows = [
                ['fecha_utc', 'actor', 'accion', 'recurso', 'categoria'],
                ...visible.map((e) => [e.at, e.actor, e.action, e.resource, AUDIT_CATEGORY_LABELS[e.category]]),
              ]
              downloadCsv('edumaster_auditoria_demo.csv', toCsv(rows))
            }
            return (
              <>
                <div className="fb">
                  <button type="button" className="btn" onClick={exportCsv} disabled={visible.length === 0}>
                    Exportar CSV
                  </button>
                  <small>La exportación de auditoría también queda registrada en producción.</small>
                </div>
                <DataTable caption="Eventos de auditoría" columns={COLUMNS} rows={visible} rowKey={(e) => e.id} pageSize={8} />
              </>
            )
          }}
        </AsyncView>
      </section>
    </>
  )
}
