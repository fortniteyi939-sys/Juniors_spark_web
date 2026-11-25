import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  children?: ReactNode
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty" role="status">
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  )
}
