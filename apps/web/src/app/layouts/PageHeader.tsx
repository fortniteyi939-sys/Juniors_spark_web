import type { ReactNode } from 'react'

interface PageHeaderProps {
  id?: string
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ id, icon, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="ph" id={id}>
      <div className="pi">{icon}</div>
      <div>
        <div className="eb">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="ac">{actions}</div> : null}
    </div>
  )
}
