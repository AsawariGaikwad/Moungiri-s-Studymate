export function readCookie(name) {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/([.$?*|{}()[\]/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
