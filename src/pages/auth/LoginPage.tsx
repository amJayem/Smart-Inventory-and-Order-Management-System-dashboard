import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, toggle } = useThemeStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [demoLoading, setDemoLoading] = useState(false)
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)
  const [showRegConfirmPw, setShowRegConfirmPw] = useState(false)

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    loginForm.reset()
    registerForm.reset()
  }

  const onLogin = async (data: LoginData) => {
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.user, res.data.token)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  const onRegister = async (data: RegisterData) => {
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      })
      setAuth(res.data.user, res.data.token)
      toast.success('Account created successfully')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
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
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login' ? 'Access your inventory dashboard' : 'Set up your InventoryOS account'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg border border-border p-1 mb-6 bg-muted/30">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
              mode === 'login'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 h-8 text-sm font-medium rounded-md transition-all ${
              mode === 'register'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <>
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
              <span className="text-xs text-muted-foreground">or sign in with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="h-10 text-sm"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-10 text-sm pr-10"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full h-10 text-sm font-medium">
                {loginForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              Demo — <span className="text-foreground">demo@admin.com</span> / <span className="text-foreground">demo1234</span>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  className="h-10 text-sm"
                  {...registerForm.register('name')}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="h-10 text-sm"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showRegPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-10 text-sm pr-10"
                    {...registerForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showRegConfirmPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-10 text-sm pr-10"
                    {...registerForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRegConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={registerForm.formState.isSubmitting} className="w-full h-10 text-sm font-medium">
                {registerForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              New accounts are created with <span className="text-foreground">Manager</span> role by default.
              An Admin can upgrade your role.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
