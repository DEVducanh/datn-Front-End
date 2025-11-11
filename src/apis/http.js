// src/api/http.js
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api-datn-orderfood-backend-2.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor (SỬA LỖI JSON.PARSE)
http.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      // config.headers['Authorization'] = `Bearer ${JSON.parse(token)}`
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

// Add a response interceptor (SỬA LỖI MÀN HÌNH TRẮNG KHI API 204)
http.interceptors.response.use(
  function (response) {
    // <-- 3. Nhận 'response' đầy đủ
    // 4. Chỉ trả về 'response.data' NẾU 'response' tồn tại
    if (response) {
      return response.data
    }
    return response // Trả về an toàn
  },
  function (error) {
    return Promise.reject(error)
  }
)

export default http
