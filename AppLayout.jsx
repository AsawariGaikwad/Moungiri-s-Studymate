import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, GraduationCap, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { NAV } from '@/layouts/nav'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const roleTone = {
  STUDENT: 'brand',
  FACULTY: 'amber',
  ADMIN: 'blue',
}

export default function AppLayout() {
  const { user, logout, theme, applyTheme } = useAuth()
  const unread = useUnreadCount()
  const count = unread.data?.data?.count ?? 0
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const location = useLocation()
  const items = NAV[user?.role] || []

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-brand-900">
          <GraduationCap className="h-6 w-6" />
        </div>
        {!collapsed ? (
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-white">STUDYMATE</p>
            <p className="text-[11px] text-brand-200">OF MOUNGIRI</p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-100 hover:bg-white/10',
                  isActive && 'bg-white/15 text-white',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? item.label : null}
            </NavLink>
          )
        })}
      </nav>
      <button
        type="button"
        className="hidden border-t border-white/10 px-3 py-3 text-left text-xs text-brand-200 hover:bg-white/5 lg:block"
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? '»' : 'Collapse sidebar'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative z-10 h-full w-72 bg-brand-900">{sidebar}</aside>
        </div>
      ) : null}
      <aside className={cn('fixed inset-y-0 left-0 hidden bg-brand-900 lg:block', collapsed ? 'w-[72px]' : 'w-64')}>
        {sidebar}
      </aside>
      <div className={cn('min-h-screen', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <p className="hidden text-sm text-slate-500 sm:block">Moungiri Coaching Classes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="px-2"
              onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-accent-500 px-1 text-center text-[10px] font-bold text-brand-900">
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 dark:border-slate-700">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                  {initials(user?.full_name)}
                </div>
              )}
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <Badge tone={roleTone[user?.role] || 'slate'}>{user?.role}</Badge>
              </div>
            </div>
            <Button variant="ghost" className="px-2" onClick={() => setConfirmOut(true)} aria-label="Log out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ConfirmDialog
        open={confirmOut}
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmLabel="Log out"
        onClose={() => setConfirmOut(false)}
        onConfirm={() => logout()}
      />
    </div>
  )
}
