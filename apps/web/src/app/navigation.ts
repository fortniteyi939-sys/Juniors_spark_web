export type NavId =
  | 'resumen'
  | 'rutas'
  | 'cursos'
  | 'evals'
  | 'certs'
  | 'analitica'
  | 'tutor'
  | 'skills'
  | 'red'
  | 'comunidad'
  | 'admin'
  | 'auditoria'

export interface NavItem {
  id: NavId
  label: string
}

export interface NavSection {
  label: string
  items: readonly NavItem[]
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Principal',
    items: [
      { id: 'resumen', label: 'Resumen' },
      { id: 'rutas', label: 'Rutas de aprendizaje' },
      { id: 'cursos', label: 'Cursos' },
      { id: 'evals', label: 'Evaluaciones' },
      { id: 'certs', label: 'Certificados' },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { id: 'analitica', label: 'Analítica' },
      { id: 'tutor', label: 'IA Tutor' },
      { id: 'skills', label: 'Dominio de habilidades' },
      { id: 'red', label: 'Red neuronal' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'comunidad', label: 'Comunidad' },
      { id: 'admin', label: 'Administración' },
      { id: 'auditoria', label: 'Auditoría' },
    ],
  },
]

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)

export function findNavItem(id: NavId): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id)
}
