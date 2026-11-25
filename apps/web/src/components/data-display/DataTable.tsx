import { useState, type ReactNode } from 'react'
import { EmptyState } from '@/components/feedback/EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  numeric?: boolean
}

interface DataTableProps<T> {
  caption: string
  columns: readonly Column<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  pageSize?: number
  emptyTitle?: string
  emptyHint?: string
}

/** Tabla accesible con paginación local; el backend la reemplazará por paginación por cursor (spec 10.1). */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  pageSize = 6,
  emptyTitle = 'Sin resultados',
  emptyHint = 'Ajusta los filtros para ver registros.',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  if (rows.length === 0) return <EmptyState title={emptyTitle}>{emptyHint}</EmptyState>

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * pageSize, (current + 1) * pageSize)

  return (
    <>
      <div className="tw">
        <table className="dt">
          <caption className="sr">{caption}</caption>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.numeric ? 'num' : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key} className={col.numeric ? 'num' : undefined}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="pager">
          <span>
            Página {current + 1} de {pages} · {rows.length} registros
          </span>
          <button type="button" className="btn g sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Anterior
          </button>
          <button
            type="button"
            className="btn g sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </>
  )
}
