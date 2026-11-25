import type { AdminData } from '@/modules/administration/types'
import type { CourseAnalytics } from '@/modules/analytics/types'
import type { Assessment } from '@/modules/assessments/types'
import type { AuditEvent } from '@/modules/audit/types'
import type { Certificate } from '@/modules/certificates/types'
import type { CommunitySpace, Thread } from '@/modules/community/types'
import type { Course } from '@/modules/courses/types'
import type { PeriodDays } from '@/modules/dashboard/types'
import type { LearningPath } from '@/modules/learning-paths/types'
import type { SkillEvidence, SkillNode } from '@/modules/skill-mastery/types'
import {
  buildCourseAnalytics,
  DEMO_ADMIN,
  DEMO_ASSESSMENTS,
  DEMO_AUDIT,
  DEMO_CERTIFICATES,
  DEMO_COURSES,
  DEMO_PATHS,
  DEMO_SKILL_EVIDENCE,
  DEMO_SKILL_TREE,
  DEMO_SPACES,
  DEMO_THREADS,
  TUTOR_INITIAL,
  TUTOR_POOL,
  type TutorItem,
} from './demo/moduleData'

/*
 * Clientes de dominio de los módulos. Hoy devuelven datos DEMO; cada función indica el endpoint
 * que la reemplazará. Los que no figuran en la lista inicial de la especificación (10.1) están
 * marcados "contrato pendiente".
 */

/** GET /api/v1/courses (contrato pendiente: rutas de aprendizaje) */
export async function listLearningPaths(): Promise<LearningPath[]> {
  return [...DEMO_PATHS]
}

/** GET /api/v1/courses */
export async function listCourses(): Promise<Course[]> {
  return [...DEMO_COURSES]
}

/** contrato pendiente: evaluaciones */
export async function listAssessments(): Promise<Assessment[]> {
  return [...DEMO_ASSESSMENTS]
}

/** contrato pendiente: certificados (la verificación pública es GET /api/v1/certificates/verify/{code}) */
export async function listCertificates(): Promise<Certificate[]> {
  return [...DEMO_CERTIFICATES]
}

/** contrato pendiente: comunidad */
export async function getCommunity(): Promise<{ spaces: CommunitySpace[]; threads: Thread[] }> {
  return { spaces: [...DEMO_SPACES], threads: [...DEMO_THREADS] }
}

/** contrato pendiente: administración */
export async function getAdminData(): Promise<AdminData> {
  return DEMO_ADMIN
}

/** GET /api/v1/audit-logs */
export async function listAuditEvents(): Promise<AuditEvent[]> {
  return [...DEMO_AUDIT]
}

const PERIOD_FACTOR: Record<PeriodDays, number> = { 7: 0.25, 30: 1, 90: 2.6 }

/** GET /api/v1/analytics/progress */
export async function listCourseAnalytics(period: PeriodDays): Promise<CourseAnalytics[]> {
  return buildCourseAnalytics(PERIOD_FACTOR[period])
}

/** GET /api/v1/analytics/skill-mastery (catálogo y evidencias: contrato pendiente) */
export async function getSkillCatalog(): Promise<{ tree: SkillNode[]; evidence: SkillEvidence[] }> {
  return { tree: [...DEMO_SKILL_TREE], evidence: [...DEMO_SKILL_EVIDENCE] }
}

/** GET /api/v1/recommendations */
export async function getTutorData(): Promise<{ initial: TutorItem[]; pool: typeof TUTOR_POOL }> {
  return { initial: [...TUTOR_INITIAL], pool: TUTOR_POOL }
}
