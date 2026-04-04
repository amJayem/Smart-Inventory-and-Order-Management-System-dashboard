import { Moon, Sun, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { theme, toggle } = useThemeStore()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-end px-4 gap-2 shrink-0">
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8"
      >
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </Button>
    </header>
  )
}
