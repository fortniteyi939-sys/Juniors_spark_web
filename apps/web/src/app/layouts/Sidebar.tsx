import { Fragment } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { NavIcon } from '@/components/ui/navIcons'
import { NAV_SECTIONS, type NavId } from '../navigation'

interface SidebarProps {
  active: NavId
  onNavigate: (id: NavId) => void
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside aria-label="Navegación principal">
      <div className="brand">
        <div className="brand-text">
          <BrandLogo />
          <small>CENTRO DE CONTROL</small>
        </div>
      </div>
      <div className="ws">
        <i>E</i>
        <span>
          <strong>Institución DEMO</strong>
          <small>Datos sintéticos</small>
        </span>
        <b />
      </div>
      <nav>
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.label}>
            <span className="lb">{section.label}</span>
            {section.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={active === item.id ? 'on' : undefined}
                aria-current={active === item.id ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(item.id)
                }}
              >
                <span className="ni">
                  <NavIcon id={item.id} />
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </Fragment>
        ))}
      </nav>
    </aside>
  )
}
