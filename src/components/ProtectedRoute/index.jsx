import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation, Navigate, Outlet } from 'react-router' // <-- ĐÃ THÊM Navigate VÀ Outlet

// Protect routes that require authentication. If not logged in, redirect to /login
export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // Preserve the attempted URL in state so the app can redirect after login
    return <Navigate to="/flareon/login" replace state={{ from: location }} /> // <-- Cập nhật lại link login
  }

  return <Outlet />
}

// Redirect logged-in users away from auth pages (login/register)
export const AuthRedirect = () => {
  const { isLoggedIn } = useAuth()

  if (isLoggedIn) {
    return <Navigate to="/flareon" replace /> // <-- Cập nhật lại link trang chủ
  }

  return <Outlet />
}

export default ProtectedRoute