import http from '@/apis/http' // Hãy chắc chắn đường dẫn này đúng với dự án của bạn

const invoiceAPI = {
  // Lấy tất cả hóa đơn (có thể truyền params ?phone=... hoặc ?status=...)
  getAll: async (params = {}) => {
    try {
      const url = '/invoices'
      const res = await http.get(url, { params })
      return res
    } catch (error) {
      console.error('Lỗi lấy danh sách hóa đơn:', error)
      return []
    }
  },

  // Lấy chi tiết 1 hóa đơn
  getById: async (id) => {
    try {
      const url = `/invoices/${id}`
      const res = await http.get(url)
      return res
    } catch (error) {
      console.error('Lỗi lấy chi tiết hóa đơn:', error)
      throw error
    }
  },
}

export default invoiceAPI
