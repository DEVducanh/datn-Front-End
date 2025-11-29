import { createContext, useContext, useState, useEffect } from 'react'
import http from '@/apis/http' // 1. Import http để gọi API

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const getStoredUser = () => {
  try {
    const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
    if (userString && userString !== 'undefined') return JSON.parse(userString)
  } catch (error) { return null }
}

const getStoredToken = () => {
  return localStorage.getItem('userToken') || localStorage.getItem('access_token')
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredToken())

  const login = (token, userData, isRealUser = false) => {
    if (isRealUser) {
      localStorage.setItem('userToken', token)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    } else {
      localStorage.setItem('access_token', token)
      localStorage.setItem('user_info', JSON.stringify(userData))
    }
    setUser(userData)
    setIsLoggedIn(true)
  }

  // --- 2. SỬA HÀM LOGOUT ---
  const logout = async () => {
    console.log('ĐANG ĐĂNG XUẤT & TRẢ BÀN...')

    // Lấy ID bàn hiện tại trước khi xóa Storage
    const currentTableId = localStorage.getItem('currentTableId');

    // Nếu đang ngồi bàn -> Gọi API cập nhật trạng thái bàn thành 'Available'
    if (currentTableId) {
      try {
        // Gọi API update bàn (Dựa theo Swagger của bạn: PATCH /tables/:id)
        await http.patch(`/tables/${currentTableId}`, {
          status: 'Available'
        });
        console.log(`Đã trả bàn ${currentTableId} về trạng thái Trống.`);
      } catch (error) {
        console.error("Lỗi khi trả bàn:", error);
      }
    }

    // Sau đó mới xóa dữ liệu local
    localStorage.clear()
    setIsLoggedIn(false)
    setUser(null)
    window.location.href = '/flareon/login'
  }

  useEffect(() => {
    const token = getStoredToken()
    const userData = getStoredUser()
    if (token && !isLoggedIn) setIsLoggedIn(true)
    if (userData && !user) setUser(userData)
  }, [])

  const contextValue = { isLoggedIn, user, login, logout, getUser: () => user }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}