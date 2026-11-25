import { useState } from 'react'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { ModuleIcon } from '@/components/ui/icons'
import { NeuralVisualizerPanel } from '../components/NeuralVisualizerPanel'

interface StateRow {
  state: string
  behavior: string
}

/** Estados reales que la UI debe distinguir (spec 10.4). */
const STATES: readonly StateRow[] = [
  { state: 'Detenido', behavior: 'Topología visible, sin pulsos; muestra la última ejecución.' },
  { state: 'Cargando datos', behavior: 'Indicador de preparación y dataset/versión seleccionada.' },
  { state: 'Entrenando', behavior: 'Progreso, época, loss y métricas desde el worker; retropropagación permitida.' },
  { state: 'Validando', behavior: 'Métricas de validación; no se confunde con entrenamiento.' },
  { state: 'Publicado', behavior: 'Versión activa y fecha de promoción.' },
  { state: 'Inferencia activa', behavior: 'Propagación hacia delante asociada a una solicitud real.' },
  { state: 'Error', behavior: 'Mensaje seguro, correlation_id y reintento autorizado.' },
]

const COLUMNS: readonly Column<StateRow>[] = [
  { key: 'state', header: 'Estado', render: (s) => <b>{s.state}</b> },
  { key: 'behavior', header: 'Comportamiento esperado', render: (s) => s.behavior },
]

type NeuralTab = 'visualizador' | 'estados'
const TABS: readonly { id: NeuralTab; label: string }[] = [
  { id: 'visualizador', label: 'Visualizador' },
  { id: 'estados', label: 'Estados del visualizador' },
]

export function NeuralNetworkPage() {
  const [tab, setTab] = useState<NeuralTab>('visualizador')
  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Arquitectura neuronal"
        title="Red neuronal"
        description="Capas, dimensiones y estado del proceso. Una animación no demuestra que el modelo esté entrenando."
      />
      <Tabs label="Secciones de la red neuronal" tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'visualizador' ? (
      <TabPanel id="visualizador">
      <div className="gd">
        <NeuralVisualizerPanel />
        <section className="card c4">
          <h2>Antes de publicar</h2>
          <p className="sub">Reglas de la especificación (9).</p>
          <ul>
            <li className="a">Construir baselines interpretables y compararlos con la red.</li>
            <li className="a">Evaluar calibración, equidad y coste; no publicar solo por ser una red neuronal.</li>
            <li className="a">Aprobación técnica y funcional, shadow inference y rollback probado.</li>
          </ul>
        </section>
      </div>
      </TabPanel>
      ) : (
      <TabPanel id="estados">
      <div className="gd">
        <section className="card c12">
          <h2>Estados del visualizador</h2>
          <p className="sub">En el demo los estados se simulan y están rotulados; en producción llegan por eventos model.training.*</p>
          <DataTable caption="Estados del visualizador neuronal" columns={COLUMNS} rows={STATES} rowKey={(s) => s.state} pageSize={8} />
        </section>
      </div>
      </TabPanel>
      )}
    </>
  )
}
