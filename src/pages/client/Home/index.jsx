import React, { useEffect } from 'react' // Thêm useEffect
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import { useLocation, useNavigate } from 'react-router'

const Home = () => {
  const location = useLocation() // Để đọc URL hiện tại
  const navigate = useNavigate() // Để thay đổi URL

  // === THÊM ĐOẠN CODE NÀY ===
  useEffect(() => {
    // 1. Lấy các tham số từ URL (ví dụ: ?table_id=abc)
    const searchParams = new URLSearchParams(location.search)
    const tableIdFromUrl = searchParams.get('table_id')

    // 2. Nếu tìm thấy 'table_id'
    if (tableIdFromUrl) {
      // 3. Lưu ngay vào localStorage
      console.log('Đã phát hiện và lưu table_id:', tableIdFromUrl)
      localStorage.setItem('currentTableId', tableIdFromUrl)

      // 4. (Khuyên dùng) Xóa 'table_id' khỏi URL để làm sạch
      // Giúp người dùng F5 trang mà không bị lưu lại ID
      searchParams.delete('table_id')
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true } // 'replace' để không tạo thêm lịch sử trình duyệt
      )
    }
  }, [location, navigate]) // Chạy lại mỗi khi URL thay đổi
  // === KẾT THÚC ĐOẠN CODE ===

  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <Products />
    </>
  )
}

export default Home
