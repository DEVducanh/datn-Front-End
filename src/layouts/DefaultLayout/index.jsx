import Header from './components/Header'
import Footer from './components/Footer'
import { Outlet, useLocation, useNavigate } from 'react-router' // Thêm useLocation, useNavigate
import React, { useEffect } from 'react' // Thêm useEffect, React

const DefaultLayout = () => {
  // === THÊM LOGIC useEffect TỪ Home.jsx VÀO ĐÂY ===
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('--- DefaultLayout.jsx useEffect ĐANG CHẠY ---');
    console.log('URL (location.search) mà code đang đọc là:', location.search);

    const searchParams = new URLSearchParams(location.search)
    const tableIdFromUrl = searchParams.get('table_id')

    console.log('Giá trị table_id tìm thấy là:', tableIdFromUrl);

    if (tableIdFromUrl) {
      console.log('Đã phát hiện và lưu table_id:', tableIdFromUrl)
      localStorage.setItem('currentTableId', tableIdFromUrl)

      searchParams.delete('table_id')
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true }
      )
    }
  }, [location, navigate])
  // === KẾT THÚC LOGIC ===

  return (
    <div className="default-layout flex flex-col min-h-screen">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default DefaultLayout