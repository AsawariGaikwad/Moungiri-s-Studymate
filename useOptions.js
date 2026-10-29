import { useGet } from '@/hooks/useGet'

export function useOptions(endpoint, config = {}) {
  const { params, enabled = true, map } = config
  const query = useGet(endpoint ? [endpoint, 'options'] : ['options-idle'], endpoint, { per_page: 100, ...params }, {
    enabled: Boolean(endpoint) && enabled,
    staleTime: 60_000,
  })

  const rows = Array.isArray(query.data?.data) ? query.data.data : []
  const options = rows
    .map((item) => {
      if (typeof map === 'function') return map(item)
      const valueKey = map?.value ?? 'id'
      const labelKey = map?.label ?? 'name'
      const value = typeof valueKey === 'function' ? valueKey(item) : item[valueKey]
      const label = typeof labelKey === 'function' ? labelKey(item) : item[labelKey]
      return { value, label }
    })
    .filter((opt) => opt.value != null && opt.label != null)

  return { ...query, options }
}
