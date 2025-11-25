import { USER_ROLE } from '@/shared/constants/role'
import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

const PrivateRoute = ({ allowedRoles = [] }) => {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [permission, setPermission] = useState(null) // 'GRANTED', 'DENIED', 'NOT_LOGGED_IN'

  useEffect(() => {
    const checkPermission = () => {
      // 1. Lấy user từ localStorage
      let user = null
      try {
        const userString = localStorage.getItem('user')
        if (userString) user = JSON.parse(userString)
      } catch (e) {
        console.error('Lỗi parse user:', e)
      }

      // 2. Kiểm tra đăng nhập
      if (!user) {
        setPermission('NOT_LOGGED_IN')
        setIsChecking(false)
        return
      }

      // 3. Kiểm tra Role (Quan trọng!)
      // Nếu allowedRoles RỖNG -> Nghĩa là trang này chỉ cần login là vào được (như trang Invoice, Cart)
      if (allowedRoles.length === 0) {
        setPermission('GRANTED')
        setIsChecking(false)
        return
      }

      // Nếu có allowedRoles -> Phải check chính xác
      // Ép kiểu về Number để so sánh an toàn (ví dụ '0' == 0)
      const userRole = Number(user.role)
      const hasPermission = userRole === USER_ROLE.ADMIN || allowedRoles.includes(userRole)

      if (hasPermission) {
        setPermission('GRANTED')
      } else {
        console.warn(
          `User role ${userRole} bị chặn truy cập vào route yêu cầu roles: ${allowedRoles}`
        )
        setPermission('DENIED')
      }

      setIsChecking(false)
    }

    checkPermission()
  }, [allowedRoles]) // Chạy lại khi allowedRoles thay đổi

  if (isChecking) return null // Hoặc <Spin />

  if (permission === 'NOT_LOGGED_IN') {
    // Chỉ hiện toast nếu không phải đang ở trang login
    if (location.pathname !== '/flareon/login') {
      toast.warning('Vui lòng đăng nhập để tiếp tục.')
    }
    return <Navigate to="/flareon/login" state={{ from: location }} replace />
  }

  if (permission === 'DENIED') {
    toast.error('Bạn không có quyền truy cập trang này!')
    // Đá về trang chủ (an toàn nhất)
    return <Navigate to="/flareon" replace />
  }

  return <Outlet />
}

export default PrivateRoute
