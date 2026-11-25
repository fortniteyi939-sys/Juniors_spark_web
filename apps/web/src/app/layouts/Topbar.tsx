import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import type { Theme } from '@/hooks/useTheme'

interface TopbarProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

const THEMES: readonly { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

export function Topbar({ theme, onThemeChange }: TopbarProps) {
  const online = useOnlineStatus()
  return (
    <div className="top">
      <span className="pill">Datos DEMO</span>
      <span
        className={online ? 'pill conn' : 'pill off'}
        title="Estado de red del navegador. El demo aún no tiene un backend conectado."
      >
        {online ? '● Conectado' : '○ Sin conexión'}
      </span>
      <span className="sp" />
      <div className="seg" role="group" aria-label="Tema">
        {THEMES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={theme === option.value ? 'on' : undefined}
            aria-pressed={theme === option.value}
            onClick={() => onThemeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
