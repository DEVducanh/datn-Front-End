import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router' // Thêm useLocation
import { Receipt, ChevronRight } from 'lucide-react'
import invoiceAPI from '@/apis/invoice/invoice.api'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

// Hàm lấy ID an toàn
const getSafeIdString = (field) => {
  if (!field) return null
  if (typeof field === 'object' && field._id) return String(field._id)
  if (typeof field === 'string') return field
  return null
}

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation() // Hook để lấy URL hiện tại

  // 1. Lấy userId từ localStorage
  const userId = useMemo(() => {
    try {
      const userString = localStorage.getItem('user')
      const id = userString ? JSON.parse(userString)._id : null
      return id ? String(id) : null
    } catch (e) {
      return null
    }
  }, [])

  const tableId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('table_id') || 'unknown_table'
  }, [location.search])

  const {
    data: completedInvoices = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invoices', userId, tableId, 'history_realtime'],

    queryFn: async () => {
      if (!userId) return []

      const res = await invoiceAPI.getAll({ status: 'completed' })

      let data = []
      if (res && res.data && Array.isArray(res.data.data)) data = res.data.data
      else if (res && Array.isArray(res.data)) data = res.data
      else if (res && Array.isArray(res)) data = res

      // Lọc Client-side (Logic chuẩn)
      const myInvoices = data.filter((invoice) => {
        const invoiceOwnerId =
          getSafeIdString(invoice.user_id) ||
          getSafeIdString(invoice.account_id) ||
          getSafeIdString(invoice.userId)

        let orderOwnerId = null
        if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0) {
          orderOwnerId = getSafeIdString(invoice.order_id[0].user_id)
        } else if (invoice.order_id) {
          orderOwnerId = getSafeIdString(invoice.order_id.user_id)
        }

        return invoiceOwnerId === userId || orderOwnerId === userId
      })

      return myInvoices.reverse()
    },
    enabled: isOpen && !!userId,
    staleTime: 0, // QUAN TRỌNG: Luôn coi dữ liệu là cũ, bắt buộc tải mới mỗi khi mở Modal
    gcTime: 0, // (Hoặc cacheTime cũ) Không lưu cache khi đóng modal
    refetchOnWindowFocus: true, // Tự tải lại khi quay lại tab
  })
  const openOrderDetail = (invoice) => {
    onClose()
    navigate(`/flareon/invoices/${invoice._id}`)
  }

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
          <Alert message="Lỗi tải dữ liệu" type="error" showIcon />
        </div>
      )
    }

    if (!completedInvoices || completedInvoices.length === 0) {
      return (
        <div className="flex justify-center items-center h-48 flex-col gap-2">
          <Receipt className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">Bạn chưa có hóa đơn nào.</p>
        </div>
      )
    }

    return (
      <List
        dataSource={completedInvoices}
        renderItem={(invoice) => {
          let tableName = 'Mang về / Khác'
          let order = null
          if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0)
            order = invoice.order_id[0]
          else if (invoice.order_id) order = invoice.order_id

          if (order?.table_id?.name) tableName = order.table_id.name
          else if (invoice.table_id?.name) tableName = invoice.table_id.name

          const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString('vi-VN')

          return (
            <List.Item
              onClick={() => openOrderDetail(invoice)}
              className="!p-4 hover:!bg-gray-50 !cursor-pointer border-b border-gray-100 last:border-0 transition-colors group"
              actions={[
                <ChevronRight
                  key="arrow"
                  className="text-gray-400 w-5 h-5 group-hover:text-orange-500 transition-colors"
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="bg-orange-50 p-2 rounded-full group-hover:bg-orange-100 transition-colors">
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
      <div className="max-h-[60vh] overflow-y-auto mt-4 custom-scrollbar">{renderContent()}</div>
    </Modal>
  )
}
export default OrderHistoryModal
