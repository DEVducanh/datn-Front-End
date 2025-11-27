// src/layouts/DefaultLayout/components/Header/index.jsx
import React, { useState, useMemo } from 'react'
import { FlameKindling, Menu, X, Clock, ShoppingCart, Receipt, LogOut, User } from 'lucide-react'
import { Button, Badge, Avatar, Dropdown } from 'antd'
import AntButton from '@/components/AntButton'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { useAuth } from '@/contexts/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import OrderHistoryModal from '../OrderHistoryModal'

const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Lấy thông tin user từ AuthContext (Đã bao gồm logic guest)
  const { isLoggedIn, user, logout } = useAuth()

  const mongoTableId = localStorage.getItem('currentTableId')

  // Lấy tên hiển thị (Ưu tiên username, nếu không có thì lấy name hoặc Guest)
  const userName = user?.username || user?.name || 'Khách'

  // --- Query lấy giỏ hàng ---
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

  const totalItemCount = useMemo(() => {
    if (!cartData || !cartData.items) return 0
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartData])

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
          Đăng xuất / Rời bàn
        </span>
      ),
      icon: <LogOut size={16} className="text-red-600" />,
    },
  ]

  const UserDropdown = () => (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
      <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
        <Avatar
          style={{ backgroundColor: '#f56a00', verticalAlign: 'middle' }}
          size="large"
        >
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        <span className="hidden lg:inline text-gray-700 font-semibold max-w-[100px] truncate">
          {userName}
        </span>
      </div>
    </Dropdown>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/flareon')}
          >
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FlameKindling className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900 font-bold tracking-tight group-hover:text-orange-600 transition-colors">Flareon</span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
            <NavLink to="/flareon" className={({ isActive }) => isActive ? "text-orange-600" : "hover:text-orange-500 transition-colors"}>Trang chủ</NavLink>
            <NavLink to="/flareon/about" className={({ isActive }) => isActive ? "text-orange-600" : "hover:text-orange-500 transition-colors"}>Về chúng tôi</NavLink>
            <NavLink to="/flareon/category" className={({ isActive }) => isActive ? "text-orange-600" : "hover:text-orange-500 transition-colors"}>Món ăn</NavLink>
            <NavLink to="/flareon/contact" className={({ isActive }) => isActive ? "text-orange-600" : "hover:text-orange-500 transition-colors"}>Liên hệ</NavLink>
          </div>

          {/* User + Cart Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              type="text"
              className="!flex !items-center !justify-center !w-10 !h-10 !rounded-full hover:!bg-gray-100"
              onClick={() => navigate('/flareon/cart')}
            >
              <Badge count={totalItemCount} size="small" offset={[0, 0]} color="#f56a00">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
              </Badge>
            </Button>

            {isLoggedIn && user ? (
              <UserDropdown />
            ) : (
              <div className="flex gap-2">
                <AntButton onClick={() => navigate('/flareon/login')} type="primary" className="!px-5">
                  Đăng nhập
                </AntButton>
                <AntButton onClick={() => navigate('/flareon/register')} className="!px-5">
                  Đăng ký
                </AntButton>
              </div>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button className="md:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col gap-2 mt-4 pb-4 border-t border-gray-200 animate-in slide-in-from-top-2">
            <NavLink className="py-3 px-2 rounded-md hover:bg-gray-50" to="/flareon" onClick={() => setIsMenuOpen(false)}>
              Trang chủ
            </NavLink>
            <NavLink className="py-3 px-2 rounded-md hover:bg-gray-50" to="/flareon/about" onClick={() => setIsMenuOpen(false)}>
              Về chúng tôi
            </NavLink>
            <NavLink className="py-3 px-2 rounded-md hover:bg-gray-50" to="/flareon/category" onClick={() => setIsMenuOpen(false)}>
              Món ăn
            </NavLink>
            <NavLink className="py-3 px-2 rounded-md hover:bg-gray-50" to="/flareon/contact" onClick={() => setIsMenuOpen(false)}>
              Liên hệ
            </NavLink>

            <div className="border-t border-gray-200 my-2 pt-2">
              {isLoggedIn && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2 py-2 bg-orange-50 rounded-lg">
                    <Avatar style={{ backgroundColor: '#f56a00' }}>{userName.charAt(0).toUpperCase()}</Avatar>
                    <div>
                      <p className="font-bold text-gray-800">{userName}</p>
                      <p className="text-xs text-green-600 font-medium">Đang hoạt động</p>
                    </div>
                  </div>

                  <Button block icon={<Receipt size={16} />} onClick={() => navigate('/flareon/orders')} className="!justify-start">
                    Đơn hàng của tôi
                  </Button>

                  <Button block icon={<Clock size={16} />} onClick={() => setIsModalOpen(true)} className="!justify-start">
                    Lịch sử hóa đơn
                  </Button>

                  <Button block danger icon={<LogOut size={16} />} onClick={logout} className="!justify-start">
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <AntButton block onClick={() => navigate('/flareon/login')} type="primary">
                    Đăng nhập
                  </AntButton>
                  <AntButton block onClick={() => navigate('/flareon/register')}>
                    Đăng ký
                  </AntButton>
                </div>
              )}

              <Button
                block
                type="text"
                className="mt-3 !flex !items-center !justify-center bg-gray-50 hover:bg-gray-100"
                onClick={() => {
                  navigate('/flareon/cart')
                  setIsMenuOpen(false)
                }}
              >
                <Badge count={totalItemCount} offset={[10, 0]}>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-gray-700">Giỏ hàng</span>
                  </div>
                </Badge>
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