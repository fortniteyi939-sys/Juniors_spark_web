import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/csv'
import { verifyCertificate } from '@/modules/certificates/verify'
import { DEFAULT_FILTERS } from '@/modules/dashboard/types'
import { buildDashboardSummary, buildGeoProgress } from '@/services/demo/demoData'
import { buildCourseAnalytics, DEMO_CERTIFICATES } from '@/services/demo/moduleData'

describe('verificación pública de certificados', () => {
  it('valida un certificado emitido y expone solo datos mínimos', () => {
    const result = verifyCertificate(' em-7k2q-9f4d ', DEMO_CERTIFICATES)
    expect(result.result).toBe('valid')
    expect(Object.keys(result).sort()).toEqual(['course', 'folio', 'issuedAt', 'result'])
  })

  it('distingue anulado y expirado', () => {
    expect(verifyCertificate('EM-5TQP-8WZ1', DEMO_CERTIFICATES).result).toBe('revoked')
    expect(verifyCertificate('EM-9RBN-4CJ7', DEMO_CERTIFICATES).result).toBe('expired')
  })

  it('no verifica borradores ni códigos inexistentes', () => {
    expect(verifyCertificate('EM-0000-0001', DEMO_CERTIFICATES).result).toBe('not-found')
    expect(verifyCertificate('XX', DEMO_CERTIFICATES).result).toBe('not-found')
  })
})

describe('datos del dashboard según el documento', () => {
  it('no publica una métrica de precisión sin modelo validado', () => {
    const kpi = buildDashboardSummary(DEFAULT_FILTERS).kpis.find((k) => k.id === 'auc')
    expect(kpi?.value).toBe('N/D')
  })

  it('el progreso geográfico es agregado y determinista', () => {
    const geo = buildGeoProgress(DEFAULT_FILTERS)
    expect(geo).toEqual(buildGeoProgress(DEFAULT_FILTERS))
    expect(geo.every((r) => r.pct >= 0 && r.pct <= 100)).toBe(true)
    expect(Object.keys(geo[0]).sort()).toEqual(['name', 'pct', 'students'])
  })

  it('cambia con la cohorte y el programa', () => {
    const other = { ...DEFAULT_FILTERS, cohort: 'Cohorte 2026-II' as const }
    expect(buildGeoProgress(other)).not.toEqual(buildGeoProgress(DEFAULT_FILTERS))
  })
})

describe('analítica y CSV', () => {
  it('escala horas con el periodo y conserva los porcentajes', () => {
    const base = buildCourseAnalytics(1)[0]
    const week = buildCourseAnalytics(0.25)[0]
    expect(week.activeHours).toBe(Math.round(base.activeHours * 0.25))
    expect(week.completionPct).toBe(base.completionPct)
  })

  it('toCsv entrecomilla comas, comillas y saltos de línea', () => {
    const csv = toCsv([['a', 'b'], ['x,y', 'say "hi"']])
    expect(csv.startsWith('\ufeffa,b')).toBe(true)
    expect(csv).toContain('"x,y","say ""hi"""')
  })
})
