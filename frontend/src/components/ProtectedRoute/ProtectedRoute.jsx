// src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { user }   = useAuth()
  const location   = useLocation()

  if (!user) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}