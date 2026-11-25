/** Dominio estimado por IA; no equivale al nivel certificado por el docente (spec 4.9). */
export interface SkillMastery {
  skills: string[]
  levels: string[]
  /** Porcentaje por habilidad (fila) y nivel (columna). */
  matrix: number[][]
}


export interface SkillNode {
  id: string
  name: string
  children?: SkillNode[]
}

export interface SkillEvidence {
  id: string
  skill: string
  source: string
  observedAt: string
  /** Nivel estimado por el modelo (no certificado). */
  aiLevel: string
  /** Nivel validado por docente; null si aún no se validó. */
  teacherLevel: string | null
}
