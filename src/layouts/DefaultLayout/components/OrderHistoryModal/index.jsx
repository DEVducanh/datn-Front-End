import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Receipt, ChevronRight } from 'lucide-react'

import invoiceAPI from '@/apis/invoice/invoice.api'

// Hàm format tiền
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  // 1. Lấy userId từ localStorage
  const userId = useMemo(() => {
    try {
      const userString = localStorage.getItem('user')
      return userString ? JSON.parse(userString)._id : null
    } catch (e) {
      return null
    }
  }, [])

  // 2. Query để lấy lịch sử hóa đơn
  const {
    data: completedInvoices = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    // Thêm userId vào queryKey để khi user thay đổi thì nó tự load lại
    queryKey: ['invoices', userId, 'completed'],

    queryFn: async () => {
      if (!userId) return []
      const res = await invoiceAPI.getAll({
        status: 'completed',
        user_id: userId // Lọc theo ID người dùng
      })
     

      // Xử lý các cấu trúc API khác nhau trả về
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
    onClose()
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
        <div className="flex justify-center p-4">
          <Alert
            message="Lỗi tải dữ liệu"
            description={error?.message || 'Không thể tải lịch sử hóa đơn.'}
            type="error"
            showIcon
          />
        </div>
      )
    }

    if (!completedInvoices || completedInvoices.length === 0) {
      return (
        <div className="flex justify-center items-center h-48 flex-col gap-2">
          <Receipt className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">Bạn chưa có hóa đơn nào đã hoàn thành.</p>
        </div>
      )
    }

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
              className="!p-4 hover:!bg-gray-50 !cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
              actions={[<ChevronRight key="arrow" className="text-gray-400 w-5 h-5" />]}
            >
              <List.Item.Meta
                avatar={
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </div>
                }
                title={
                  <span className="font-semibold text-gray-800">{`Hóa đơn tại ${tableName}`}</span>
                }
                description={
                  <div className="flex flex-col mt-1 gap-1">
                    <span className="text-xs text-gray-500">{date}</span>
                    <span className="font-bold text-orange-600 text-sm">
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
      title={<span className="text-lg font-bold">🧾 Lịch sử hóa đơn</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="rounded-lg overflow-hidden"
    >
      <div className="max-h-[60vh] overflow-y-auto mt-4 custom-scrollbar">
        {renderContent()}
      </div>
    </Modal>
  )
}

export default OrderHistoryModal
