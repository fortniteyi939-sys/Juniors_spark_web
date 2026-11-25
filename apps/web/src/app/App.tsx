import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { AdministrationPage } from '@/modules/administration/pages/AdministrationPage'
import { AiTutorPage } from '@/modules/ai-tutor/pages/AiTutorPage'
import { AnalyticsPage } from '@/modules/analytics/pages/AnalyticsPage'
import { AssessmentsPage } from '@/modules/assessments/pages/AssessmentsPage'
import { AuditPage } from '@/modules/audit/pages/AuditPage'
import { CertificatesPage } from '@/modules/certificates/pages/CertificatesPage'
import { CommunityPage } from '@/modules/community/pages/CommunityPage'
import { CoursesPage } from '@/modules/courses/pages/CoursesPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { DEFAULT_FILTERS, type DashboardFilters } from '@/modules/dashboard/types'
import { LearningPathsPage } from '@/modules/learning-paths/pages/LearningPathsPage'
import { NeuralNetworkPage } from '@/modules/neural-visualizer/pages/NeuralNetworkPage'
import { SkillsPage } from '@/modules/skill-mastery/pages/SkillsPage'
import { AppShell } from './layouts/AppShell'
import { findNavItem, type NavId } from './navigation'

export function App() {
  const { theme, setTheme } = useTheme()
  const [active, setActive] = useState<NavId>('resumen')
  // Los filtros viven aquí para que no se pierdan al cambiar de módulo.
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    document.title = `${findNavItem(active)?.label ?? 'Centro de control'} | EduMaster.ai (DEMO)`
    window.scrollTo(0, 0)
  }, [active])

  const pages: Record<NavId, ReactNode> = {
    resumen: <DashboardPage filters={filters} onFiltersChange={setFilters} />,
    rutas: <LearningPathsPage />,
    cursos: <CoursesPage />,
    evals: <AssessmentsPage />,
    certs: <CertificatesPage />,
    analitica: <AnalyticsPage />,
    tutor: <AiTutorPage />,
    skills: <SkillsPage />,
    red: <NeuralNetworkPage />,
    comunidad: <CommunityPage />,
    admin: <AdministrationPage />,
    auditoria: <AuditPage />,
  }

  return (
    <AppShell active={active} onNavigate={setActive} theme={theme} onThemeChange={setTheme}>
      {pages[active]}
    </AppShell>
  )
}
