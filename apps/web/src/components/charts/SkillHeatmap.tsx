import { Fragment } from 'react'
import type { SkillMastery } from '@/modules/skill-mastery/types'

export function SkillHeatmap({ skills, levels, matrix }: SkillMastery) {
  return (
    <div className="hw">
      <div className="heat" role="table" aria-label="Mapa de calor de dominio de habilidades por nivel">
        <div style={{ display: 'contents' }} role="row">
          <span role="columnheader" />
          {levels.map((level) => (
            <span key={level} role="columnheader">
              {level}
            </span>
          ))}
        </div>
        {skills.map((skill, row) => (
          <div key={skill} style={{ display: 'contents' }} role="row">
            <span role="rowheader">{skill}</span>
            {levels.map((level, col) => {
              const pct = matrix[row]?.[col] ?? 0
              return (
                <Fragment key={level}>
                  <em
                    role="cell"
                    title={`${skill} · ${level}: ${pct}%`}
                    style={{
                      background: `color-mix(in srgb, var(--ac) ${Math.min(100, Math.round(10 + pct * 1.3))}%, var(--l2))`,
                      // Texto oscuro sobre celdas de turquesa intenso para mantener el contraste.
                      color: pct >= 30 ? 'var(--piano)' : undefined,
                    }}
                  >
                    {pct}%
                  </em>
                </Fragment>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
