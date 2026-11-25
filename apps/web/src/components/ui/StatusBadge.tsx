export type BadgeTone = 'ok' | 'warn' | 'off' | 'ai' | 'muted'

export function StatusBadge({ tone = 'muted', children }: { tone?: BadgeTone; children: string }) {
  return <span className={tone === 'muted' ? 'badge' : `badge ${tone}`}>{children}</span>
}
