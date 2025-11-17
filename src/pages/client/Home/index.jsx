import React from 'react' // Xóa useEffect
import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
// Xóa useLocation, useNavigate

const Home = () => {
  // === XÓA TOÀN BỘ ĐOẠN CODE useEffect TỪ ĐÂY ===

  // === KẾT THÚC PHẦN XÓA ===

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