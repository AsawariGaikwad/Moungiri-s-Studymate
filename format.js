export function formatNumber(value, fallback = '—') {
  if (value == null || value === '') return fallback
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
}

export function formatPercent(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return `${formatNumber(n)}%`
}

export function formatMoney(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

export function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

export function boolLabel(value) {
  if (value == null) return '—'
  return value ? 'Yes' : 'No'
}

export function fileUrl(path) {
  if (!path) return null
  return path
}
