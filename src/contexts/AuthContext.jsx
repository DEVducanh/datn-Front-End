import { createContext, useContext, useState, useEffect } from 'react'

// 1. Tạo Context Object
const AuthContext = createContext(null)

// 2. Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hàm tiện ích lấy user (Hỗ trợ cả user thường và user_info của khách)
const getStoredUser = () => {
  try {
    // Ưu tiên lấy 'user' (admin/staff), nếu không có thì lấy 'user_info' (khách)
    const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
    if (userString && userString !== 'undefined') {
      return JSON.parse(userString)
    }
  } catch (error) {
    console.error('Lỗi parse user:', error)
  }
  return null
}

// Hàm tiện ích lấy token
const getStoredToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('userToken') || localStorage.getItem('token')
}

// 3. Provider Component
export const AuthProvider = ({ children }) => {
  // Khởi tạo state từ localStorage
  const [user, setUser] = useState(getStoredUser)
  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredToken())

  // Hàm Đăng nhập (Dùng chung cho cả Admin và Khách)
  const login = (token, userData) => {
    // 1. Lưu token chuẩn vào access_token
    localStorage.setItem('access_token', token)
    // (Giữ lại userToken để tương thích code cũ nếu cần)
    localStorage.setItem('userToken', token)

    // 2. Lưu thông tin user
    if (userData) {
      // Lưu vào cả 2 key để đảm bảo code cũ/mới đều chạy
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('user_info', JSON.stringify(userData))
      setUser(userData)
    }

    setIsLoggedIn(true)
  }

  // Hàm Đăng xuất
  const logout = () => {
    console.log('ĐÃ ĐĂNG XUẤT')
    // Xóa sạch mọi dấu vết
    localStorage.removeItem('access_token')
    localStorage.removeItem('userToken')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_info')
    localStorage.removeItem('currentTableId') // Xóa luôn mã bàn để reset

    setIsLoggedIn(false)
    setUser(null)

    // Reload trang để reset toàn bộ state của ứng dụng
    window.location.href = '/flareon'
  }

  // useEffect để đồng bộ state nếu localStorage bị thay đổi bên ngoài
  useEffect(() => {
    const token = getStoredToken()
    const userData = getStoredUser()

    if (token && !isLoggedIn) {
      setIsLoggedIn(true)
    }
    if (userData && !user) {
      setUser(userData)
    }
  }, [])

  const getUser = () => user

  const contextValue = {
    isLoggedIn,
    user,
    login,
    logout,
    getUser,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}