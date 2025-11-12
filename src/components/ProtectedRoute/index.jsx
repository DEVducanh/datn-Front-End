import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'react-router'

// Protect routes that require authentication. If not logged in, redirect to /login
export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // Preserve the attempted URL in state so the app can redirect after login
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
