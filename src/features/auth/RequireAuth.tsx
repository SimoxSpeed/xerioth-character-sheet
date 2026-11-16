import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="muted" style={{ padding: 24 }}>Caricamento…</p>
  if (!user) return <Navigate to="/accesso" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
