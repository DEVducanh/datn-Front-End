// Nội dung file: src/apis/feedback/feedback.api.js (Frontend)
import http from '@/apis/http'

const feedbackAPI = {
  // GET /feedback (Lấy tất cả feedback)
  getAll: (params) => http.get('/feedback', { params }),

  // GET /feedback/:id (Lấy chi tiết 1 feedback)
  getOne: (id) => http.get(`/feedback/${id}`),

  // PATCH /feedback/:id/status (Cập nhật trạng thái)
  updateStatus: (id, statusPayload) => http.patch(`/feedback/${id}/status`, statusPayload),

  // DELETE /feedback/:id (Xóa feedback)
  delete: (id) => http.delete(`/feedback/${id}`),

  // POST /feedback/:feedback_id/response (Admin phản hồi)
  createResponse: (feedbackId, responsePayload) =>
    http.post(`/feedback/${feedbackId}/response`, responsePayload),

  // GET /feedback/:feedback_id/responses (Lấy các phản hồi của 1 feedback)
  getResponses: (feedbackId) => http.get(`/feedback/${feedbackId}/responses`),
}

export default feedbackAPI