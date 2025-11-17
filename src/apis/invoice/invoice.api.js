import http from '../http'

const invoiceAPI = {
  /**
   * @param {object} params - Các tham số lọc (ví dụ: { user_id: '123', status: 'completed' })
   */
  getAll: async (params = {}) => {
    try {
      const url = '/invoices'
      // QUAN TRỌNG: Truyền params vào đây để axios tạo thành chuỗi ?user_id=...&status=...
      const responseData = await http.get(url, { params })
      return responseData
    } catch (error) {
      console.error('Lỗi khi tải danh sách hóa đơn:', error)
      throw error
    }
  },

  getById: async (id) => {
    if (!id) throw new Error('Invoice ID must be provided')
    try {
      const url = `/invoices/${id}`
      const responseData = await http.get(url)
      return responseData
    } catch (error) {
      console.error(`Lỗi khi tải chi tiết hóa đơn ${id}:`, error)
      throw error
    }
  }
}

export default invoiceAPI