import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, ShoppingCart,
  AlertTriangle, Activity, Users, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/restock', icon: AlertTriangle, label: 'Restock Queue' },
  { to: '/activity', icon: Activity, label: 'Activity Log' },
]

const adminItems = [
  { to: '/users', icon: Users, label: 'Users' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col h-screen">

      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M1 7h8M1 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-background" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-foreground">InventoryOS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Main
        </p>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors group',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
