// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, registerUser, logoutUser, getProfile } from '../api/auth'

// ─────────────────────────────────────────────────────────────────────────────
//  Session duration: 2 days in milliseconds
//  After this the stored tokens are wiped and the user is logged out
//  automatically on the next page load or API call.
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_TTL_MS = 2 * 24 * 60 * 60 * 1000   // 2 days

const STORAGE = {
  ACCESS:  'fm_access',
  REFRESH: 'fm_refresh',
  USER:    'fm_user',
  EXPIRY:  'fm_session_expiry',
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readStorage() {
  try {
    const expiry = parseInt(localStorage.getItem(STORAGE.EXPIRY) || '0', 10)
    if (expiry && Date.now() > expiry) {
      // Session has expired — wipe everything
      Object.values(STORAGE).forEach(k => localStorage.removeItem(k))
      return { access: null, refresh: null, user: null }
    }
    const user = JSON.parse(localStorage.getItem(STORAGE.USER) || 'null')
    return {
      access:  localStorage.getItem(STORAGE.ACCESS),
      refresh: localStorage.getItem(STORAGE.REFRESH),
      user,
    }
  } catch {
    return { access: null, refresh: null, user: null }
  }
}

function writeStorage(access, refresh, user) {
  localStorage.setItem(STORAGE.ACCESS,  access)
  localStorage.setItem(STORAGE.REFRESH, refresh)
  localStorage.setItem(STORAGE.USER,    JSON.stringify(user))
  localStorage.setItem(STORAGE.EXPIRY,  String(Date.now() + SESSION_TTL_MS))
}

function clearStorage() {
  Object.values(STORAGE).forEach(k => localStorage.removeItem(k))
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const stored = readStorage()

  const [user,    setUser]    = useState(stored.user)
  const [loading, setLoading] = useState(!!stored.access && !stored.user)
  // `loading` is true only briefly on first mount when we have a token but no
  // cached user — we fetch the profile once to re-hydrate.

  // On mount: if we have a saved access token but no user object (e.g. after
  // a hard refresh where localStorage existed) re-fetch the profile.
  useEffect(() => {
    const { access, user: cachedUser } = readStorage()
    if (access && !cachedUser) {
      getProfile()
        .then(profile => {
          setUser(profile)
          // Update cached user without touching the tokens/expiry
          localStorage.setItem(STORAGE.USER, JSON.stringify(profile))
        })
        .catch(() => {
          // Token is invalid/expired — clear everything
          clearStorage()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // ── login ─────────────────────────────────────────────────────────────────
  // Called by Login.jsx. Returns the user object on success.
  // Throws an Error with a human-readable message on failure.
  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password })
    // Backend returns { access, refresh, user }
    writeStorage(data.access, data.refresh, data.user)
    setUser(data.user)
    return data.user
  }, [])

  // ── signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password, phone = '') => {
    const data = await registerUser({ name, email, phone, password, password2: password })
    writeStorage(data.access, data.refresh, data.user)
    setUser(data.user)
    return data.user
  }, [])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(STORAGE.REFRESH)
    try {
      if (refresh) await logoutUser(refresh)
    } catch {
      // Blacklist call failed — proceed with local logout anyway
    }
    clearStorage()
    setUser(null)
  }, [])

  // ── refreshUser: re-fetch profile from server ─────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile()
      setUser(profile)
      localStorage.setItem(STORAGE.USER, JSON.stringify(profile))
      return profile
    } catch {
      return null
    }
  }, [])

  const value = { user, loading, login, signup, logout, refreshUser }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}