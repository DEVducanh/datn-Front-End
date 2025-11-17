import React, { useEffect } from 'react' // 1. Đã thêm useEffect
import { useLocation, useNavigate } from 'react-router-dom' // 2. Đã thêm useLocation, useNavigate
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'

const Home = () => {
  // 3. Khai báo 2 biến này để dùng được trong useEffect bên dưới
  const location = useLocation()
  const navigate = useNavigate()

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
        { replace: true }
      )
    }
  }, [location, navigate])

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