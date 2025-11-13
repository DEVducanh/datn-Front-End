import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router'

export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

// Redirect logged-in users away from auth pages (login/register)
export const AuthRedirect = () => {
  const { isLoggedIn } = useAuth()

  if (isLoggedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
