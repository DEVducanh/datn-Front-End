import http from '@/apis/http'

const reviewAPI = {
  // Tạo đánh giá mới (Dùng khi khách Submit)
  create: (payload) => http.post('/reviews', payload),

  // Lấy danh sách đánh giá theo món ăn (Dùng để hiển thị)
  getByDish: (dishId) => http.get(`/reviews/dish/${dishId}`),
}

export default reviewAPI
