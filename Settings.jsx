import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { passwordMeetsRules } from '@/lib/password'
import { formatDate } from '@/lib/datetime'
import PasswordChecklist from '@/components/PasswordChecklist'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
]

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  dob: z.string().optional().or(z.literal('')),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().refine(passwordMeetsRules, 'New password does not meet the rules'),
    confirm: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.new_password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export default function Settings() {
  const { user, setUser, theme, applyTheme, logout, refreshMe } = useAuth()
  const [tab, setTab] = useState('profile')
  const [logoutAll, setLogoutAll] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  const profile = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dob: user?.dob || '',
    },
  })

  const security = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm: '' },
    mode: 'onChange',
  })

  const prefs = user?.notification_prefs || {}

  const saveProfile = profile.handleSubmit(async (values) => {
    try {
      const res = await api.patch('/profile', values)
      setUser(res.data.data)
      toast.success('Profile updated')
    } catch (err) {
      if (!applyServerErrors(profile.setError, err)) toast.error(getErrorMessage(err))
    }
  })

  const savePassword = security.handleSubmit(async (values) => {
    try {
      await api.post('/auth/change-password', {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      toast.success('Password updated')
      security.reset()
    } catch (err) {
      if (!applyServerErrors(security.setError, err)) toast.error(getErrorMessage(err))
    }
  })

  const savePrefs = async (patch) => {
    try {
      const res = await api.patch('/profile/preferences', patch)
      setUser(res.data.data)
      if (patch.theme) applyTheme(patch.theme)
      toast.success('Preferences saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onPhoto = async (file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be 2 MB or smaller.')
      return
    }
    const fd = new FormData()
    fd.append('photo', file)
    setPhotoBusy(true)
    try {
      const res = await api.post('/profile/photo', fd)
      setUser(res.data.data)
      toast.success('Photo updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoBusy(true)
    try {
      const res = await api.delete('/profile/photo')
      setUser(res.data.data || { ...user, photo_url: null })
      await refreshMe()
      toast.success('Photo removed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, security and preferences." />
      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium',
              tab === item.id ? 'bg-brand-700 text-white' : 'bg-white dark:bg-slate-900',
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <form onSubmit={saveProfile} className="card grid gap-4 p-5 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2 flex items-center gap-4">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-800">Photo</div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-700 px-3 py-2 text-sm text-white">
                {photoBusy ? 'Uploading…' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
              </label>
              <Button type="button" variant="outline" onClick={removePhoto} loading={photoBusy}>
                Remove
              </Button>
            </div>
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" value={user?.username || ''} readOnly />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input" value={user?.role || ''} readOnly />
          </div>
          <div>
            <label className="label" htmlFor="full_name">
              Full name
            </label>
            <input id="full_name" className="input" {...profile.register('full_name')} />
            {profile.formState.errors.full_name ? <p className="error-text">{profile.formState.errors.full_name.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" className="input" type="email" {...profile.register('email')} />
            {profile.formState.errors.email ? <p className="error-text">{profile.formState.errors.email.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" className="input" {...profile.register('phone')} />
          </div>
          <div>
            <label className="label" htmlFor="dob">
              Date of birth
            </label>
            <input id="dob" type="date" className="input" {...profile.register('dob')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">
              Address
            </label>
            <textarea id="address" className="input min-h-[80px]" {...profile.register('address')} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={profile.formState.isSubmitting}>
              Save profile
            </Button>
          </div>
        </form>
      ) : null}

      {tab === 'security' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={savePassword} className="card space-y-4 p-5" noValidate>
            <h2 className="font-semibold">Change password</h2>
            <div>
              <label className="label" htmlFor="current_password">
                Current password
              </label>
              <input id="current_password" type="password" className="input" {...security.register('current_password')} />
              {security.formState.errors.current_password ? (
                <p className="error-text">{security.formState.errors.current_password.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="new_password">
                New password
              </label>
              <input id="new_password" type="password" className="input" {...security.register('new_password')} />
              <PasswordChecklist value={security.watch('new_password')} />
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Confirm new password
              </label>
              <input id="confirm" type="password" className="input" {...security.register('confirm')} />
              {security.formState.errors.confirm ? <p className="error-text">{security.formState.errors.confirm.message}</p> : null}
            </div>
            <Button type="submit" loading={security.formState.isSubmitting}>
              Update password
            </Button>
          </form>
          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">Account</h2>
            <p className="text-sm text-slate-500">Last login: {formatDate(user?.last_login, { withTime: true })}</p>
            <p className="text-sm">
              Status: <Badge tone={user?.is_active ? 'green' : 'red'}>{user?.is_active ? 'Active' : 'Inactive'}</Badge>
            </p>
            <Button variant="danger" onClick={() => setLogoutAll(true)}>
              Log out from all devices
            </Button>
          </div>
        </div>
      ) : null}

      {tab === 'preferences' ? (
        <div className="card space-y-5 p-5">
          <div>
            <p className="label">Theme</p>
            <div className="flex gap-2">
              {['light', 'dark'].map((item) => (
                <Button key={item} variant={theme === item ? 'primary' : 'outline'} onClick={() => savePrefs({ theme: item })}>
                  {item === 'light' ? 'Light' : 'Dark'}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Language</p>
            <select
              className="input max-w-xs"
              value={user?.language || 'en'}
              onChange={(e) => savePrefs({ language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <div>
            <p className="label">Notifications</p>
            <div className="space-y-2">
              {[
                ['announcements', 'Announcements'],
                ['tests', 'Tests'],
                ['fees', 'Fees'],
                ['attendance', 'Attendance'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[key])}
                    onChange={(e) =>
                      savePrefs({
                        notification_prefs: { ...prefs, [key]: e.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={logoutAll}
        title="Log out from all devices?"
        message="Every signed-in session will be ended, including this one."
        confirmLabel="Log out everywhere"
        danger
        onClose={() => setLogoutAll(false)}
        onConfirm={() => logout({ all: true })}
      />
    </div>
  )
}
