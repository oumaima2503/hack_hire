import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

/** Client-side redirect only; the API enforces auth and ownership on every request. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { parent, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="loading">…</p>
  if (!parent) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}
