import { EmptyState } from '@/components/feedback/EmptyState'
import type { ActivityEvent } from '../types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ActivityFeed({ events }: { events: readonly ActivityEvent[] }) {
  if (events.length === 0) return <EmptyState title="Sin actividad reciente" />
  return (
    <ul>
      {events.map((event) => (
        <li key={event.id} className="a">
          <time dateTime={event.at}>{formatTime(event.at)}</time>
          <span>{event.text}</span>
        </li>
      ))}
    </ul>
  )
}
