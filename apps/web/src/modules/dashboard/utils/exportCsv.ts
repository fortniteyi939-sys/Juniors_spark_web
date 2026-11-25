import { roleLabel, type DashboardFilters, type Kpi } from '../types'

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** CSV con filtros aplicados y marca de fecha (spec 4.4). Incluye BOM para abrirse bien en Excel. */
export function buildKpiCsv(kpis: readonly Kpi[], filters: DashboardFilters, generatedAt: Date): string {
  const header = ['indicador', 'valor', 'periodo', 'rol', 'curso', 'origen', 'generado', 'cohorte', 'programa']
  const rows = kpis.map((kpi) => [
    kpi.label,
    kpi.value,
    `${filters.period}d`,
    roleLabel(filters.role),
    filters.course,
    kpi.source,
    generatedAt.toISOString(),
    filters.cohort,
    filters.program,
  ])
  return '﻿' + [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
