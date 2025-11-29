import { createContext, useContext, useState, useEffect } from 'react'
import http from '@/apis/http'

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
    if (userString && userString !== 'undefined') {
      return JSON.parse(userString)
    }
  } catch (error) {
    return null
  }
}

const getStoredToken = () => {
  return localStorage.getItem('userToken') || localStorage.getItem('access_token')
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredToken())

  // --- SỬA HÀM LOGIN: LƯU THỜI GIAN BẮT ĐẦU PHIÊN ---
  const login = (token, userData, isRealUser = false) => {
    if (isRealUser) {
      // 1. ĐĂNG NHẬP TÀI KHOẢN THẬT (Admin/Member)
      localStorage.setItem('userToken', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Xóa chế độ Guest
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')

      // QUAN TRỌNG: Xóa mốc thời gian session để xem được toàn bộ lịch sử
      localStorage.removeItem('sessionStartTime')
    } else {
      // 2. ĐĂNG NHẬP KHÁCH VÃNG LAI (Guest)
      localStorage.setItem('access_token', token)
      localStorage.setItem('user_info', JSON.stringify(userData))

      // QUAN TRỌNG: Lưu lại thời điểm bắt đầu ngồi vào bàn
      // Để sau này chỉ hiện hóa đơn từ thời điểm này trở đi
      if (!localStorage.getItem('sessionStartTime')) {
        localStorage.setItem('sessionStartTime', Date.now().toString())
      }
    }

    setUser(userData)
    setIsLoggedIn(true)
  }

  const logout = async () => {
    console.log('ĐANG ĐĂNG XUẤT & TRẢ BÀN...')
    const currentTableId = localStorage.getItem('currentTableId');

    if (currentTableId) {
      try {
        await http.patch(`/tables/${currentTableId}`, { status: 'Available' });
      } catch (error) {
        console.error("Lỗi khi trả bàn:", error);
      }
    }

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