// src/components/OrderHistoryModal/index.jsx
import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert } from 'antd'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'
import { Receipt, ChevronRight } from 'lucide-react'

// Hàm format tiền
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  // Lấy userId từ localStorage
  const userId = useMemo(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString)._id : null
    } catch (e) {
      return null
    }
  }, [])

  // Query để lấy lịch sử hóa đơn (chỉ chạy khi modal mở)
  const {
    data: completedInvoices = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invoices', userId, 'completed'],
    queryFn: async () => {
      if (!userId) return []
      const res = await http.get(`/invoices?status=completed`)

      // Xử lý các cấu trúc API khác nhau
      if (res && res.data && Array.isArray(res.data.data)) return res.data.data
      if (res && Array.isArray(res.data)) return res.data
      if (res && Array.isArray(res)) return res

      return []
    },
    enabled: isOpen && !!userId, // Chỉ chạy khi modal mở và có userId
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // Hàm chuyển đến trang chi tiết
  const openOrderDetail = (invoice) => {
    onClose() // Đóng modal
    navigate(`/flareon/invoices/${invoice._id}`)
  }

  // Hàm render nội dung modal
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Spin size="large" />
        </div>
      )
    }

    if (isError) {
      return (
        <Alert
          message="Lỗi"
          description={error?.message || 'Không thể tải lịch sử hóa đơn.'}
          type="error"
          showIcon
        />
      )
    }

    if (completedInvoices.length === 0) {
      return (
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">Bạn chưa có hóa đơn nào đã hoàn thành.</p>
        </div>
      )
    }

    // Giao diện List ĐÃ THIẾT KẾ LẠI
    return (
      <List
        dataSource={completedInvoices}
        renderItem={(invoice) => {
          const order = invoice.order_id || {}
          const tableName = order.table_id?.name || 'Bàn không xác định'
          const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString('vi-VN')

          return (
            <List.Item
              onClick={() => openOrderDetail(invoice)}
              className="!p-4 hover:!bg-gray-50 !cursor-pointer"
              actions={[<ChevronRight className="text-gray-400" />]}
            >
              <List.Item.Meta
                avatar={<Receipt className="w-6 h-6 text-orange-500 mt-1" />}
                title={
                  <span className="font-semibold text-base">{`Hóa đơn tại ${tableName}`}</span>
                }
                description={
                  <div className="flex justify-between items-center w-full">
                    <span>{date}</span>
                    <span className="font-bold text-red-600 text-base">
                      {formatVnd(invoice.total_amount)}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )
        }}
      />
    )
  }

  return (
    <Modal
      title="🧾 Lịch sử hóa đơn (Đã hoàn thành)"
      open={isOpen}
      onCancel={onClose}
      footer={null} // Không cần footer
      width={600} // Thu hẹp modal lại
    >
      <div className="max-h-[60vh] overflow-y-auto mt-6">{renderContent()}</div>
    </Modal>
  )
}

export default OrderHistoryModal
