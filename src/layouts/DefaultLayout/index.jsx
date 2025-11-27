import Header from './components/Header'
import Footer from './components/Footer'
import { Outlet, useNavigate, useLocation } from 'react-router'
import React, { useEffect } from 'react'

const DefaultLayout = () => {
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
