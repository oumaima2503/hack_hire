import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type Child, type Parent } from './api'

interface Ctx {
  parent: Parent | null
  children: Child[]
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<Child[]>
  register: (b: { name: string; email: string; password: string; consent: boolean }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)

/** Session state only: the JWT lives in an httpOnly cookie the browser JS can't read. */
export function AuthProvider({ children: node }: { children: ReactNode }) {
  const [parent, setParent] = useState<Parent | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await api.me()
      setParent(me.parent)
      setChildren(me.children)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) console.warn(e)
      setParent(null)
      setChildren([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    setParent(res.parent)
    setChildren(res.children)
    return res.children
  }, [])

  const register = useCallback(async (b: { name: string; email: string; password: string; consent: boolean }) => {
    const res = await api.register(b)
    setParent(res.parent)
    setChildren(res.children)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setParent(null)
      setChildren([])
      try {
        localStorage.removeItem('myrugy.session')
      } catch {
        /* ignore */
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ parent, children, loading, refresh, login, register, logout }}>{node}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
