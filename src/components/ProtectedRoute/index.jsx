import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation, Navigate, Outlet } from 'react-router' // <-- ĐÃ THÊM Navigate VÀ Outlet

export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // Chuyển hướng về trang login (đã sửa thành /flareon/login cho khớp với dự án)
    return <Navigate to="/flareon/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

// Redirect logged-in users away from auth pages (login/register)
export const AuthRedirect = () => {
  const { isLoggedIn } = useAuth()

  if (isLoggedIn) {
    // Nếu đã đăng nhập thì đẩy về trang chủ /flareon
    return <Navigate to="/flareon" replace />
  }

  return <Outlet />
}

export default ProtectedRoute