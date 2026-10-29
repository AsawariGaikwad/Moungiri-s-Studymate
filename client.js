import axios from 'axios'
import { readCookie } from '@/lib/cookies'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  withCredentials: true,
})

let refreshPromise = null
let onAuthFailure = null

export function setAuthFailureHandler(handler) {
  onAuthFailure = handler
}

function isMutating(method) {
  return ['post', 'patch', 'put', 'delete'].includes(String(method || 'get').toLowerCase())
}

function isAuthPath(url = '', fragment) {
  return String(url).includes(fragment)
}

api.interceptors.request.use((config) => {
  if (isMutating(config.method)) {
    const refresh = isAuthPath(config.url, '/auth/refresh')
    const token = readCookie(refresh ? 'csrf_refresh_token' : 'csrf_access_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers['X-CSRF-TOKEN'] = token
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    const status = error.response?.status
    const code = error.response?.data?.error
    const url = original.url || ''

    if (isAuthPath(url, '/auth/login')) {
      return Promise.reject(error)
    }

    if (status === 401 && isAuthPath(url, '/auth/refresh')) {
      onAuthFailure?.()
      return Promise.reject(error)
    }

    if (status === 401 && code === 'token_expired' && !original._retry) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null
          })
        }
        await refreshPromise
        return api(original)
      } catch (refreshError) {
        onAuthFailure?.()
        return Promise.reject(refreshError)
      }
    }

    if (status === 401) {
      onAuthFailure?.()
    }

    return Promise.reject(error)
  },
)

export default api
