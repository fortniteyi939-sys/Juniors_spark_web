import { describe, expect, it } from 'vitest'
import { buildKpiCsv } from '@/modules/dashboard/utils/exportCsv'
import { DEFAULT_FILTERS } from '@/modules/dashboard/types'
import { buildDashboardSummary, buildProgressTrend, buildSkillMastery } from '@/services/demo/demoData'
import { mulberry32 } from '@/services/demo/rng'

const digits = (text: string | undefined) => Number((text ?? '').replace(/\D/g, ''))

describe('datos DEMO', () => {
  it('escala las horas de aprendizaje según el periodo', () => {
    const week = buildDashboardSummary({ ...DEFAULT_FILTERS, period: 7 })
    const quarter = buildDashboardSummary({ ...DEFAULT_FILTERS, period: 90 })
    expect(digits(week.kpis.find((k) => k.id === 'hours')?.value)).toBe(3235)
    expect(digits(quarter.kpis.find((k) => k.id === 'hours')?.value)).toBe(33644)
  })

  it('marca el resumen como DEMO y devuelve 6 KPIs con fuente', () => {
    const summary = buildDashboardSummary(DEFAULT_FILTERS)
    expect(summary.isDemo).toBe(true)
    expect(summary.kpis).toHaveLength(6)
    expect(summary.kpis.every((k) => k.source.length > 0)).toBe(true)
  })

  it('genera series y mapa de calor de forma determinista por filtros', () => {
    expect(buildProgressTrend(DEFAULT_FILTERS)).toEqual(buildProgressTrend(DEFAULT_FILTERS))
    expect(buildSkillMastery(DEFAULT_FILTERS)).toEqual(buildSkillMastery(DEFAULT_FILTERS))
    expect(buildSkillMastery(DEFAULT_FILTERS)).not.toEqual(buildSkillMastery({ ...DEFAULT_FILTERS, role: 'doc' }))
  })

  it('usa 7, 15 y 24 puntos de tendencia según el periodo', () => {
    expect(buildProgressTrend({ ...DEFAULT_FILTERS, period: 7 }).hours).toHaveLength(7)
    expect(buildProgressTrend({ ...DEFAULT_FILTERS, period: 30 }).hours).toHaveLength(15)
    expect(buildProgressTrend({ ...DEFAULT_FILTERS, period: 90 }).hours).toHaveLength(24)
  })

  it('el mapa de calor tiene 5x5 celdas entre 0 y 100', () => {
    const { matrix } = buildSkillMastery(DEFAULT_FILTERS)
    expect(matrix).toHaveLength(5)
    for (const row of matrix) {
      expect(row).toHaveLength(5)
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0)
        expect(cell).toBeLessThanOrEqual(100)
      }
    }
  })

  it('mulberry32 es reproducible', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe('exportación CSV', () => {
  it('entrecomilla celdas con comas y declara filtros y fecha', () => {
    const summary = buildDashboardSummary(DEFAULT_FILTERS)
    const csv = buildKpiCsv(
      [{ ...summary.kpis[0], value: '12,940' }],
      DEFAULT_FILTERS,
      new Date('2026-11-25T05:00:00.000Z'),
    )
    expect(csv.startsWith('﻿indicador,valor,periodo,rol,curso,origen,generado')).toBe(true)
    expect(csv).toContain('"12,940"')
    expect(csv).toContain('30d,Administrador,Todos los cursos')
    expect(csv).toContain('2026-11-25T05:00:00.000Z')
  })
})
