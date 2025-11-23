import React, { useEffect, useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { toast } from 'react-toastify'
import { USER_ROLE } from '@/shared/constants/role' // Nhớ check lại đường dẫn này

const AdminRoute = () => {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true) // Trạng thái đang kiểm tra
  const [canAccess, setCanAccess] = useState(false) // Trạng thái được phép vào

  useEffect(() => {
    // 1. Lấy thông tin user
    let user = null
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        user = JSON.parse(userString)
      }
    } catch (error) {
      console.error('Lỗi parse user:', error)
    }

    // 2. Thực hiện kiểm tra
    if (!user) {
      // TH1: Chưa đăng nhập
      // Toast phải gọi ở đây mới hiện được trước khi chuyển trang
      toast.warning('Vui lòng đăng nhập tài khoản quản trị!')
      navigate('/flareon/login', { replace: true })
    } else if (user.role !== USER_ROLE.ADMIN) {
      // TH2: Đã đăng nhập nhưng không phải Admin
      toast.error('Bạn không có quyền truy cập trang này!')

      // Tùy chọn: Đăng xuất luôn để tránh lỗi vòng lặp nếu trang login tự động redirect
      // localStorage.removeItem('user')

      navigate('/flareon', { replace: true })
    } else {
      // TH3: Đúng là Admin -> Cho phép vào
      setCanAccess(true)
    }

    // Đã kiểm tra xong
    setIsChecking(false)
  }, [navigate])

  // Trong lúc đang kiểm tra thì không hiện gì cả (hoặc return <Spin />)
  if (isChecking) return null

  // Nếu được phép thì hiện nội dung (Outlet), không thì chặn lại (null)
  return canAccess ? <Outlet /> : null
}

export default AdminRoute
