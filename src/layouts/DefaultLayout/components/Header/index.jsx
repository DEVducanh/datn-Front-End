// src/layouts/DefaultLayout/components/Header/index.jsx
import React, { use, useState, useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FlameKindling, Menu, X, Clock, ShoppingCart, User, Receipt, LogOut } from 'lucide-react' // Import các icon cần thiết
import { Modal, List, Button, Badge, Avatar, Dropdown } from 'antd' // Import các component Antd
import AntButton from '@/components/AntButton'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuth()

  // --- LẤY ID VÀ DỮ LIỆU GIỎ HÀNG ---
  const mongoTableId = localStorage.getItem('currentTableId')
  const userString = localStorage.getItem('user')
  const userData = useMemo(() => (userString ? JSON.parse(userString) : null), [userString])
  const userId = userData?._id
  const userName = userData?.username || 'Tài khoản' // Lấy tên user

  const { data: cartData } = useQuery({
    queryKey: ['cart', mongoTableId, userId],
    queryFn: async () => {
      if (!mongoTableId || !userId) return null
      try {
        const res = await http.get(`/cart/cart-item/${mongoTableId}/${userId}`)
        console.log('Header: API GET /cart trả về:', res)
        return res?.data
      } catch (error) {
        console.error('Header: Lỗi lấy giỏ hàng:', error)
        return null
      }
    },
    enabled: !!mongoTableId && !!userId,
    staleTime: 1000 * 30,
  })

  // Tính tổng số lượng
  const totalItemCount = useMemo(() => {
    if (!cartData || !cartData.items) return 0
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartData])

  // Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
    localStorage.removeItem('currentTableId')
    localStorage.removeItem('currentQrCode')
    window.location.href = '/flareon/login'
  }
  // --- KẾT THÚC PHẦN LOGIC MỚI ---

  // Dữ liệu demo đơn hàng (GIỮ NGUYÊN)
  const orders = [
    {
      id: 1,
      table: 'Bàn 01',
      items: [
        { name: 'Cơm gà xối mắm', qty: 1, price: 45000 },
        { name: 'Trà đá', qty: 2, price: 5000 },
      ],
    },
    {
      id: 2,
      table: 'Bàn 03',
      items: [
        { name: 'Bún bò Huế', qty: 1, price: 50000 },
        { name: 'Nước suối', qty: 1, price: 8000 },
      ],
    },
  ]

  const openOrderDetail = (order) => {
    const now = new Date()
    const minutesAgo = Math.floor(30 + Math.random() * 90)
    const startTime = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString()
    const paymentTime = now.toISOString()
    setIsModalOpen(false)
    // Sửa lại đường dẫn Order Detail (nếu cần)
    navigate(`/flareon/order/${order.id}`, {
      // <<<--- SỬA LẠI ĐƯỜNG DẪN
      state: { order, startTime, paymentTime },
    })
  }

  // --- THAY ĐỔI 1: THÊM MỤC "LỊCH SỬ ĐƠN (MODAL)" VÀO MENU ---
  const userMenuItems = [
    {
      key: 'profile',
      label: <NavLink to="/flareon/profile">Hồ sơ của tôi</NavLink>, // <<<--- SỬA LẠI ĐƯỜNG DẪN
      icon: <User size={16} />,
    },
    {
      key: 'orders',
      label: <NavLink to="/flareon/orders">Đơn hàng của tôi</NavLink>, // <<<--- SỬA LẠI ĐƯỜNG DẪN
      icon: <Receipt size={16} />,
    },
    {
      key: 'history-modal', // Thêm key mới
      label: 'Lịch sử (Modal)', // Thêm label
      icon: <Clock size={16} />, // Dùng icon Clock
      onClick: () => setIsModalOpen(true), // Thêm onClick
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
        <Avatar>{userData.username?.charAt(0).toUpperCase() || <UserOutlined />}</Avatar>
        <span className="hidden lg:inline text-gray-700 font-semibold">{userName}</span>
      </div>
    </Dropdown>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* LOGO (GIỮ NGUYÊN) */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/flareon')}
          >
            {' '}
            {/* <<< SỬA LẠI */}
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <FlameKindling className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900 font-semibold">Flareon</span>
          </div>

          {/* MENU DESKTOP (SỬA LẠI ĐƯỜNG DẪN) */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/flareon"
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              {' '}
              {/* <<< SỬA LẠI */}
              Trang chủ
            </NavLink>
            <NavLink
              to="/flareon/about" // <<< SỬA LẠI (Hoặc /features nếu bạn có)
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Về chúng tôi
            </NavLink>
            <NavLink
              to="/flareon/category" // <<< SỬA LẠI
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Món ăn
            </NavLink>
            <NavLink
              to="/flareon/contact" // <<< SỬA LẠI
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Liên hệ
            </NavLink>
          </div>

          {/* NÚT CHỨC NĂNG BÊN PHẢI (ĐÃ SỬA) */}
          <div className="hidden md:flex items-center gap-3">
            {/* NÚT GIỎ HÀNG */}

            {/* --- THAY ĐỔI 2: XÓA NÚT "LỊCH SỬ ĐƠN HÀNG" ĐỘC LẬP --- */}
            {/* <Button type="default" icon={<Clock />} onClick={() => setIsModalOpen(true)}>
              Lịch sử đơn hàng
            </Button> 
            */}

            {/* LOGIC ĐĂNG NHẬP/ĐĂNG XUẤT */}
            {userData ? (
              <UserDropdown /> // Hiển thị dropdown nếu đã đăng nhập
            ) : (
              <>
                <AntButton onClick={() => navigate('login')} type="primary">
                  Đăng nhập
                </AntButton>{' '}
                {/* <<< SỬA LẠI */}
                <AntButton onClick={() => navigate('register')}>Đăng ký</AntButton>{' '}
                {/* <<< SỬA LẠI */}
              </>
            )}
            {/* NÚT GIỎ HÀNG */}
            <Button
              type="text"
              className="!flex !items-center !justify-center"
              onClick={() => navigate('/flareon/cart')} // <<< SỬA LẠI
              aria-label="Giỏ hàng"
            >
              <Badge count={totalItemCount} size="small" offset={[0, 2]}>
                <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-orange-500" />
              </Badge>
            </Button>
          </div>

          {/* NÚT MENU MOBILE (GIỮ NGUYÊN) */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* MENU MOBILE (ĐÃ SỬA) */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <NavLink
                to="/flareon"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Trang chủ
              </NavLink>{' '}
              {/* <<< SỬA LẠI */}
              <NavLink
                to="/flareon/about"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Về chúng tôi
              </NavLink>{' '}
              {/* <<< SỬA LẠI */}
              <NavLink
                to="/flareon/category"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Món ăn
              </NavLink>{' '}
              {/* <<< SỬA LẠI */}
              <NavLink
                to="/flareon/contact"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Liên hệ
              </NavLink>{' '}
              {/* <<< SỬA LẠI */}
              {/* GIỎ HÀNG (MOBILE) */}
              <Button
                type="default"
                icon={<Badge count={totalItemCount}></Badge>}
                onClick={() => {
                  navigate('/flareon/cart')
                  setIsMenuOpen(false)
                }} // <<< SỬA LẠI
              >
                Giỏ hàng ({totalItemCount})
              </Button>
              <Button
                type="default"
                icon={<Clock />}
                onClick={() => {
                  setIsModalOpen(true)
                  setIsMenuOpen(false)
                }}
              >
                Lịch sử đơn hàng
              </Button>
              {/* ĐĂNG NHẬP/ĐĂNG XUẤT (MOBILE) */}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                {userData ? (
                  <>
                    <NavLink to="/flareon/profile" className="text-gray-700 font-semibold p-2 ...">
                      Chào, {userName}
                    </NavLink>{' '}
                    {/* <<< SỬA LẠI */}
                    <AntButton onClick={handleLogout} danger>
                      Đăng xuất
                    </AntButton>
                  </>
                ) : (
                  <>
                    <AntButton
                      onClick={() => {
                        navigate('login')
                        setIsMenuOpen(false)
                      }}
                      type="primary"
                    >
                      Đăng nhập
                    </AntButton>{' '}
                    {/* <<< SỬA LẠI */}
                    <AntButton
                      onClick={() => {
                        navigate('register')
                        setIsMenuOpen(false)
                      }}
                    >
                      Đăng ký
                    </AntButton>{' '}
                    {/* <<< SỬA LẠI */}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* MODAL LỊCH SỬ ĐƠN HÀNG (ĐÃ SỬA LỖI CÚ PHÁP) */}
      <Modal
        title="🧾 Lịch sử đơn hàng theo bàn"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <List
          itemLayout="vertical"
          dataSource={orders}
          renderItem={(order) => {
            const total = order.items.reduce((sum, it) => sum + it.qty * it.price, 0)
            const formatVnd = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
            return (
              <List.Item
                key={order.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => openOrderDetail(order)}
              >
                {/* Dòng "id:" bị thừa đã được XÓA */}
                <List.Item.Meta
                  title={<span className="font-semibold">{order.table}</span>}
                  P
                  description={
                    <>
                      <ul className="list-disc pl-5">
                        {order.items.map((it, idx) => (
                          <li key={idx}>
                            {it.name} x{it.qty} — {formatVnd(it.qty * it.price)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-medium">Tổng tiền: {formatVnd(total)}</p>
                    </>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Modal>
    </header>
  )
}

export default Header
