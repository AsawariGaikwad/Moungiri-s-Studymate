import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setAuthFailureHandler } from '@/api/client'
import { getErrorCode } from '@/lib/errors'

const AuthContext = createContext(null)
const THEME_KEY = 'studymate-theme'
const INACTIVITY_MS = 30 * 60 * 1000

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light'
  } catch {
    return 'light'
  }
}

function writeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore quota / private mode */
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [theme, setThemeState] = useState(readStoredTheme)
  const navigate = useNavigate()
  const idleRef = useRef(null)

  const applyTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light'
    setThemeState(value)
    writeTheme(value)
  }, [])

  const logout = useCallback(
    async ({ all = false, silent = false } = {}) => {
      try {
        if (!silent) await api.post(all ? '/auth/logout-all' : '/auth/logout')
      } catch {
        /* still clear local session */
      }
      setUser(null)
      navigate('/', { replace: true })
    },
    [navigate],
  )

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const next = res.data.data
      setUser(next)
      if (next?.theme) applyTheme(next.theme)
      return next
    } catch (err) {
      if (err.response?.status === 403 && getErrorCode(err) === 'password_change_required') {
        const next = err.response?.data?.data
        if (next?.id) {
          setUser({ ...next, must_change_password: true })
          return next
        }
        setUser((prev) => (prev ? { ...prev, must_change_password: true } : prev))
      } else if (err.response?.status !== 401) {
        setUser(null)
      }
      return null
    }
  }, [applyTheme])

  useEffect(() => {
    writeTheme(theme)
    setAuthFailureHandler(() => setUser(null))
    refreshMe().finally(() => setReady(true))
    return () => setAuthFailureHandler(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const bumpIdle = useCallback(() => {
    if (!user) return
    if (idleRef.current) window.clearTimeout(idleRef.current)
    idleRef.current = window.setTimeout(() => {
      logout({ silent: false })
    }, INACTIVITY_MS)
  }, [user, logout])

  useEffect(() => {
    if (!user) {
      if (idleRef.current) window.clearTimeout(idleRef.current)
      return undefined
    }
    bumpIdle()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((evt) => window.addEventListener(evt, bumpIdle, { passive: true }))
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, bumpIdle))
      if (idleRef.current) window.clearTimeout(idleRef.current)
    }
  }, [user, bumpIdle])

  const login = useCallback(
    async (payload) => {
      const res = await api.post('/auth/login', payload)
      const next = res.data.data
      setUser(next)
      if (next?.theme) applyTheme(next.theme)
      return next
    },
    [applyTheme],
  )

  const value = useMemo(
    () => ({
      user,
      setUser,
      ready,
      theme,
      applyTheme,
      login,
      logout,
      refreshMe,
    }),
    [user, ready, theme, applyTheme, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
