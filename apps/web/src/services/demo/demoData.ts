import type {
  DashboardFilters,
  DashboardSummary,
  Kpi,
  KpiTone,
  PeriodDays,
  ProgressTrend,
  Role,
} from '@/modules/dashboard/types'
import type { RegionProgress } from '@/components/charts/GeoProgress'
import type { SkillMastery } from '@/modules/skill-mastery/types'
import type { Recommendation } from '@/modules/recommendations/types'
import { hashString, mulberry32 } from './rng'

/**
 * Datos DEMO sintéticos. Ninguna cifra corresponde a datos institucionales reales
 * ni a un modelo validado. Reemplazar estas funciones por llamadas a la API
 * (ver services/dashboardService.ts) sin cambiar la UI.
 */

type BaseValues = readonly [
  students: number,
  courses: number,
  hours: number,
  certificates: number,
  completionPct: number,
]

const BASE: Record<Role, BaseValues> = {
  inst: [2481, 36, 12940, 812, 68],
  doc: [142, 4, 980, 57, 72],
  est: [1, 5, 64, 2, 46],
}

const PERIOD_FACTOR: Record<PeriodDays, number> = { 7: 0.25, 30: 1, 90: 2.6 }
const TREND_POINTS: Record<PeriodDays, number> = { 7: 7, 30: 15, 90: 24 }

interface KpiDef {
  id: string
  label: string
  tone: KpiTone
  source: string
  delta: string
  trend: 'up' | 'down'
}

const KPI_DEFS: readonly KpiDef[] = [
  { id: 'students', label: 'Estudiantes activos', tone: 'default', source: 'Eventos DEMO', delta: '+4.2%', trend: 'up' },
  { id: 'courses', label: 'Cursos', tone: 'success', source: 'Catálogo DEMO', delta: '+2', trend: 'up' },
  { id: 'hours', label: 'Horas de aprendizaje', tone: 'default', source: 'learning_events DEMO', delta: '+8.1%', trend: 'up' },
  { id: 'certs', label: 'Certificaciones', tone: 'ai', source: 'certificates DEMO', delta: '+11%', trend: 'up' },
  { id: 'completion', label: 'Finalización', tone: 'warning', source: 'Agregados DEMO', delta: '−1.3 pp', trend: 'down' },
  // Sin modelo validado no se publica ninguna métrica de precisión (spec: nota final).
  { id: 'auc', label: 'Calidad del modelo', tone: 'ai', source: 'Sin modelo validado', delta: '—', trend: 'up' },
]

const numberFormat = new Intl.NumberFormat('es-PE')

export function buildDashboardSummary(filters: DashboardFilters, now: Date = new Date()): DashboardSummary {
  const [students, courses, hours, certificates, completionPct] = BASE[filters.role]
  const factor = PERIOD_FACTOR[filters.period]
  const values = [
    numberFormat.format(students),
    String(courses),
    numberFormat.format(Math.round(hours * factor)),
    numberFormat.format(Math.round(certificates * factor)),
    `${completionPct}%`,
    'N/D',
  ]
  const kpis: Kpi[] = KPI_DEFS.map((def, i) => ({
    id: def.id,
    label: def.label,
    value: values[i],
    delta: def.delta,
    trend: def.trend,
    source: def.source,
    tone: def.tone,
  }))
  return { kpis, completionPct, updatedAt: now.toISOString(), isDemo: true }
}

function filterSeed(filters: DashboardFilters, salt: string): number {
  return hashString(`${salt}|${filters.role}|${filters.period}|${filters.course}|${filters.cohort}|${filters.program}`)
}

function trendSeries(points: number, offset: number, amplitude: number, rng: () => number): number[] {
  return Array.from({ length: points }, (_, i) => {
    const v = 30 + offset + (i * 60) / points + Math.sin(i * 0.9 + offset) * amplitude + rng() * 8
    return Math.round(v * 10) / 10
  })
}

export function buildProgressTrend(filters: DashboardFilters): ProgressTrend {
  const rng = mulberry32(filterSeed(filters, 'trend'))
  const n = TREND_POINTS[filters.period]
  return {
    hours: trendSeries(n, 10, 10, rng),
    activities: trendSeries(n, 0, 8, rng),
  }
}

const REGIONS = ['Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cusco', 'Junín'] as const

/** Progreso medio por región: solo agregados, nunca datos individuales. */
export function buildGeoProgress(filters: DashboardFilters): RegionProgress[] {
  const rng = mulberry32(filterSeed(filters, 'geo'))
  const total = BASE[filters.role][0]
  return REGIONS.map((name, i) => ({
    name,
    pct: Math.round(45 + rng() * 45),
    students: Math.max(1, Math.round((total * (REGIONS.length - i)) / 21)),
  }))
}

export const SKILLS = ['Álgebra', 'Lógica', 'Programación', 'Estadística', 'Comunicación'] as const
export const LEVELS = ['Principiante', 'Elemental', 'Intermedio', 'Avanzado', 'Experto'] as const

export function buildSkillMastery(filters: DashboardFilters): SkillMastery {
  const rng = mulberry32(filterSeed(filters, 'mastery'))
  const matrix = SKILLS.map(() => {
    const weights = LEVELS.map(() => rng())
    const total = weights.reduce((a, b) => a + b, 0)
    return weights.map((w) => Math.round((w / total) * 100))
  })
  return { skills: [...SKILLS], levels: [...LEVELS], matrix }
}

export const DEMO_RECOMMENDATIONS: readonly Recommendation[] = [
  {
    id: 'rec-algebra',
    title: 'Reforzar álgebra lineal',
    reason: 'Brecha en Álgebra; última evaluación 54%. Dificultad estimada: media.',
  },
  {
    id: 'rec-funciones',
    title: 'Repetir práctica de funciones',
    reason: '3 intentos recientes sin completar. Actividad previa: Taller 4.',
  },
  {
    id: 'rec-estadistica',
    title: 'Continuar ruta: Estadística',
    reason: 'Cumples el prerrequisito; objetivo de la ruta en 12 días.',
  },
]

export const DEMO_EVENT_TEXTS: readonly string[] = [
  'Entrega recibida: Taller 4',
  'Lección vista: Funciones',
  'Certificado emitido',
  'Evaluación enviada',
  'Curso completado',
  'Nueva recomendación',
]
