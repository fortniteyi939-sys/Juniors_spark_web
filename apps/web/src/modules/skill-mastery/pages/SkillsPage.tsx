import { useState } from 'react'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { SkillHeatmap } from '@/components/charts/SkillHeatmap'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/lib/format'
import { DEFAULT_FILTERS } from '@/modules/dashboard/types'
import { getSkillMastery } from '@/services/dashboardService'
import { getSkillCatalog } from '@/services/moduleService'
import type { SkillEvidence, SkillNode } from '../types'

const COLUMNS: readonly Column<SkillEvidence>[] = [
  { key: 'skill', header: 'Competencia', render: (e) => <b>{e.skill}</b> },
  { key: 'source', header: 'Evidencia', render: (e) => e.source },
  { key: 'date', header: 'Observada', render: (e) => formatDate(e.observedAt) },
  { key: 'ai', header: 'Nivel estimado (IA)', render: (e) => <StatusBadge tone="ai">{e.aiLevel}</StatusBadge> },
  {
    key: 'teacher',
    header: 'Nivel validado (docente)',
    render: (e) =>
      e.teacherLevel === null ? <StatusBadge tone="warn">Pendiente de validar</StatusBadge> : <StatusBadge tone="ok">{e.teacherLevel}</StatusBadge>,
  },
]

function Tree({ nodes }: { nodes: readonly SkillNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id} className={node.children ? undefined : 'a'}>
          {node.children ? <b>{node.name}</b> : node.name}
          {node.children ? <Tree nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  )
}

type SkillsTab = 'mapa' | 'evidencias'
const TABS: readonly { id: SkillsTab; label: string }[] = [
  { id: 'mapa', label: 'Mapa y catálogo' },
  { id: 'evidencias', label: 'Evidencias' },
]

export function SkillsPage() {
  const mastery = useAsyncData(() => getSkillMastery(DEFAULT_FILTERS), [])
  const catalog = useAsyncData(getSkillCatalog, [])
  const [tab, setTab] = useState<SkillsTab>('mapa')

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Competencias"
        title="Dominio de habilidades"
        description="Catálogo jerárquico, evidencias y mapa de calor por nivel; la estimación IA se distingue del nivel validado por el docente."
      />
      <Tabs label="Secciones de habilidades" tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'mapa' ? (
      <TabPanel id="mapa">
      <div className="gd">
        <section className="card c8">
          <h2>Mapa de calor por nivel</h2>
          <p className="sub">Niveles: principiante, elemental, intermedio, avanzado y experto. Estimación IA, no certificada.</p>
          <AsyncView state={mastery} onRetry={mastery.reload}>
            {(m) => <SkillHeatmap {...m} />}
          </AsyncView>
        </section>
        <section className="card c4">
          <h2>Catálogo de competencias</h2>
          <p className="sub">Relación curso → actividad → competencia.</p>
          <AsyncView state={catalog} onRetry={catalog.reload}>
            {({ tree }) => <Tree nodes={tree} />}
          </AsyncView>
        </section>
      </div>
      </TabPanel>
      ) : (
      <TabPanel id="evidencias">
      <div className="gd">
        <section className="card c12">
          <h2>Evidencias</h2>
          <p className="sub">El docente valida o corrige cada evidencia; la estimación del modelo nunca la reemplaza.</p>
          <AsyncView state={catalog} onRetry={catalog.reload}>
            {({ evidence }) => <DataTable caption="Evidencias de competencias" columns={COLUMNS} rows={evidence} rowKey={(e) => e.id} />}
          </AsyncView>
        </section>
      </div>
      </TabPanel>
      )}
    </>
  )
}
