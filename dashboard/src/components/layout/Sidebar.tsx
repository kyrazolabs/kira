import { NavLink, useLocation } from 'react-router-dom'
import { LogoWordmark } from '../ui/Logo'

const links = [
  { to: '/', label: 'Dashboard', icon: '◇' },
  { to: '/personas', label: 'Personas', icon: '◎' },
  { to: '/usage', label: 'Usage', icon: '◉' },
  { to: '/billing', label: 'Billing', icon: '◈' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-56 border-r border-hairline bg-canvas hidden md:flex flex-col flex-shrink-0">
      <div className="h-14 flex items-center px-lg border-b border-hairline">
        <LogoWordmark className="text-on-dark text-body-strong" />
      </div>
      <nav className="flex-1 p-sm">
        {links.map(link => {
          const active = location.pathname === link.to
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`
                flex items-center gap-sm px-md py-sm rounded-sm text-body-sm mb-xxs transition-colors
                ${active
                  ? 'bg-surface-card text-on-dark'
                  : 'text-body hover:text-on-dark hover:bg-surface'
                }
              `}
            >
              <span className="text-sm">{link.icon}</span>
              {link.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-md border-t border-hairline">
        <span className="text-caption-sm text-mute">Kira v1.0</span>
      </div>
    </aside>
  )
}
