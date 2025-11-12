import Header from './components/Header'
import Footer from './components/Footer'
import { Outlet } from 'react-router'

const DefaultLayout = () => {
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
