const TZ = 'America/Lima'

/** Fechas en la zona horaria institucional (spec 7.2: se guardan en UTC y se muestran en zona local). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}
