import type { Certificate, PublicVerification } from './types'

/** Verificación pública mínima; en producción: GET /api/v1/certificates/verify/{code}. */
export function verifyCertificate(code: string, certificates: readonly Certificate[]): PublicVerification {
  const normalized = code.trim().toUpperCase()
  const cert = certificates.find((c) => c.code === normalized && c.status !== 'draft')
  if (!cert) return { result: 'not-found' }
  const base = { folio: cert.folio, course: cert.course, issuedAt: cert.issuedAt ?? undefined }
  if (cert.status === 'revoked') return { result: 'revoked', ...base }
  if (cert.status === 'expired') return { result: 'expired', ...base }
  return { result: 'valid', ...base }
}
