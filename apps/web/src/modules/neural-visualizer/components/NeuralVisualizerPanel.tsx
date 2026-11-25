import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { DEMO_LAYERS, MAX_EPOCH, trainingLoss } from '../neuralTopology'
import type { NetworkMode } from '../types'
import { NeuralNetworkCanvas } from './NeuralNetworkCanvas'
import { TrainingStatus } from './TrainingStatus'

const MODES: readonly { value: NetworkMode; label: string }[] = [
  { value: 'inference', label: 'Inferencia' },
  { value: 'training', label: 'Entrenamiento' },
  { value: 'idle', label: 'Detenido' },
]

const STATE_LABELS: Record<NetworkMode, string> = {
  inference: 'Inferencia',
  training: 'Entrenando (demo)',
  idle: 'Detenido',
}

const DEFAULT_INSPECTOR = 'Pasa el cursor sobre una capa para ver su detalle.'

export function NeuralVisualizerPanel() {
  const reducedMotion = useReducedMotion()
  const [mode, setMode] = useState<NetworkMode>('inference')
  const [running, setRunning] = useState(() => !reducedMotion)
  const [speed, setSpeed] = useState(1)
  const [showWeights, setShowWeights] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null)
  const [epoch, setEpoch] = useState(0)

  // Época simulada: avanza solo en modo entrenamiento y con la animación en marcha.
  useEffect(() => {
    if (mode !== 'training' || !running) return
    const id = window.setInterval(() => setEpoch((e) => (e + 1) % (MAX_EPOCH + 1)), 600)
    return () => window.clearInterval(id)
  }, [mode, running])

  const changeMode = (next: NetworkMode) => {
    setMode(next)
    if (next !== 'training') setEpoch(0)
  }

  const reset = () => {
    setEpoch(0)
    setResetKey((k) => k + 1)
  }

  const layer = hoveredLayer === null ? null : DEMO_LAYERS[hoveredLayer]

  return (
    <section className="card c8" id="red">
      <div className="nnh">
        <div>
          <h2>Red neuronal multitarea</h2>
          <p className="sub" style={{ margin: 0 }}>
            Animación de demostración: topología y pulsos simulados, no son activaciones reales.
          </p>
        </div>
        <span className={mode === 'training' ? 'state t' : 'state'}>
          <i />
          <span>{STATE_LABELS[mode]}</span>
        </span>
      </div>

      <div className="ctl" style={{ marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="Estado">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={mode === option.value ? 'on' : undefined}
              aria-pressed={mode === option.value}
              onClick={() => changeMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn g sm" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pausar' : 'Reanudar'}
        </button>
        <button type="button" className="btn g sm" onClick={reset}>
          Reiniciar
        </button>
        <label>
          Velocidad
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={showWeights} onChange={(e) => setShowWeights(e.target.checked)} /> Pesos
        </label>
      </div>

      <NeuralNetworkCanvas
        layers={DEMO_LAYERS}
        mode={mode}
        running={running}
        speed={speed}
        showWeights={showWeights}
        resetKey={resetKey}
        onHoverLayer={setHoveredLayer}
      />

      <TrainingStatus epoch={epoch} loss={mode === 'training' ? trainingLoss(epoch) : null} />

      <div className="insp" aria-live="polite">
        {layer ? `${layer.name}: ${layer.neurons} neuronas (resumen) · ${layer.detail}` : DEFAULT_INSPECTOR}
      </div>
    </section>
  )
}
