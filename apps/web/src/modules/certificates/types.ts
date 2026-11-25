export type CertificateStatus = 'draft' | 'issued' | 'revoked' | 'expired'

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitido',
  revoked: 'Anulado',
  expired: 'Expirado',
}


export interface Certificate {
  folio: string
  /** Código público de verificación (el QR codificaría este valor). */
  code: string
  /** Seudónimo del titular: el listado no expone nombres reales en el demo. */
  holder: string
  course: string
  status: CertificateStatus
  issuedAt: string | null
  template: string
}

/** Datos mínimos que expone la verificación pública (spec 4.7). */
export interface PublicVerification {
  result: 'valid' | 'revoked' | 'expired' | 'not-found'
  folio?: string
  course?: string
  issuedAt?: string
}
