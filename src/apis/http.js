import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api-datn-orderfood-backend-2.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
http.interceptors.request.use(
  function (config) {
    // --- THỨ TỰ ƯU TIÊN QUAN TRỌNG ---
    // 1. Ưu tiên 'userToken' (Tài khoản thật)
    // 2. Sau đó mới đến 'access_token' (Khách vãng lai)
    const token = localStorage.getItem('userToken') || localStorage.getItem('access_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// Response Interceptor (Giữ nguyên logic bắt Guest Token)
http.interceptors.response.use(
  function (response) {
    // Chỉ bắt Guest Token nếu chưa có User Token (để tránh ghi đè tài khoản thật)
    const guestToken = response.headers['x-guest-token'] || response.headers['X-Guest-Token'];
    const hasRealUser = localStorage.getItem('userToken');

    if (guestToken && !hasRealUser) {
      // console.log("🔥 Guest Token:", guestToken)
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