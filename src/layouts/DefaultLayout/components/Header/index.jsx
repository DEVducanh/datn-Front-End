// src/layouts/DefaultLayout/components/Header/index.jsx
import React, { useState, useMemo } from 'react'
import { FlameKindling, Menu, X, Clock, ShoppingCart, Receipt, LogOut } from 'lucide-react'
import { Button, Badge, Avatar, Dropdown } from 'antd' // <<<--- Bỏ Spin
import AntButton from '@/components/AntButton'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { useAuth } from '@/contexts/AuthContext'
import { NavLink } from 'react-router'
import OrderHistoryModal from '../OrderHistoryModal'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router'

const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isLoggedIn, user, logout } = useAuth()
  const mongoTableId = localStorage.getItem('currentTableId')
  const token = localStorage.getItem('access_token')

  const userData = useMemo(() => {
    if (!token) return null
    try {
      return jwtDecode(token)
    } catch (error) {
      console.error('Token decode error:', error)
      return null
    }
  }, [token])

  console.log(userData)

  // --- Query lấy giỏ hàng (Giữ nguyên) ---
  const { data: cartData } = useQuery({
    queryKey: ['cart', mongoTableId],
    queryFn: async () => {
      if (!mongoTableId) return null
      try {
        const res = await http.get(`/cart/cart-item/${mongoTableId}`)
        return res?.data
      } catch (error) {
        return null
      }
    },
    enabled: !!mongoTableId,
  })

  // Tính tổng số lượng (Giữ nguyên)
  const totalItemCount = useMemo(() => {
    if (!cartData || !cartData.items) return 0
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartData])

  // Hàm Đăng xuất (Giữ nguyên)
  const handleLogout = () => {
    localStorage.removeItem('currentTableId')
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('access_token')
    window.location.href = '/flareon/login'
  }
  const userMenuItems = [
    {
      key: 'orders',
      label: <NavLink to="/flareon/orders">Đơn hàng của tôi</NavLink>,
      icon: <Receipt size={16} />,
    },
    {
      key: 'history-modal',
      label: 'Lịch sử hóa đơn',
      icon: <Clock size={16} />,
      onClick: () => setIsModalOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: (
        <span onClick={logout} className="text-red-600 font-semibold">
          Đăng xuất
        </span>
      ),
      icon: <LogOut size={16} className="text-red-600" />,
    },
  ]

  const UserDropdown = () => (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
      <div className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
        {/* <Avatar>{userData?.username?.charAt(0).toUpperCase() || <UserOutlined />}</Avatar> */}
        {/* <span className="hidden lg:inline text-gray-700 font-semibold">{userName}</span> */}
      </div>
    </Dropdown>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/flareon')}
          >
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <FlameKindling className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900 font-semibold">Flareon</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/flareon">Trang chủ</NavLink>
            <NavLink to="/flareon/about">Về chúng tôi</NavLink>
            <NavLink to="/flareon/category">Món ăn</NavLink>
            <NavLink to="/flareon/contact">Liên hệ</NavLink>
          </div>

          {/* User + Cart Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {userData ? (
              <UserDropdown />
            ) : (
              <>
                <AntButton onClick={() => navigate('/flareon/login')} type="primary">
                  Đăng nhập
                </AntButton>
                <AntButton onClick={() => navigate('/flareon/register')}>Đăng ký</AntButton>
              </>
            )}

            <Button
              type="text"
              className="!flex !items-center !justify-center"
              onClick={() => navigate('/flareon/cart')}
            >
              <Badge count={totalItemCount} size="small" offset={[0, 2]}>
                <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-orange-500" />
              </Badge>
            </Button>
          </div>

          {/* Mobile Toggle Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col gap-3 mt-4 pb-4 border-t border-gray-200">
            <NavLink className="py-2" to="/flareon" onClick={() => setIsMenuOpen(false)}>
              Trang chủ
            </NavLink>
            <NavLink className="py-2" to="/flareon/about" onClick={() => setIsMenuOpen(false)}>
              Về chúng tôi
            </NavLink>
            <NavLink className="py-2" to="/flareon/category" onClick={() => setIsMenuOpen(false)}>
              Món ăn
            </NavLink>
            <NavLink className="py-2" to="/flareon/contact" onClick={() => setIsMenuOpen(false)}>
              Liên hệ
            </NavLink>

            <div className="flex flex-col gap-3 mt-2">
              {userData ? (
                <>
                  <div className="flex items-center gap-3 px-1">
                    <Avatar>{userData.username.charAt(0).toUpperCase()}</Avatar>
                    <span className="font-semibold">{userName}</span>
                  </div>

                  <Button block onClick={() => setIsModalOpen(true)}>
                    <Clock size={16} className="mr-2" /> Lịch sử hóa đơn
                  </Button>

                  <Button block danger onClick={logout}>
                    <LogOut size={16} className="mr-2" /> Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <AntButton block onClick={() => navigate('/flareon/login')}>
                    Đăng nhập
                  </AntButton>
                  <AntButton block onClick={() => navigate('/flareon/register')}>
                    Đăng ký
                  </AntButton>
                </>
              )}

              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/flareon/cart')
                  setIsMenuOpen(false)
                }}
              >
                <Badge count={totalItemCount}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                </Badge>
                Giỏ hàng
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal */}
      <OrderHistoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  )
}

export default Header
