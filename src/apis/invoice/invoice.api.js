// src/apis/invoice/invoice.api.js (CẬP NHẬT)
import http from '../http' // Giả sử đã sửa đường dẫn tương đối

const invoiceAPI = {

    getAll: async () => {
        try {
            const url = '/invoices'
            const responseData = await http.get(url)
            return responseData
        } catch (error) {
            console.error('Lỗi khi tải danh sách hóa đơn:', error)
            throw error
        }
    },

    /**
     * @route GET /invoices/{id}
     * @description Lấy chi tiết một hóa đơn
     * @param {string} id ID của hóa đơn
     * @returns {Promise<any>} Dữ liệu chi tiết hóa đơn
     */
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