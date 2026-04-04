import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, toggle } = useThemeStore()
  const [demoLoading, setDemoLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.user, res.data.token)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    try {
      const res = await api.post('/auth/demo-login')
      setAuth(res.data.user, res.data.token)
      navigate('/')
    } catch {
      toast.error('Demo login failed')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">

      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-background" />
              </svg>
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight">InventoryOS</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Access your inventory dashboard</p>
        </div>

        {/* Demo Button */}
        <button
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className="w-full flex items-center justify-center gap-2 h-10 px-4 mb-6 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
        >
          {demoLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue with Demo Account
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="h-10 text-sm"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 text-sm"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-10 text-sm font-medium">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Demo — <span className="text-foreground">demo@admin.com</span> / <span className="text-foreground">demo1234</span>
        </p>
      </div>
    </div>
  )
}
