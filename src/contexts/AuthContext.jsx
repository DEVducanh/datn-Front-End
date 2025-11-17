import { createContext, useContext, useState } from 'react'

// 1. Tạo Context Object
const AuthContext = createContext(null)

// 2. Custom Hook: Giúp các component dễ dàng sử dụng Context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hàm tiện ích để lấy user từ Local Storage
const getStoredUser = () => {
  const userString = localStorage.getItem('user')
  if (userString) {
    try {
      return JSON.parse(userString)
    } catch (error) {
      console.error('Lỗi parse user từ Local Storage:', error)
      return null
    }
  }
  return null
}

// 3. Provider Component: Quản lý trạng thái và Local Storage
export const AuthProvider = ({ children }) => {
  // Khởi tạo trạng thái: Kiểm tra Local Storage ngay khi component được tạo
  const initialIsLoggedIn = !!localStorage.getItem('userToken')

  // Trạng thái cục bộ: true nếu có token, false nếu không
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)

  // BỔ SUNG: State để lưu thông tin người dùng trực tiếp
  const [user, setUser] = useState(getStoredUser) // Lấy user từ localStorage khi khởi tạo

  // Hàm Đăng nhập: Lưu token và cập nhật trạng thái
  const login = (token, user) => {
    localStorage.setItem('userToken', token)

    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user) // Cập nhật state user
    }

    setIsLoggedIn(true)
  }

  // Hàm Đăng xuất: Xóa token và cập nhật trạng thái
  const logout = () => {
    console.log('ĐÃ CLICK ĐĂNG XUẤT!')
    localStorage.removeItem('currentTableId')
    localStorage.removeItem('userToken')
    localStorage.removeItem('user') // Xóa cả data người dùng
    setIsLoggedIn(false)
    setUser(null) // Xóa state user
  }

  // Tùy chọn: Hàm này đơn giản là trả về state user
  const getUser = () => user

  // Giá trị được cung cấp cho toàn bộ ứng dụng
  const contextValue = {
    isLoggedIn, // Trạng thái đăng nhập
    user, // 👈 Bổ sung: Thông tin người dùng (cho truy cập tức thời)
    login, // Hàm để component Đăng nhập gọi
    logout, // Hàm để component Header/Đăng xuất gọi
    getUser, // Hàm để truy xuất (tùy chọn nếu bạn muốn tách logic)
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
