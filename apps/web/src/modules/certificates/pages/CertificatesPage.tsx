import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/app/layouts/PageHeader'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { AsyncView } from '@/components/feedback/AsyncView'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { ModuleIcon } from '@/components/ui/icons'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/lib/format'
import { listCertificates } from '@/services/moduleService'
import { CERTIFICATE_STATUS_LABELS, type Certificate, type CertificateStatus, type PublicVerification } from '../types'
import { verifyCertificate } from '../verify'

const TONES: Record<CertificateStatus, BadgeTone> = { issued: 'ok', draft: 'muted', revoked: 'off', expired: 'warn' }

const COLUMNS: readonly Column<Certificate>[] = [
  { key: 'folio', header: 'Folio', render: (c) => <b>{c.folio}</b> },
  { key: 'holder', header: 'Titular (seudónimo)', render: (c) => c.holder },
  { key: 'course', header: 'Curso', render: (c) => c.course },
  { key: 'status', header: 'Estado', render: (c) => <StatusBadge tone={TONES[c.status]}>{CERTIFICATE_STATUS_LABELS[c.status]}</StatusBadge> },
  { key: 'issued', header: 'Emisión', render: (c) => (c.issuedAt ? formatDate(c.issuedAt) : '—') },
  { key: 'template', header: 'Plantilla', render: (c) => c.template },
]

const RESULT_TEXT: Record<PublicVerification['result'], { tone: BadgeTone; label: string }> = {
  valid: { tone: 'ok', label: 'Certificado válido' },
  revoked: { tone: 'off', label: 'Certificado anulado' },
  expired: { tone: 'warn', label: 'Certificado expirado' },
  'not-found': { tone: 'muted', label: 'Código no encontrado' },
}

export function CertificatesPage() {
  const data = useAsyncData(listCertificates, [])
  const [status, setStatus] = useState<'all' | CertificateStatus>('all')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<PublicVerification | null>(null)

  return (
    <>
      <PageHeader
        icon={<ModuleIcon />}
        eyebrow="Certificación"
        title="Certificados"
        description="Folio único, PDF y código de verificación; estados borrador, emitido, anulado y expirado."
        actions={
          <select aria-label="Estado del certificado" value={status} onChange={(e) => setStatus(e.target.value as 'all' | CertificateStatus)}>
            <option value="all">Todos los estados</option>
            {(Object.keys(CERTIFICATE_STATUS_LABELS) as CertificateStatus[]).map((s) => (
              <option key={s} value={s}>
                {CERTIFICATE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        }
      />
      <AsyncView state={data} onRetry={data.reload}>
        {(certs) => {
          const onVerify = (event: FormEvent) => {
            event.preventDefault()
            setResult(verifyCertificate(code, certs))
          }
          const text = result ? RESULT_TEXT[result.result] : null
          return (
            <div className="gd">
              <section className="card c8">
                <h2>Certificados emitidos</h2>
                <p className="sub">Se emiten al cumplir los criterios oficiales; no se duplica un certificado vigente para el mismo logro.</p>
                <DataTable
                  caption="Certificados"
                  columns={COLUMNS}
                  rows={certs.filter((c) => status === 'all' || c.status === status)}
                  rowKey={(c) => c.folio}
                  emptyTitle="Sin certificados en este estado"
                />
              </section>
              <section className="card c4">
                <h2>Verificación pública</h2>
                <p className="sub">Un tercero consulta el código y solo ve datos mínimos. Prueba con EM-7K2Q-9F4D.</p>
                <form onSubmit={onVerify} className="fb">
                  <input type="text" aria-label="Código de verificación" placeholder="EM-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
                  <button type="submit" className="btn" disabled={code.trim() === ''}>
                    Verificar
                  </button>
                </form>
                {result && text ? (
                  <div className="empty" role="status">
                    <StatusBadge tone={text.tone}>{text.label}</StatusBadge>
                    {result.folio ? (
                      <p>
                        Folio {result.folio} · {result.course}
                        {result.issuedAt ? ` · emitido ${formatDate(result.issuedAt)}` : ''}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </div>
          )
        }}
      </AsyncView>
    </>
  )
}
