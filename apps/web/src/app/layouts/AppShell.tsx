import type { ReactNode } from 'react'
import type { Theme } from '@/hooks/useTheme'
import type { NavId } from '../navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  active: NavId
  onNavigate: (id: NavId) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  children: ReactNode
}

export function AppShell({ active, onNavigate, theme, onThemeChange, children }: AppShellProps) {
  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <Sidebar active={active} onNavigate={onNavigate} />
      <main id="contenido">
        <Topbar theme={theme} onThemeChange={onThemeChange} />
        {children}
      </main>
    </>
  )
}
