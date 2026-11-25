import { useState } from 'react'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDateTime } from '@/lib/format'
import { getCommunity } from '@/services/moduleService'
import { THREAD_KIND_LABELS, type CommunitySpace, type Thread, type ThreadKind } from '../types'

export function CommunityPage() {
  const data = useAsyncData(getCommunity, [])
  const [kind, setKind] = useState<'all' | ThreadKind>('all')
  const [muted, setMuted] = useState<ReadonlySet<string>>(new Set())

  const toggleMute = (id: string) =>
    setMuted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Colaboración"
        title="Comunidad"
        description="Espacios por curso, anuncios, debates, moderación y preferencias de silencio."
        actions={
          <select aria-label="Tipo de publicación" value={kind} onChange={(e) => setKind(e.target.value as 'all' | ThreadKind)}>
            <option value="all">Anuncios y debates</option>
            <option value="announcement">Solo anuncios</option>
            <option value="debate">Solo debates</option>
          </select>
        }
      />
      <AsyncView state={data} onRetry={data.reload}>
        {({ spaces, threads }) => {
          const spaceName = (id: string) => spaces.find((s) => s.id === id)?.course ?? id
          const pendingReports = threads.reduce((sum, t) => sum + t.reports, 0)
          const columns: Column<Thread>[] = [
            { key: 'title', header: 'Publicación', render: (t) => <b>{t.title}</b> },
            { key: 'kind', header: 'Tipo', render: (t) => <StatusBadge tone={t.kind === 'announcement' ? 'ai' : 'muted'}>{THREAD_KIND_LABELS[t.kind]}</StatusBadge> },
            { key: 'space', header: 'Espacio', render: (t) => spaceName(t.spaceId) },
            { key: 'author', header: 'Autor', render: (t) => t.author },
            { key: 'replies', header: 'Respuestas', numeric: true, render: (t) => t.replies },
            { key: 'at', header: 'Fecha', render: (t) => formatDateTime(t.at) },
            { key: 'reports', header: 'Moderación', render: (t) => (t.reports > 0 ? <StatusBadge tone="off">{`${t.reports} reporte(s)`}</StatusBadge> : '—') },
          ]
          return (
            <div className="gd">
              <section className="card c4">
                <h2>Espacios por curso</h2>
                <p className="sub">{pendingReports} reporte(s) de contenido pendientes de moderación.</p>
                <ul>
                  {spaces.map((space: CommunitySpace) => {
                    const isMuted = muted.has(space.id)
                    return (
                      <li key={space.id} className="r">
                        <b>{space.course}</b>
                        <small>
                          {space.members} miembros · {isMuted ? 'Silenciado' : `${space.unread} sin leer`}
                        </small>
                        <div className="bt">
                          <button type="button" className="btn g sm" aria-pressed={isMuted} onClick={() => toggleMute(space.id)}>
                            {isMuted ? 'Activar notificaciones' : 'Silenciar'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
              <section className="card c8">
                <h2>Anuncios y debates</h2>
                <p className="sub">Las respuestas quedan asociadas al hilo; los reportes pasan a moderación.</p>
                <DataTable
                  caption="Publicaciones de la comunidad"
                  columns={columns}
                  rows={threads.filter((t) => kind === 'all' || t.kind === kind)}
                  rowKey={(t) => t.id}
                  emptyTitle="Sin publicaciones"
                />
              </section>
            </div>
          )
        }}
      </AsyncView>
    </>
  )
}
