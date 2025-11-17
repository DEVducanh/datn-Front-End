import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Spin, Alert } from 'antd'
import ReviewModal from '@/layouts/DefaultLayout/components/ReviewModal'
import OrderItemsList from '@/layouts/DefaultLayout/components/OrderItemsList'

// Hàm format tiền
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

// --- COMPONENT TRANG CHÍNH ---
const InvoiceDetailPage = () => {
  const { id: invoiceId } = useParams()

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState(null) // { dishId, orderId, dishName }

  // 1. GỌI API 1: Lấy chi tiết Hóa đơn (Giữ nguyên)
  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await http.get(`/invoices/${invoiceId}`)
      console.log('API /invoices/ trả về (res):', res)
      // Xử lý data nằm trong res.data hoặc res trực tiếp
      const responseData = res?.data || res
      if (responseData && responseData._id) return responseData
      throw new Error('Không tìm thấy dữ liệu hóa đơn.')
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5,
  })

  // Hàm mở Modal (truyền xuống OrderItemsList)
  const handleOpenReviewModal = (dishId, orderId, dishName) => {
    setSelectedDish({ dishId, orderId, dishName })
    setIsModalOpen(true)
  }

  // Hàm đóng Modal (truyền xuống ReviewModal)
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDish(null)
  }

  // (Phần Loading / Error / Empty của API 1 giữ nguyên)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spin size="large" />
        <p className="ml-4 text-lg">Đang tải chi tiết hóa đơn...</p>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-4 my-8">
        <Alert
          type="error"
          message="Lỗi"
          description={error?.message || 'Không thể tải hóa đơn. Vui lòng thử lại.'}
          showIcon
        />
        <p className="text-sm mt-2 text-gray-500">Chi tiết lỗi: {error?.message}</p>
      </div>
    )
  }
  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto p-4 my-8">
        <Alert type="warning" message="Không tìm thấy hóa đơn" showIcon />
      </div>
    )
  }

  // (Phần chuẩn bị data )
  // Cập nhật cách lấy thông tin từ cấu trúc API mới
  const tableName = invoice.table?.name || 'Bàn không xác định'
  const createdDate = new Date(invoice.created_at || Date.now()).toLocaleString('vi-VN')

  return (
    <div className="bg-gray-50 py-12 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg border">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Chi tiết Hóa đơn</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Mã HĐ: <span className="font-mono">{invoice._id}</span>
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-600">Ngày tạo:</p>
            <p className="font-semibold">{createdDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Bàn:</p>
            <p className="font-semibold">{tableName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phương thức TT:</p>
            <p className="font-semibold">{invoice.payment?.method || 'Chưa rõ'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Trạng thái:</p>
            <p className="font-semibold text-green-600 uppercase">{invoice.status || 'PAID'}</p>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-4 text-orange-600">Chi tiết đơn hàng</h2>

        {/* ⭐ CHỖ SỬA LỖI CÚ PHÁP: Đảm bảo component được đóng đúng cú pháp */}
        {invoice.order_item && Array.isArray(invoice.order_item) ? (
          <OrderItemsList
            orderItemsData={invoice.order_item}
            // Sử dụng ID HÓA ĐƠN làm orderId để tránh nhầm lẫn khi đánh giá
            orderId={invoice._id}
            onOpenReview={handleOpenReviewModal}
          />
        ) : (
          <p className="text-gray-500">Không tìm thấy mã đơn hàng liên kết.</p>
        )}

        {/* (Phần tổng kết tiền ) */}
        <div className="mt-6 pt-6 border-t-2 border-dashed">
          <div className="flex justify-between items-center text-3xl font-bold text-red-600">
            <span>Tổng cộng:</span>
            <span>{formatVnd(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* --- Gọi Component ReviewModal --- */}
      <ReviewModal isOpen={isModalOpen} onClose={handleCloseModal} selectedDish={selectedDish} />
    </div>
  )
}

export default InvoiceDetailPage
