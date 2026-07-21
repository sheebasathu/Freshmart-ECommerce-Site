/**
 * src/api/client.js
 * Central Axios instance — attaches JWT Bearer token, auto-refreshes on 401.
 */
import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Attach access token to every request ─────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fm_access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh access token on 401 ─────────────────────────────
let refreshing  = false
let waitQueue   = []
const drain = (err, token) => {
  waitQueue.forEach(p => err ? p.reject(err) : p.resolve(token))
  waitQueue = []
}

client.interceptors.response.use(
  r => r,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => waitQueue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return client(orig) })
      }
      orig._retry = true
      refreshing  = true
      const refresh = localStorage.getItem('fm_refresh')
      if (!refresh) {
        refreshing = false
        window.dispatchEvent(new Event('fm:logout'))
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh })
        localStorage.setItem('fm_access', data.access)
        drain(null, data.access)
        orig.headers.Authorization = `Bearer ${data.access}`
        return client(orig)
      } catch (e) {
        drain(e, null)
        localStorage.removeItem('fm_access')
        localStorage.removeItem('fm_refresh')
        window.dispatchEvent(new Event('fm:logout'))
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default client