interface CompletionDonutProps {
  /** Porcentaje completado (0-100). */
  completedPct: number
  /** Porcentaje en curso (0-100); el resto se considera sin iniciar. */
  inProgressPct?: number
}

export function CompletionDonut({ completedPct, inProgressPct = 20 }: CompletionDonutProps) {
  const done = Math.min(100, Math.max(0, completedPct))
  const doing = Math.min(100 - done, Math.max(0, inProgressPct))
  const idle = 100 - done - doing
  const background = `conic-gradient(var(--ac) 0 ${done}%, var(--vi) ${done}% ${done + doing}%, var(--l2) ${done + doing}% 100%)`

  return (
    <>
      <div
        className="dn2"
        style={{ background }}
        role="img"
        aria-label={`Finalización: ${done}% completado, ${doing}% en curso, ${idle}% sin iniciar`}
      >
        <span>{done}%</span>
      </div>
      <div className="lg">
        <i style={{ background: 'var(--ac)' }} />
        Completado {done}%
        <i style={{ background: 'var(--vi)' }} />
        En curso {doing}%
        <i style={{ background: 'var(--l2)', border: '1px solid var(--bd)' }} />
        Sin iniciar {idle}%
      </div>
    </>
  )
}
