// src/api/http.js
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor (Gửi đi)
http.interceptors.request.use(
  function (config) {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// Response Interceptor (Nhận về) - ĐÃ NÂNG CẤP
http.interceptors.response.use(
  function (response) {
    // 1. In toàn bộ header ra để soi (nếu cần)
    // console.log("Headers nhận được:", response.headers)

    // 2. Lấy token (Thử cả viết hoa và viết thường cho chắc ăn)
    const guestToken = response.headers['x-guest-token'] || response.headers['X-Guest-Token']

    if (guestToken) {
      localStorage.setItem('access_token', guestToken)
    }

    if (response && response.data) {
      return response.data
    }
    return response
  },
  function (error) {
    return Promise.reject(error)
  }
)

export default http
