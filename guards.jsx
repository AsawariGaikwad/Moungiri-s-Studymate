import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Skeleton from '@/components/ui/Skeleton'

function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm space-y-3 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function PublicOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (user?.must_change_password) return <Navigate to="/change-password" replace />
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <BootScreen />
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequirePasswordOk() {
  const { user } = useAuth()
  if (user?.must_change_password) return <Navigate to="/change-password" replace />
  return <Outlet />
}

export function RoleRoute({ roles }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
