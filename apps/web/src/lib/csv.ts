function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Convierte filas a CSV (con BOM para Excel). La primera fila es el encabezado. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return '\ufeff' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}
