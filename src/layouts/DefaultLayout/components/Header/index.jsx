// src/layouts/DefaultLayout/components/Header/index.jsx
import React, { useState, useMemo } from 'react'
import { FlameKindling, Menu, X, Clock, ShoppingCart, User, Receipt, LogOut } from 'lucide-react'
import { Modal, List, Button, Badge, Avatar, Dropdown } from 'antd' // <<<--- Bỏ Spin
import AntButton from '@/components/AntButton'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import OrderHistoryModal from '../OrderHistoryModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false) // <<<--- State này vẫn giữ
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuth()

  // --- LẤY ID VÀ DỮ LIỆU GIỎ HÀNG (Giữ nguyên) ---
  const mongoTableId = localStorage.getItem('currentTableId')
  const userString = localStorage.getItem('user')
  const userData = useMemo(() => (userString ? JSON.parse(userString) : null), [userString])
  const userId = userData?._id
  const userName = userData?.username || 'Tài khoản'

  // --- Query lấy giỏ hàng (Giữ nguyên) ---
  const { data: cartData } = useQuery({
    queryKey: ['cart', mongoTableId, userId],
    queryFn: async () => {
      if (!mongoTableId || !userId) return null
      try {
        const res = await http.get(`/cart/cart-item/${mongoTableId}/${userId}`)
        return res?.data
      } catch (error) {
        return null
      }
    },
    enabled: !!mongoTableId && !!userId,
  })

  // Tính tổng số lượng (Giữ nguyên)
  const totalItemCount = useMemo(() => {
    if (!cartData || !cartData.items) return 0
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartData])

  // Hàm Đăng xuất (Giữ nguyên)
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
    localStorage.removeItem('currentTableId')
    localStorage.removeItem('currentQrCode')
    window.location.href = '/flareon/login'
  }

  // --- TẤT CẢ LOGIC QUERY HÓA ĐƠN VÀ CÁC HÀM XỬ LÝ ĐÃ BỊ XÓA ---
  // (useQuery for invoices ... ĐÃ XÓA)
  // (openOrderDetail ... ĐÃ XÓA)
  // (handleReviewClick ... ĐÃ XÓA)

  // --- Menu dropdown (Giữ nguyên) ---
  const userMenuItems = [
    {
      key: 'profile',
      label: <NavLink to="/flareon/profile">Hồ sơ của tôi</NavLink>,
      icon: <User size={16} />,
    },
    {
      key: 'orders',
      label: <NavLink to="/flareon/orders">Đơn hàng của tôi</NavLink>,
      icon: <Receipt size={16} />,
    },
    {
      key: 'history-modal',
      label: 'Lịch sử hóa đơn',
      icon: <Clock size={16} />,
      onClick: () => setIsModalOpen(true), // <<<--- Chỉ cần gọi hàm này
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
        <Avatar>{userData?.username?.charAt(0).toUpperCase() || <UserOutlined />}</Avatar>
        <span className="hidden lg:inline text-gray-700 font-semibold">{userName}</span>
      </div>
    </Dropdown>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        {/* ... (Toàn bộ phần JSX của Header giữ nguyên) ... */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/flareon')}
          >
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <FlameKindling className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900 font-semibold">Flareon</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/flareon">Trang chủ</NavLink>
            <NavLink to="/flareon/about">Về chúng tôi</NavLink>
            <NavLink to="/flareon/category">Món ăn</NavLink>
            <NavLink to="/flareon/contact">Liên hệ</NavLink>
          </div>

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
              aria-label="Giỏ hàng"
            >
              <Badge count={totalItemCount} size="small" offset={[0, 2]}>
                <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-orange-500" />
              </Badge>
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && <div className="md:hidden ..."> ... </div>}
      </nav>

      {/* --- XÓA MODAL CŨ VÀ GỌI COMPONENT MỚI --- */}
      <OrderHistoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  )
}

export default Header
