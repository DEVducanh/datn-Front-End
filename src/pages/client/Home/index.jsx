import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import { ModalInfor } from '@/layouts/DefaultLayout/components/Modal'
import { useState } from 'react'

const Home = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isModalInforOpen, setIsModalInforOpen] = useState(true)

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
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

    // --- LOGIC KIỂM TRA NGHIÊM NGẶT ---
    if (activeTableId) {
      if (urlTableId) {
        localStorage.setItem('currentTableId', urlTableId)
      }

      // KIỂM TRA: Nếu thiếu Token HOẶC thiếu UserInfo -> ĐÁ VỀ TRANG NHẬP TÊN
      if (!token || !userInfo || userInfo === 'undefined') {
        console.log('🚫 Phát hiện ngồi bàn nhưng chưa nhập tên -> Chuyển hướng...')
        navigate(`/guest-login?table_id=${activeTableId}`)
      } else {
        console.log('✅ Đã đầy đủ thông tin -> Cho phép ở lại')
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
    <div className="relative">
      <Hero />
      <Features />
      <Categories />
      <Products limit={10} />
      {isModalInforOpen && (
        <ModalInfor open={isModalInforOpen} hanldeClose={() => setIsModalInforOpen(false)} />
      )}
    </div>
  )
}

export default Home
