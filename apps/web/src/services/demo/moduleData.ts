import type { AdminData } from '@/modules/administration/types'
import type { CourseAnalytics, IndicatorDefinition } from '@/modules/analytics/types'
import type { Assessment } from '@/modules/assessments/types'
import type { AuditEvent } from '@/modules/audit/types'
import type { Certificate } from '@/modules/certificates/types'
import type { CommunitySpace, Thread } from '@/modules/community/types'
import type { Course } from '@/modules/courses/types'
import type { LearningPath } from '@/modules/learning-paths/types'
import type { SkillEvidence, SkillNode } from '@/modules/skill-mastery/types'

/**
 * Datos DEMO sintéticos de los módulos. Los titulares aparecen como seudónimos y ninguna cifra
 * corresponde a datos institucionales reales (spec 8.1).
 */

export const DEMO_PATHS: readonly LearningPath[] = [
  {
    id: 'path-datos',
    title: 'Ruta de Ciencia de Datos',
    objective: 'Formar análisis y modelado básico de datos con evidencia de competencias.',
    status: 'published',
    version: 3,
    cohort: 'Cohorte 2026-II',
    progressPct: 47,
    steps: [
      { order: 1, course: 'Matemática I', competency: 'Álgebra', prerequisite: null, weeks: 6, achievement: 'Nota oficial ≥ 11 y 80% de actividades' },
      { order: 2, course: 'Programación', competency: 'Programación', prerequisite: 'Matemática I', weeks: 8, achievement: 'Proyecto final aprobado' },
      { order: 3, course: 'Estadística', competency: 'Estadística', prerequisite: 'Matemática I', weeks: 6, achievement: 'Evaluación integral ≥ 12' },
      { order: 4, course: 'Introducción a Machine Learning', competency: 'Lógica', prerequisite: 'Programación', weeks: 8, achievement: 'Práctica con rúbrica validada por docente' },
    ],
    history: [
      { at: '2026-11-10T14:20:00Z', by: 'Coord. M. Salas', change: 'Se añadió el prerrequisito Programación al paso 4.' },
      { at: '2026-10-02T16:05:00Z', by: 'Coord. M. Salas', change: 'Se publicó la versión 3 y se asignó a la cohorte 2026-II.' },
      { at: '2026-09-18T13:40:00Z', by: 'Coord. M. Salas', change: 'Se reordenaron Estadística y Programación.' },
    ],
  },
  {
    id: 'path-web',
    title: 'Ruta de Desarrollo Web',
    objective: 'Construir aplicaciones web con buenas prácticas de lógica y bases de datos.',
    status: 'published',
    version: 2,
    cohort: 'Cohorte 2026-I',
    progressPct: 71,
    steps: [
      { order: 1, course: 'Lógica computacional', competency: 'Lógica', prerequisite: null, weeks: 5, achievement: 'Evaluación ≥ 12' },
      { order: 2, course: 'Programación', competency: 'Programación', prerequisite: 'Lógica computacional', weeks: 8, achievement: 'Taller integrador aprobado' },
      { order: 3, course: 'Bases de datos', competency: 'Programación', prerequisite: 'Programación', weeks: 7, achievement: 'Diseño y consultas validados' },
    ],
    history: [{ at: '2026-08-21T15:10:00Z', by: 'Coord. R. Vega', change: 'Se publicó la versión 2.' }],
  },
  {
    id: 'path-comunicacion',
    title: 'Ruta de Comunicación Técnica',
    objective: 'Desarrollar documentación y presentación de resultados técnicos.',
    status: 'draft',
    version: 1,
    cohort: 'Sin asignar',
    progressPct: 0,
    steps: [
      { order: 1, course: 'Comunicación técnica', competency: 'Comunicación', prerequisite: null, weeks: 4, achievement: 'Informe técnico con rúbrica' },
    ],
    history: [{ at: '2026-11-19T12:00:00Z', by: 'Coord. R. Vega', change: 'Se creó el borrador.' }],
  },
]

export const DEMO_COURSES: readonly Course[] = [
  { id: 'c1', code: 'MAT-101', title: 'Matemática I', level: 'Básico', instructor: 'Doc. A. Rojas', status: 'published', version: '2.1', startsAt: '2026-08-10T00:00:00Z', competencies: ['Álgebra'], units: [{ title: 'Funciones y gráficas', lessons: 6, resources: 9, activities: 4 }, { title: 'Sistemas lineales', lessons: 5, resources: 7, activities: 3 }] },
  { id: 'c2', code: 'PRG-110', title: 'Programación', level: 'Básico', instructor: 'Doc. L. Campos', status: 'published', version: '3.0', startsAt: '2026-08-10T00:00:00Z', competencies: ['Programación', 'Lógica'], units: [{ title: 'Variables y control de flujo', lessons: 7, resources: 10, activities: 6 }, { title: 'Funciones y estructuras', lessons: 8, resources: 12, activities: 7 }, { title: 'Proyecto integrador', lessons: 3, resources: 4, activities: 2 }] },
  { id: 'c3', code: 'EST-120', title: 'Estadística', level: 'Intermedio', instructor: 'Doc. P. Torres', status: 'published', version: '1.4', startsAt: '2026-09-01T00:00:00Z', competencies: ['Estadística'], units: [{ title: 'Estadística descriptiva', lessons: 6, resources: 8, activities: 4 }, { title: 'Probabilidad', lessons: 6, resources: 8, activities: 5 }] },
  { id: 'c4', code: 'ALG-130', title: 'Álgebra lineal', level: 'Intermedio', instructor: 'Doc. A. Rojas', status: 'review', version: '1.0', startsAt: '2027-03-01T00:00:00Z', competencies: ['Álgebra'], units: [{ title: 'Vectores y matrices', lessons: 7, resources: 9, activities: 5 }] },
  { id: 'c5', code: 'LOG-105', title: 'Lógica computacional', level: 'Básico', instructor: 'Doc. L. Campos', status: 'published', version: '1.2', startsAt: '2026-08-17T00:00:00Z', competencies: ['Lógica'], units: [{ title: 'Proposiciones y tablas de verdad', lessons: 5, resources: 6, activities: 4 }] },
  { id: 'c6', code: 'COM-140', title: 'Comunicación técnica', level: 'Básico', instructor: 'Doc. S. Mendoza', status: 'draft', version: '0.3', startsAt: '2027-03-01T00:00:00Z', competencies: ['Comunicación'], units: [{ title: 'Informes y documentación', lessons: 4, resources: 5, activities: 3 }] },
  { id: 'c7', code: 'BDD-150', title: 'Bases de datos', level: 'Intermedio', instructor: 'Doc. P. Torres', status: 'published', version: '2.0', startsAt: '2026-09-14T00:00:00Z', competencies: ['Programación'], units: [{ title: 'Modelo relacional', lessons: 6, resources: 8, activities: 4 }, { title: 'SQL', lessons: 8, resources: 10, activities: 8 }] },
  { id: 'c8', code: 'ML-210', title: 'Introducción a Machine Learning', level: 'Avanzado', instructor: 'Doc. L. Campos', status: 'review', version: '0.9', startsAt: '2027-03-15T00:00:00Z', competencies: ['Estadística', 'Programación'], units: [{ title: 'Baselines interpretables', lessons: 5, resources: 7, activities: 4 }, { title: 'Evaluación y calibración', lessons: 4, resources: 6, activities: 3 }] },
]

export const DEMO_ASSESSMENTS: readonly Assessment[] = [
  { id: 'a1', title: 'Taller 4: funciones', course: 'Matemática I', type: 'practice', weightPct: 15, dueAt: '2026-11-28T04:59:00Z', maxAttempts: 2, submissions: 118, status: 'published', officialAvg: null, aiEstimateAvg: 12.4 },
  { id: 'a2', title: 'Examen parcial', course: 'Programación', type: 'mcq', weightPct: 30, dueAt: '2026-11-12T04:59:00Z', maxAttempts: 1, submissions: 142, status: 'closed', officialAvg: 13.1, aiEstimateAvg: 12.8 },
  { id: 'a3', title: 'Cuestionario de probabilidad', course: 'Estadística', type: 'tf', weightPct: 10, dueAt: '2026-12-02T04:59:00Z', maxAttempts: 3, submissions: 64, status: 'published', officialAvg: null, aiEstimateAvg: 11.7 },
  { id: 'a4', title: 'Definiciones clave', course: 'Lógica computacional', type: 'short', weightPct: 10, dueAt: '2026-11-20T04:59:00Z', maxAttempts: 2, submissions: 97, status: 'closed', officialAvg: 14.2, aiEstimateAvg: 13.6 },
  { id: 'a5', title: 'Informe de diseño de datos', course: 'Bases de datos', type: 'file', weightPct: 25, dueAt: '2026-12-10T04:59:00Z', maxAttempts: 1, submissions: 12, status: 'published', officialAvg: null, aiEstimateAvg: null },
  { id: 'a6', title: 'Proyecto final', course: 'Programación', type: 'practice', weightPct: 40, dueAt: '2026-12-18T04:59:00Z', maxAttempts: 1, submissions: 0, status: 'draft', officialAvg: null, aiEstimateAvg: null },
]

export const DEMO_CERTIFICATES: readonly Certificate[] = [
  { folio: 'EM-2026-000412', code: 'EM-7K2Q-9F4D', holder: 'Estudiante E-0142', course: 'Programación', status: 'issued', issuedAt: '2026-11-14T15:30:00Z', template: 'Estándar 2026' },
  { folio: 'EM-2026-000413', code: 'EM-3HX8-2LMA', holder: 'Estudiante E-0207', course: 'Matemática I', status: 'issued', issuedAt: '2026-11-14T15:31:00Z', template: 'Estándar 2026' },
  { folio: 'EM-2026-000398', code: 'EM-5TQP-8WZ1', holder: 'Estudiante E-0033', course: 'Estadística', status: 'revoked', issuedAt: '2026-10-30T13:10:00Z', template: 'Estándar 2026' },
  { folio: 'EM-2025-000871', code: 'EM-9RBN-4CJ7', holder: 'Estudiante E-0518', course: 'Lógica computacional', status: 'expired', issuedAt: '2025-06-02T12:00:00Z', template: 'Estándar 2025' },
  { folio: 'EM-2026-000420', code: 'EM-1VDK-6YE3', holder: 'Estudiante E-0361', course: 'Bases de datos', status: 'issued', issuedAt: '2026-11-21T16:45:00Z', template: 'Estándar 2026' },
  { folio: 'EM-2026-BORR-01', code: 'EM-0000-0001', holder: 'Estudiante E-0099', course: 'Comunicación técnica', status: 'draft', issuedAt: null, template: 'Estándar 2026' },
]

export const DEMO_SPACES: readonly CommunitySpace[] = [
  { id: 's1', course: 'Matemática I', members: 118, unread: 3 },
  { id: 's2', course: 'Programación', members: 142, unread: 7 },
  { id: 's3', course: 'Estadística', members: 64, unread: 0 },
  { id: 's4', course: 'Bases de datos', members: 85, unread: 1 },
]

export const DEMO_THREADS: readonly Thread[] = [
  { id: 't1', spaceId: 's2', kind: 'announcement', title: 'Fecha del proyecto final', author: 'Doc. L. Campos', replies: 4, at: '2026-11-24T14:00:00Z', reports: 0 },
  { id: 't2', spaceId: 's2', kind: 'debate', title: '¿Recursión o iteración en el taller 5?', author: 'Estudiante E-0142', replies: 12, at: '2026-11-23T20:15:00Z', reports: 0 },
  { id: 't3', spaceId: 's1', kind: 'debate', title: 'Dudas sobre el taller 4', author: 'Estudiante E-0207', replies: 9, at: '2026-11-23T17:40:00Z', reports: 1 },
  { id: 't4', spaceId: 's3', kind: 'announcement', title: 'Material de probabilidad actualizado', author: 'Doc. P. Torres', replies: 1, at: '2026-11-22T13:05:00Z', reports: 0 },
  { id: 't5', spaceId: 's4', kind: 'debate', title: 'Normalización: ¿hasta qué forma?', author: 'Estudiante E-0361', replies: 6, at: '2026-11-21T18:30:00Z', reports: 0 },
  { id: 't6', spaceId: 's2', kind: 'debate', title: 'Comentario con lenguaje inapropiado', author: 'Estudiante E-0611', replies: 2, at: '2026-11-20T15:10:00Z', reports: 3 },
]

export const DEMO_ADMIN: AdminData = {
  roles: [
    { role: 'Superadministrador', responsibility: 'Gobierno global de la plataforma', scope: 'Tenants, usuarios, auditoría, configuración global, modelos y despliegues' },
    { role: 'Administrador institucional', responsibility: 'Operación de una institución', scope: 'Usuarios, cursos, catálogos, reportes y configuración local' },
    { role: 'Director / coordinador', responsibility: 'Seguimiento académico', scope: 'Panel institucional, docentes, cohortes, alertas y reportes' },
    { role: 'Docente / instructor', responsibility: 'Gestión de enseñanza', scope: 'Cursos asignados, contenidos, actividades, evaluaciones y grupos propios' },
    { role: 'Estudiante', responsibility: 'Aprendizaje personal', scope: 'Rutas, cursos inscritos, evaluaciones, progreso, recomendaciones y certificados propios' },
    { role: 'Analista de datos', responsibility: 'Analítica y dataset', scope: 'Consultas autorizadas, calidad de datos y datasets seudonimizados' },
    { role: 'Científico de datos / ML Engineer', responsibility: 'Ciclo de vida del modelo', scope: 'Experimentos, entrenamiento, evaluación, registro y publicación bajo aprobación' },
    { role: 'Auditor', responsibility: 'Control y cumplimiento', scope: 'Lectura de bitácoras, versiones, accesos y evidencias; sin modificación' },
  ],
  matrix: [
    { resource: 'Usuarios y roles', admin: 'CRUD', teacher: 'Lectura limitada', student: 'Propio perfil', analyst: 'Seudonimizado', ml: 'No por defecto' },
    { resource: 'Cursos', admin: 'CRUD', teacher: 'Asignados', student: 'Inscritos', analyst: 'Lectura agregada', ml: 'No' },
    { resource: 'Calificaciones', admin: 'Total', teacher: 'Sus grupos', student: 'Propias', analyst: 'Agregadas', ml: 'Solo variables aprobadas' },
    { resource: 'Dataset', admin: 'Aprobar acceso', teacher: 'No', student: 'No', analyst: 'Preparar', ml: 'Entrenar' },
    { resource: 'Modelos', admin: 'Aprobar publicación', teacher: 'Consultar resultados', student: 'Ver recomendaciones', analyst: 'Evaluar métricas', ml: 'Entrenar / registrar' },
    { resource: 'Auditoría', admin: 'Consultar', teacher: 'Propia actividad', student: 'Propia actividad', analyst: 'Lectura autorizada', ml: 'Eventos ML' },
  ],
  users: [
    { id: 'u1', pseudonym: 'Usuario U-0001', role: 'Administrador institucional', status: 'active', lastAccess: '2026-11-25T10:12:00Z' },
    { id: 'u2', pseudonym: 'Usuario U-0014', role: 'Director / coordinador', status: 'active', lastAccess: '2026-11-24T21:40:00Z' },
    { id: 'u3', pseudonym: 'Usuario U-0027', role: 'Docente / instructor', status: 'active', lastAccess: '2026-11-25T09:02:00Z' },
    { id: 'u4', pseudonym: 'Usuario U-0058', role: 'Analista de datos', status: 'active', lastAccess: '2026-11-23T16:25:00Z' },
    { id: 'u5', pseudonym: 'Usuario U-0071', role: 'Científico de datos / ML Engineer', status: 'active', lastAccess: '2026-11-22T14:00:00Z' },
    { id: 'u6', pseudonym: 'Usuario U-0093', role: 'Docente / instructor', status: 'suspended', lastAccess: '2026-09-30T18:15:00Z' },
  ],
  parameters: [
    { name: 'Zona horaria institucional', value: 'America/Lima', defined: true, note: 'Se guardan fechas en UTC y se muestran en zona local.' },
    { name: 'Idioma de la interfaz', value: 'Español', defined: true, note: 'Mensajes de formularios en español.' },
    { name: 'Multiinstitución desde el primer despliegue', value: 'Por confirmar', defined: false, note: 'Decisión del Product Owner (spec 17.1).' },
    { name: 'Política de retención de eventos', value: 'Por definir', defined: false, note: 'Debe definirse antes de acumular eventos históricos (spec 7.3).' },
    { name: 'Población incluida y menores de edad', value: 'Por confirmar', defined: false, note: 'Requiere revisión legal (Ley N.° 29733).' },
    { name: 'Integraciones externas (LMS, pagos, videoconferencia)', value: 'Pendiente de aprobación', defined: false, note: 'Fuera de alcance inicial hasta aprobar sus APIs.' },
  ],
}

export const DEMO_AUDIT: readonly AuditEvent[] = [
  { id: 'e01', at: '2026-11-25T10:12:00Z', actor: 'Usuario U-0001', action: 'Inicio de sesión', resource: 'Sesión', category: 'session' },
  { id: 'e02', at: '2026-11-25T09:48:00Z', actor: 'Usuario U-0027', action: 'Confirmó nota oficial', resource: 'Examen parcial · Programación', category: 'academic' },
  { id: 'e03', at: '2026-11-24T22:05:00Z', actor: 'Usuario U-0014', action: 'Cambió el rol de un usuario', resource: 'Usuario U-0093', category: 'permissions' },
  { id: 'e04', at: '2026-11-24T20:30:00Z', actor: 'Usuario U-0058', action: 'Exportó reporte CSV', resource: 'Analítica · Programación', category: 'export' },
  { id: 'e05', at: '2026-11-23T16:25:00Z', actor: 'Usuario U-0058', action: 'Creó dataset DEMO', resource: 'demo_sint_2026.11', category: 'ml' },
  { id: 'e06', at: '2026-11-22T14:10:00Z', actor: 'Usuario U-0071', action: 'Solicitó entrenamiento (demo)', resource: 'mtl-demo v0.1-DEMO', category: 'ml' },
  { id: 'e07', at: '2026-11-21T16:45:00Z', actor: 'Sistema', action: 'Emitió certificado', resource: 'EM-2026-000420', category: 'academic' },
  { id: 'e08', at: '2026-11-20T11:00:00Z', actor: 'Usuario U-0001', action: 'Cambió configuración', resource: 'Parámetros · zona horaria', category: 'config' },
  { id: 'e09', at: '2026-11-19T12:00:00Z', actor: 'Usuario U-0014', action: 'Creó curso en borrador', resource: 'COM-140', category: 'academic' },
  { id: 'e10', at: '2026-11-18T09:20:00Z', actor: 'Usuario U-0001', action: 'Restableció credenciales', resource: 'Usuario U-0027', category: 'session' },
]

const COURSE_ANALYTICS_BASE: readonly CourseAnalytics[] = [
  { course: 'Matemática I', participationPct: 81, activeHours: 2140, submissions: 640, attempts: 905, progressPct: 58, completionPct: 61, masteryPct: 52 },
  { course: 'Programación', participationPct: 88, activeHours: 3720, submissions: 1180, attempts: 1630, progressPct: 66, completionPct: 70, masteryPct: 63 },
  { course: 'Estadística', participationPct: 74, activeHours: 1510, submissions: 410, attempts: 590, progressPct: 49, completionPct: 55, masteryPct: 47 },
  { course: 'Bases de datos', participationPct: 79, activeHours: 1260, submissions: 335, attempts: 470, progressPct: 53, completionPct: 58, masteryPct: 55 },
]

/** Las horas, entregas e intentos escalan con el periodo; los porcentajes se mantienen (datos DEMO). */
export function buildCourseAnalytics(periodFactor: number): CourseAnalytics[] {
  return COURSE_ANALYTICS_BASE.map((row) => ({
    ...row,
    activeHours: Math.round(row.activeHours * periodFactor),
    submissions: Math.round(row.submissions * periodFactor),
    attempts: Math.round(row.attempts * periodFactor),
  }))
}

export const INDICATOR_DEFINITIONS: readonly IndicatorDefinition[] = [
  { name: 'Participación', definition: '% de matriculados con al menos un evento válido en el periodo.', source: 'learning_events' },
  { name: 'Tiempo activo', definition: 'Suma de duraciones válidas y acotadas; una pestaña abierta no equivale a atención.', source: 'learning_events.duration_seconds' },
  { name: 'Entregas / intentos', definition: 'Entregas recibidas e intentos registrados de evaluaciones del curso.', source: 'assessment_attempts' },
  { name: 'Progreso', definition: 'Actividades completadas / actividades requeridas (completion_ratio).', source: 'learning_events + catálogo' },
  { name: 'Finalización', definition: '% de matriculados que cumplen los criterios oficiales de finalización.', source: 'enrollments' },
  { name: 'Dominio', definition: 'Nivel estimado por IA a partir de evidencias; no sustituye la validación docente.', source: 'skill_evidence (estimación)' },
]

export const DEMO_SKILL_TREE: readonly SkillNode[] = [
  { id: 'sk-mat', name: 'Matemática', children: [{ id: 'sk-alg', name: 'Álgebra' }, { id: 'sk-est', name: 'Estadística' }] },
  { id: 'sk-comp', name: 'Computación', children: [{ id: 'sk-prg', name: 'Programación' }, { id: 'sk-log', name: 'Lógica' }] },
  { id: 'sk-soft', name: 'Habilidades profesionales', children: [{ id: 'sk-com', name: 'Comunicación' }] },
]

export const DEMO_SKILL_EVIDENCE: readonly SkillEvidence[] = [
  { id: 'ev1', skill: 'Álgebra', source: 'Taller 4 (rúbrica)', observedAt: '2026-11-18T15:00:00Z', aiLevel: 'Intermedio', teacherLevel: 'Intermedio' },
  { id: 'ev2', skill: 'Programación', source: 'Examen parcial', observedAt: '2026-11-12T16:00:00Z', aiLevel: 'Avanzado', teacherLevel: 'Intermedio' },
  { id: 'ev3', skill: 'Estadística', source: 'Cuestionario de probabilidad', observedAt: '2026-11-20T13:30:00Z', aiLevel: 'Elemental', teacherLevel: null },
  { id: 'ev4', skill: 'Lógica', source: 'Definiciones clave', observedAt: '2026-11-20T13:45:00Z', aiLevel: 'Intermedio', teacherLevel: null },
  { id: 'ev5', skill: 'Comunicación', source: 'Informe técnico (rúbrica)', observedAt: '2026-11-05T17:10:00Z', aiLevel: 'Elemental', teacherLevel: 'Elemental' },
]

export interface TutorItem {
  id: string
  title: string
  competency: string
  priorActivity: string
  difficulty: 'Baja' | 'Media' | 'Alta'
  goal: string
  status: 'new' | 'accepted' | 'dismissed' | 'completed' | 'expired'
  useful: boolean
}

export const TUTOR_INITIAL: readonly TutorItem[] = [
  { id: 'tt1', title: 'Reforzar álgebra lineal', competency: 'Álgebra', priorActivity: 'Taller 4 (54%)', difficulty: 'Media', goal: 'Cerrar la brecha antes de Estadística', status: 'new', useful: false },
  { id: 'tt2', title: 'Repetir práctica de funciones', competency: 'Programación', priorActivity: '3 intentos sin completar', difficulty: 'Baja', goal: 'Completar el taller 5', status: 'new', useful: false },
  { id: 'tt3', title: 'Repasar definiciones de lógica', competency: 'Lógica', priorActivity: 'Definiciones clave', difficulty: 'Baja', goal: 'Mantener el nivel intermedio', status: 'expired', useful: false },
]

export const TUTOR_POOL: readonly Omit<TutorItem, 'status' | 'useful'>[] = [
  { id: 'tt4', title: 'Continuar ruta: Estadística', competency: 'Estadística', priorActivity: 'Cuestionario de probabilidad', difficulty: 'Media', goal: 'Objetivo de la ruta en 12 días' },
  { id: 'tt5', title: 'Practicar normalización de datos', competency: 'Programación', priorActivity: 'Informe de diseño de datos', difficulty: 'Alta', goal: 'Entrega del informe de diseño' },
  { id: 'tt6', title: 'Redactar resumen técnico', competency: 'Comunicación', priorActivity: 'Informe técnico (rúbrica)', difficulty: 'Media', goal: 'Subir a nivel intermedio' },
]
