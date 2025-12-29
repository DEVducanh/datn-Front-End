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

  const login = (token, userData, isRealUser = false) => {
    // 1. LƯU THÔNG TIN ĐĂNG NHẬP
    if (isRealUser) {
      localStorage.setItem('userToken', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Xóa data guest cũ để tránh lẫn lộn
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('guest_info')
    } else {
      localStorage.setItem('access_token', token)
      localStorage.setItem('user_info', JSON.stringify(userData))
      localStorage.setItem('guest_info', JSON.stringify(userData))
    }

    // 2. QUAN TRỌNG: LUÔN TẠO MỐC THỜI GIAN (SESSION START)
    // Nếu chưa có mốc thời gian (người mới vào), thì tạo mốc BÂY GIỜ.
    // Nếu đã có (vừa F5 lại trang), thì GIỮ NGUYÊN để không mất đơn vừa gọi.
    if (!localStorage.getItem('sessionStartTime')) {
      const now = Date.now().toString()
      console.log('LOGIN: Tạo session mới tại:', new Date(parseInt(now)).toLocaleTimeString())
      localStorage.setItem('sessionStartTime', now)
    }

    setUser(userData)
    setIsLoggedIn(true)
  }

  const logout = async () => {
    console.log('LOGOUT: Đang xóa session...')
    const currentTableId = localStorage.getItem('currentTableId')

    if (currentTableId) {
      try {
        await http.patch(`/tables/${currentTableId}`, { status: 'Available' })
      } catch (error) {
        console.error('Lỗi trả bàn:', error)
      }
    }

    // XÓA SẠCH MỌI THỨ
    localStorage.clear()

    // Đảm bảo xóa luôn sessionStartTime
    localStorage.removeItem('sessionStartTime')

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
