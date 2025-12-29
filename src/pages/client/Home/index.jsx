import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import http from '@/apis/http'

const Home = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)

    // 1. Lấy mã bàn
    const urlTableId = searchParams.get('table_id')
    const storedTableId = localStorage.getItem('currentTableId')
    const activeTableId = urlTableId || storedTableId

    // 2. LẤY THÔNG TIN XÁC THỰC (ĐÃ BỔ SUNG KEY 'userToken')
    let token =
      localStorage.getItem('userToken') ||      // <--- ĐÂY LÀ CÁI BẠN ĐANG DÙNG
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')

    // Lấy thông tin User
    const userInfo =
      localStorage.getItem('user') ||           // <--- Key chứa thông tin user
      localStorage.getItem('user_info')

    // Xử lý token rác
    if (token === 'null' || token === 'undefined') token = null

    // --- LOGIC KIỂM TRA ---
    if (activeTableId) {
      if (urlTableId) {
        localStorage.setItem('currentTableId', urlTableId)
      }

      // NẾU THIẾU TOKEN HOẶC USER -> MỚI ĐÁ VỀ GUEST LOGIN
      if (!token || !userInfo || userInfo === 'undefined') {
        // console.log('Không tìm thấy userToken -> Về GuestLogin')
        window.location.href = `/guest-login?table_id=${activeTableId}`
        return
      } else {
        // console.log('Đã có userToken -> Check-in bàn')

        // Gọi API cập nhật trạng thái bàn
        const handleCheckIn = async () => {
          try {
            await http.patch(`/tables/${activeTableId}`, { status: 'occupied' })
          } catch (error) {
            console.error('Lỗi check-in bàn:', error)
          }
        }
        handleCheckIn()

        // Xóa table_id trên URL cho đẹp
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