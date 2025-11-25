import http from '@/apis/http'

const chefAPI = {
  // Lấy tất cả đơn hàng (Sau đó frontend sẽ lọc ra các đơn chưa hoàn thành)
  getAllOrders: () => http.get('/orders'),

  // Lấy chi tiết món ăn trong 1 đơn hàng (để hiển thị list món cần nấu)
  getOrderItems: (orderId) => http.get(`/order-item/order/${orderId}`),

  // Cập nhật trạng thái của MỘT MÓN ĂN (Quan trọng nhất)
  // status có thể là: 'Pending', 'Cooking', 'Completed', 'Served', v.v... tùy backend quy định
  updateOrderItemStatus: (itemId, status) => http.patch(`/order-item/${itemId}/status`, { status }),
}

export default chefAPI
