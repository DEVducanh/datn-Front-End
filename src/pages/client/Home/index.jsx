import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import http from '@/apis/http' // <--- 1. Nhớ import http

const Home = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)

    // 1. Lấy mã bàn (Ưu tiên URL, sau đó là Storage)
    const urlTableId = searchParams.get('table_id')
    const storedTableId = localStorage.getItem('currentTableId')
    const activeTableId = urlTableId || storedTableId

    // 2. Lấy thông tin xác thực
    let token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token')
    const userInfo = localStorage.getItem('user_info')

    // Xử lý token rác
    if (token === 'null' || token === 'undefined') token = null

    // --- LOGIC KIỂM TRA ---
    if (activeTableId) {
      // Cập nhật lại kho nếu có ID mới từ URL
      if (urlTableId) {
        localStorage.setItem('currentTableId', urlTableId)
      }

      // KIỂM TRA: Nếu thiếu Token HOẶC thiếu UserInfo -> ĐÁ VỀ TRANG NHẬP TÊN
      if (!token || !userInfo || userInfo === 'undefined') {
        console.log('🚫 Chưa đăng nhập đủ -> Chuyển hướng CỨNG sang GuestLogin...')
        window.location.href = `/guest-login?table_id=${activeTableId}`
        return
      } else {
        console.log('✅ Đã đầy đủ thông tin -> Check-in vào bàn')

        // --- 3. GỌI API CHECK-IN (CẬP NHẬT TRẠNG THÁI BÀN) ---
        // Chỉ gọi khi đã chắc chắn có user và tableId
        const handleCheckIn = async () => {
          try {
            // Gọi API chuyển bàn sang 'occupied' ngay lập tức
            await http.patch(`/tables/${activeTableId}`, { status: 'occupied' })
            console.log('Update bàn thành công: Occupied')
          } catch (error) {
            console.error('Lỗi check-in bàn:', error)
          }
        }
        handleCheckIn()
        // -----------------------------------------------------

        // Nếu trên URL vẫn còn ?table_id thì xóa đi cho đẹp
        if (urlTableId) {
          searchParams.delete('table_id')
          navigate(
            { pathname: location.pathname, search: searchParams.toString() },
            { replace: true }
          )
        }
      }
    }
  }, [location, navigate])

  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <Products limit={10} />
    </>
  )
}

export default Home
