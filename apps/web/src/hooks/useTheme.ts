import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Tema claro/oscuro; arranca según prefers-color-scheme y se aplica en <html data-theme>. */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return { theme, setTheme }
}
