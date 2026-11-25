import { useCallback, useEffect, useState } from 'react'
import { DEMO_EVENT_TEXTS } from '@/services/demo/demoData'
import type { ActivityEvent } from '../types'

const MAX_EVENTS = 6
const SIMULATION_INTERVAL_MS = 4500

let nextId = 1

function createEvent(text: string): ActivityEvent {
  return { id: nextId++, at: new Date().toISOString(), text }
}

function seedEvents(): ActivityEvent[] {
  // Más reciente primero.
  return DEMO_EVENT_TEXTS.slice(0, 4)
    .map(createEvent)
    .reverse()
}

/**
 * Feed de actividad reciente. En el demo simula eventos cada pocos segundos (rotulados DEMO);
 * en producción se alimenta del canal SSE/WebSocket autorizado por institución (spec 10.3).
 */
export function useActivityFeed(simulate = true): {
  events: ActivityEvent[]
  log: (text: string) => void
} {
  const [events, setEvents] = useState<ActivityEvent[]>(seedEvents)

  const log = useCallback((text: string) => {
    const event = createEvent(text)
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS))
  }, [])

  useEffect(() => {
    if (!simulate) return
    const id = window.setInterval(() => {
      const text = DEMO_EVENT_TEXTS[Math.floor(Math.random() * DEMO_EVENT_TEXTS.length)]
      log(`${text} (DEMO)`)
    }, SIMULATION_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [simulate, log])

  return { events, log }
}
