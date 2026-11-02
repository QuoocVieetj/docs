import Button from '../../shared/components/Button.jsx'
import { CloseIcon } from '../../shared/components/Icons.jsx'
import { NavLink } from 'react-router'
import { useAuth } from '../../features/auth/context/useAuth.js'
import { routes, canAccess } from '../../app/router/access.js'

export default function Sidebar({
  mobile = false,
  onClose,
  collapsed = false,
}) {
  const { user } = useAuth()

  function handleNavigation() {
    if (mobile) onClose()
  }

  return (
    <aside
      id={mobile ? 'mobile-sidebar' : 'desktop-sidebar'}
      className={`sidebar ${mobile ? 'sidebar--mobile' : 'sidebar--desktop'}`}
      inert={collapsed}
      aria-hidden={collapsed || undefined}
      aria-label="Sidebar"
    >
      <div className="flex min-h-16 items-center justify-between gap-4 px-5">
        <span className="brand" translate="no">
          App
        </span>
        {mobile ? (
          <Button variant="icon" aria-label="Close sidebar" onClick={onClose}>
            <CloseIcon />
          </Button>
        ) : null}
      </div>
      {user ? (
        <nav aria-label="Navigation" className="flex flex-col gap-1 px-3 py-4">
          {routes
            .filter((route) => canAccess(user, route.roles))
            .map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={handleNavigation}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                {route.label}
              </NavLink>
            ))}
        </nav>
      ) : null}
    </aside>
  )
}
