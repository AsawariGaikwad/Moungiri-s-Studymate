import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const schema = z.object({
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [forgot, setForgot] = useState(false)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT', username: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await login(values)
      if (user?.must_change_password) navigate('/change-password', { replace: true })
      else navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Invalid username or password.')
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 text-brand-900">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold">STUDYMATE OF MOUNGIRI</p>
            <p className="text-sm text-brand-100">Moungiri Coaching Classes – Your Smart Study Partner</p>
          </div>
        </div>
        <svg viewBox="0 0 480 320" className="mx-auto w-full max-w-lg text-brand-100" aria-hidden="true">
          <rect x="40" y="70" width="400" height="200" rx="24" fill="#123A7A" />
          <circle cx="140" cy="160" r="36" fill="#F59E0B" />
          <rect x="200" y="130" width="180" height="14" rx="7" fill="#8EB4FF" />
          <rect x="200" y="156" width="140" height="14" rx="7" fill="#3D7DFF" />
          <rect x="200" y="182" width="160" height="14" rx="7" fill="#8EB4FF" />
          <path d="M80 270h320" stroke="#F59E0B" strokeWidth="6" />
        </svg>
        <p className="text-sm text-brand-200">For 11th &amp; 12th students preparing for JEE, NEET, MHT-CET and CUET.</p>
      </section>
      <section className="flex items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500 text-brand-900">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-semibold text-brand-900 dark:text-white">STUDYMATE OF MOUNGIRI</p>
              <p className="text-xs text-slate-500">Moungiri Coaching Classes – Your Smart Study Partner</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-brand-900 dark:text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use the credentials provided by your administrator.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <p className="label">Role</p>
              <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Role">
                {ROLES.map((role) => {
                  const active = form.watch('role') === role.value
                  return (
                    <button
                      key={role.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-sm font-medium',
                        active
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900',
                      )}
                      onClick={() => form.setValue('role', role.value)}
                    >
                      {role.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input id="username" className="input" autoComplete="username" aria-invalid={Boolean(form.formState.errors.username) || undefined} {...form.register('username')} />
              {form.formState.errors.username ? <p className="error-text">{form.formState.errors.username.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-10"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={Boolean(form.formState.errors.password) || undefined}
                  {...form.register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-slate-500"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password ? <p className="error-text">{form.formState.errors.password.message}</p> : null}
            </div>
            <button type="button" className="text-sm text-brand-700 hover:underline dark:text-brand-300" onClick={() => setForgot((v) => !v)}>
              Forgot password?
            </button>
            {forgot ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                Contact your administrator to reset your password.
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              Sign In
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
