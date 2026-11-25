import type { DashboardData, DashboardFilters, DashboardSummary, ProgressTrend } from '@/modules/dashboard/types'
import type { SkillMastery } from '@/modules/skill-mastery/types'
import { buildDashboardSummary, buildGeoProgress, buildProgressTrend, buildSkillMastery } from './demo/demoData'

/*
 * Cliente de dominio "dashboard". Hoy devuelve datos DEMO; para conectar el backend
 * reemplazar el cuerpo de cada función por una llamada a la API:
 *   getDashboardSummary -> GET /api/v1/dashboard/summary
 *   getProgressTrend    -> GET /api/v1/analytics/progress
 *   getSkillMastery     -> GET /api/v1/analytics/skill-mastery
 */

export async function getDashboardSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  return buildDashboardSummary(filters)
}

export async function getProgressTrend(filters: DashboardFilters): Promise<ProgressTrend> {
  return buildProgressTrend(filters)
}

export async function getSkillMastery(filters: DashboardFilters): Promise<SkillMastery> {
  return buildSkillMastery(filters)
}

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const [summary, trend, mastery] = await Promise.all([
    getDashboardSummary(filters),
    getProgressTrend(filters),
    getSkillMastery(filters),
  ])
  return { summary, trend, mastery, geo: buildGeoProgress(filters) }
}
