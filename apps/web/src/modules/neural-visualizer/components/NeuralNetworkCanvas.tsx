import { useEffect, useRef } from 'react'
import type { NetworkLayer, NetworkMode } from '../types'

interface NeuralNetworkCanvasProps {
  layers: readonly NetworkLayer[]
  mode: NetworkMode
  running: boolean
  speed: number
  showWeights: boolean
  /** Cambia para regenerar el grafo y limpiar los pulsos. */
  resetKey: number
  onHoverLayer: (layer: number | null) => void
}

interface Palette {
  pr: string
  vi: string
  gr: string
  mu: string
  am: string
}

interface GraphNode {
  layer: number
  x: number
  y: number
}

interface GraphEdge {
  from: number
  to: number
  weight: number
}

interface Pulse {
  edge: GraphEdge
  t: number
  reverse: boolean
}

const PADDING = 50
const HOVER_DISTANCE = 40

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement)
  const get = (name: string) => style.getPropertyValue(name).trim()
  // Colores propios del lienzo: siempre se dibuja sobre fondo oscuro (Negro Piano).
  return { pr: get('--cv-pr'), vi: get('--cv-vi'), gr: get('--cv-gr'), mu: get('--cv-mu'), am: get('--cv-am') }
}

/**
 * Visualización de la red en Canvas. Es un componente aislado: la animación corre en
 * requestAnimationFrame y no re-renderiza React en cada frame (spec 5.3).
 * Los pulsos son una demostración: no representan activaciones reales del modelo.
 */
export function NeuralNetworkCanvas({
  layers,
  mode,
  running,
  speed,
  showWeights,
  resetKey,
  onHoverLayer,
}: NeuralNetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const live = useRef({ mode, running, speed, showWeights, onHoverLayer })

  // Mantiene los valores vigentes accesibles al bucle de animación sin reiniciarlo.
  useEffect(() => {
    live.current = { mode, running, speed, showWeights, onHoverLayer }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let frame = 0
    let last = 0
    let hovered = -1
    let palette = readPalette()
    let nodes: GraphNode[] = []
    let edges: GraphEdge[] = []
    let pulses: Pulse[] = []
    const weights = new Map<number, number>()

    const weightOf = (from: number, to: number) => {
      const key = from * 10000 + to
      let w = weights.get(key)
      if (w === undefined) {
        w = Math.random() * 2 - 1
        weights.set(key, w)
      }
      return w
    }

    const layerX = (index: number) =>
      PADDING + (index * (width - 2 * PADDING)) / Math.max(1, layers.length - 1)

    const layout = () => {
      const ratio = window.devicePixelRatio || 1
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      nodes = []
      edges = []
      layers.forEach((layer, i) => {
        for (let j = 0; j < layer.neurons; j++) {
          nodes.push({ layer: i, x: layerX(i), y: 30 + ((j + 0.5) * (height - 60)) / layer.neurons })
        }
      })
      nodes.forEach((a, i) =>
        nodes.forEach((b, j) => {
          if (b.layer === a.layer + 1) edges.push({ from: i, to: j, weight: weightOf(i, j) })
        }),
      )
    }

    const draw = (ts: number) => {
      const dt = Math.min(50, ts - last)
      last = ts
      const { mode, running, speed, showWeights } = live.current
      const animating = running && mode !== 'idle'

      ctx.clearRect(0, 0, width, height)

      for (const edge of edges) {
        const a = nodes[edge.from]
        const b = nodes[edge.to]
        ctx.globalAlpha = showWeights ? 0.25 + Math.abs(edge.weight) * 0.6 : 0.22
        ctx.strokeStyle = showWeights && edge.weight < 0 ? palette.vi : palette.pr
        ctx.lineWidth = showWeights ? 0.5 + Math.abs(edge.weight) * 1.5 : 0.8
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (animating && edges.length > 0) {
        for (let i = 0; i < Math.ceil(speed * 2); i++) {
          if (Math.random() < 0.5) {
            pulses.push({ edge: edges[Math.floor(Math.random() * edges.length)], t: 0, reverse: mode === 'training' })
          }
        }
      }

      const alive: Pulse[] = []
      for (const pulse of pulses) {
        pulse.t += (dt / 900) * speed
        if (pulse.t >= 1) continue
        const a = nodes[pulse.edge.from]
        const b = nodes[pulse.edge.to]
        const u = pulse.reverse ? 1 - pulse.t : pulse.t
        ctx.fillStyle = pulse.reverse ? palette.am : palette.pr
        ctx.beginPath()
        ctx.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 2.8, 0, Math.PI * 2)
        ctx.fill()
        alive.push(pulse)
      }
      pulses = alive

      nodes.forEach((node, i) => {
        ctx.fillStyle = palette[layers[node.layer].color]
        ctx.globalAlpha = mode === 'idle' ? 0.4 : animating ? 0.4 + 0.6 * Math.abs(Math.sin(ts / 700 + i)) : 0.75
        ctx.beginPath()
        ctx.arc(node.x, node.y, hovered === node.layer ? 8 : 6, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      ctx.fillStyle = palette.mu
      ctx.font = '600 11px Manrope, sans-serif'
      ctx.textAlign = 'center'
      layers.forEach((layer, i) => ctx.fillText(`${layer.name} (${layer.neurons})`, layerX(i), height - 8))

      frame = requestAnimationFrame(draw)
    }

    const handleMove = (event: PointerEvent) => {
      const x = event.clientX - canvas.getBoundingClientRect().left
      let best = -1
      let bestDistance = Infinity
      for (let i = 0; i < layers.length; i++) {
        const distance = Math.abs(x - layerX(i))
        if (distance < bestDistance) {
          bestDistance = distance
          best = i
        }
      }
      const next = bestDistance < HOVER_DISTANCE ? best : -1
      if (next !== hovered) {
        hovered = next
        live.current.onHoverLayer(next >= 0 ? next : null)
      }
    }

    const handleLeave = () => {
      if (hovered !== -1) {
        hovered = -1
        live.current.onHoverLayer(null)
      }
    }

    layout()
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null
    resizeObserver?.observe(canvas)
    // Relee la paleta cuando cambia el tema claro/oscuro.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    canvas.addEventListener('pointermove', handleMove)
    canvas.addEventListener('pointerleave', handleLeave)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      themeObserver.disconnect()
      canvas.removeEventListener('pointermove', handleMove)
      canvas.removeEventListener('pointerleave', handleLeave)
    }
  }, [layers, resetKey])

  return <canvas ref={canvasRef} role="img" aria-label="Red neuronal animada (demostración)" />
}
