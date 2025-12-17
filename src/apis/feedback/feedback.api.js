import http from '@/apis/http'

const feedbackAPI = {
  // 1. Gửi đánh giá mới (POST /feedback)
  create: (payload) => http.post('/feedback', payload),

  // 2. Lấy đánh giá theo món ăn (GET /feedback/dish/:dishId)
  // LƯU Ý: Bạn cần chắc chắn Backend đã có route này.
  // Nếu Backend chưa có, bạn phải vào FeedbackController viết thêm hàm getByDish.
  getByDish: (dishId) => http.get(`/feedback/dish/${dishId}`),

  // ... các hàm cũ khác (getAll, delete...) cứ giữ nguyên
}

export default feedbackAPI
