import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert, Button, Empty, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router'
import { Receipt, ChevronRight, RefreshCw } from 'lucide-react'
import invoiceAPI from '@/apis/invoice/invoice.api'
import { jwtDecode } from 'jwt-decode'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const getSafeIdString = (field) => {
  if (!field) return null
  if (typeof field === 'object' && field._id) return String(field._id)
  if (typeof field === 'string') return field
  return null
}

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Lấy User ID từ Token
  const userId = useMemo(() => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        const decoded = jwtDecode(token)
        return decoded._id || decoded.id || decoded.sub
      }
    } catch (e) {
      console.error('Lỗi decode token:', e)
    }
    return null
  }, [])

  // 2. Lấy Table ID (cho khách vãng lai)
  const tableId = useMemo(() => {
    const localTableId = localStorage.getItem('currentTableId')
    if (localTableId) return localTableId

    const params = new URLSearchParams(location.search)
    return params.get('table_id')
  }, [location.search])

  const {
    data: completedInvoices = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['invoices', userId, tableId, 'history_token_mode'],

    queryFn: async () => {
      console.log('🚀 Tải lịch sử...')
      console.log('- User ID (Token):', userId)
      console.log('- Table ID:', tableId)

      // Gọi API lấy hóa đơn hoàn thành
      const res = await invoiceAPI.getAll({ status: 'completed' })

      let data = []
      if (res?.data?.data) data = res.data.data
      else if (Array.isArray(res?.data)) data = res.data
      else if (Array.isArray(res)) data = res

      // Lọc thông minh
      const myInvoices = data.filter((invoice) => {
        const invoiceOwnerId =
          getSafeIdString(invoice.user_id) ||
          getSafeIdString(invoice.account_id)

        let orderOwnerId = null
        if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0) {
          orderOwnerId = getSafeIdString(invoice.order_id[0]?.user_id)
        }

        if (userId && (invoiceOwnerId === userId || orderOwnerId === userId)) {
          return true
        }

        // Lọc theo bàn
        const invTableId = getSafeIdString(invoice.table_id)

        let orderTableId = null
        if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0) {
          orderTableId = getSafeIdString(invoice.order_id[0]?.table_id)
        }

        if (tableId && (invTableId === tableId || orderTableId === tableId)) {
          return true
        }

        return false
      })

      console.log(`✅ Tìm thấy ${myInvoices.length} hóa đơn.`)
      return myInvoices.reverse()
    },

    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  })

  const openOrderDetail = (invoice) => {
    onClose()
    navigate(`/flareon/invoices/${invoice._id}`)
  }

  const renderContent = () => {
    if (isLoading && !isRefetching && completedInvoices.length === 0) {
      return (
        <div className="flex justify-center p-10">
          <Spin tip="Đang tải..." />
        </div>
      )
    }

    if (isError)
      return <div className="p-4 text-center text-red-500">Lỗi tải dữ liệu</div>

    if (completedInvoices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-gray-400">
          <Receipt size={48} strokeWidth={1} />
          <span>Chưa có hóa đơn nào tại đây</span>
          <Button icon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Tải lại
          </Button>
        </div>
      )
    }

    return (
      <List
        dataSource={completedInvoices}
        renderItem={(invoice) => {
          const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString(
            'vi-VN',
            {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            }
          )

          return (
            <List.Item
              onClick={() => openOrderDetail(invoice)}
              className="!px-4 !py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 p-2 rounded-full">
                    <Receipt className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      Hóa đơn #{invoice._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">{date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-orange-600">
                    {formatVnd(invoice.total_amount)}
                  </div>
                  <Tag color="success" className="mr-0 mt-1 text-[10px]">
                    Thành công
                  </Tag>
                </div>
              </div>
            </List.Item>
          )
        }}
      />
    )
  }

  return (
    <Modal
      title={
        <div className="flex justify-between items-center pr-8">
          <span className="text-lg font-bold">Lịch sử hóa đơn</span>
          <Button
            type="text"
            icon={<RefreshCw size={18} />}
            onClick={() => refetch()}
            loading={isRefetching}
          />
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
    >
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar -mx-6">
        {renderContent()}
      </div>
    </Modal>
  )
}

export default OrderHistoryModal
