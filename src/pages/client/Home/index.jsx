import React, { useEffect } from 'react' // Thêm useEffect
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import { useLocation, useNavigate } from 'react-router'

const Home = () => {
  const location = useLocation() // Để đọc URL hiện tại
  const navigate = useNavigate() // Để thay đổi URL

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tableIdFromUrl = searchParams.get('table_id')

    if (tableIdFromUrl) {
      localStorage.setItem('currentTableId', tableIdFromUrl)

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
