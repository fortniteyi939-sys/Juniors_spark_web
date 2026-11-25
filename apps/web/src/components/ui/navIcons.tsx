import type { ReactNode } from 'react'
import type { NavId } from '@/app/navigation'

const base = {
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
} as const

const PATHS: Record<NavId, ReactNode> = {
  // Resumen: cuadrícula de paneles
  resumen: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </>
  ),
  // Rutas de aprendizaje: camino con paradas
  rutas: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" />
    </>
  ),
  // Cursos: libro abierto
  cursos: (
    <>
      <path d="M12 6.5C10.5 5 8 4.5 3 4.5v14c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-14c-5 0-7.5.5-9 2z" />
      <path d="M12 6.5v14" />
    </>
  ),
  // Evaluaciones: lista de verificación
  evals: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8l1.5 1.5L13 7M9 14l1.5 1.5L13 13M15 8.5h1M15 14.5h1" />
    </>
  ),
  // Certificados: sello con cinta
  certs: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5-1.5-7.5" />
    </>
  ),
  // Analítica: barras
  analitica: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  // IA Tutor: asistente / destello
  tutor: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ),
  // Dominio de habilidades: diana
  skills: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  // Red neuronal: nodos conectados
  red: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="19" cy="16" r="2" />
      <path d="M7 6l3.5 5M7 18l3.5-5M14 11l3.5-2M14 13l3.5 2" />
    </>
  ),
  // Comunidad: personas
  comunidad: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3c2 .7 3.5 2.6 3.5 5.7" />
    </>
  ),
  // Administración: engranaje
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </>
  ),
  // Auditoría: escudo con verificación
  auditoria: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
}

export function NavIcon({ id }: { id: NavId }) {
  return <svg {...base}>{PATHS[id]}</svg>
}
