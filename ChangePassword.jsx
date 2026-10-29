import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { applyServerErrors } from '@/lib/errors'
import { passwordMeetsRules } from '@/lib/password'
import PasswordChecklist from '@/components/PasswordChecklist'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'

const schema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().refine(passwordMeetsRules, 'New password does not meet the rules'),
    confirm: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.new_password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export default function ChangePassword() {
  const { refreshMe } = useAuth()
  const navigate = useNavigate()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm: '' },
    mode: 'onChange',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.post('/auth/change-password', {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      toast.success('Password updated')
      await refreshMe()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (!applyServerErrors(form.setError, err)) {
        toast.error(err.response?.data?.message || 'Could not change password.')
      }
    }
  })

  return (
    <div className="mx-auto max-w-lg p-6">
      <PageHeader title="Change password" description="You must set a new password before using StudyMate." />
      <form onSubmit={onSubmit} className="card space-y-4 p-5" noValidate>
        <div>
          <label className="label" htmlFor="current_password">
            Current password
          </label>
          <input id="current_password" type="password" className="input" {...form.register('current_password')} />
          {form.formState.errors.current_password ? (
            <p className="error-text">{form.formState.errors.current_password.message}</p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="new_password">
            New password
          </label>
          <input id="new_password" type="password" className="input" {...form.register('new_password')} />
          <PasswordChecklist value={form.watch('new_password')} />
          {form.formState.errors.new_password ? <p className="error-text">{form.formState.errors.new_password.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm new password
          </label>
          <input id="confirm" type="password" className="input" {...form.register('confirm')} />
          {form.formState.errors.confirm ? <p className="error-text">{form.formState.errors.confirm.message}</p> : null}
        </div>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  )
}
