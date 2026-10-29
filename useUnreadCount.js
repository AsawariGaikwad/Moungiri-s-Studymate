import { useGet } from '@/hooks/useGet'
import { useAuth } from '@/context/AuthContext'

export function useUnreadCount() {
  const { user } = useAuth()
  return useGet(['notifications', 'unread-count'], '/notifications/unread-count', undefined, {
    enabled: Boolean(user) && !user.must_change_password,
    refetchInterval: 60_000,
  })
}
