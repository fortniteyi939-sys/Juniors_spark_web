export type NetworkMode = 'inference' | 'training' | 'idle'

export interface NetworkLayer {
  name: string
  neurons: number
  /** Clave de color del tema: pr (cian/teal), vi (violeta, bloque temporal), gr (salidas). */
  color: 'pr' | 'vi' | 'gr'
  detail: string
}
