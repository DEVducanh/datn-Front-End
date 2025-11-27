import http from '../http'

const authAPI = {
  // 1. Đăng nhập Admin/Staff (Giữ nguyên)
  login: (data) => {
    return http.post('/auth/login', data)
  },

  // 2. Đăng ký (Giữ nguyên)
  register: (data) => {
    return http.post('/auth/register', data)
  },

  // 3. CẬP NHẬT THÔNG TIN KHÁCH HÀNG (GUEST)
  guestLogin: (data) => {
    // data từ form gồm: { name, phone, table_id }
    // Backend yêu cầu: { username, phone }
    return http.post('/auth/guest/update', {
        username: data.name, // Map 'name' sang 'username'
        phone: data.phone
    })
  }
}

export default authAPI