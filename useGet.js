import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'

export function useGet(queryKey, url, params, options = {}) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey]
  return useQuery({
    queryKey: [...key, params],
    queryFn: async () => {
      const res = await api.get(url, { params })
      return res.data
    },
    staleTime: 20_000,
    ...options,
    enabled: (options.enabled ?? true) && Boolean(url),
  })
}
