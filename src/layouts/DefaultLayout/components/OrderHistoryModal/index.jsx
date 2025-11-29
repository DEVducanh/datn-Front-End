import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert, Button, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router'
import { Receipt, RefreshCw } from 'lucide-react'
import invoiceAPI from '@/apis/invoice/invoice.api'

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

  const userId = useMemo(() => {
    try {
      const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
      if (userString) {
        const u = JSON.parse(userString)
        return u._id || u.id
      }
    } catch (e) { }
    return null
  }, [])

  const tableId = useMemo(() => {
    return localStorage.getItem('currentTableId') || new URLSearchParams(location.search).get('table_id')
  }, [location.search])

  const {
    data: completedInvoices = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['invoices', userId, tableId, 'history_fixed_time'],

    queryFn: async () => {
      const res = await invoiceAPI.getAll({ status: 'completed' })

      let data = []
      if (res?.data?.data) data = res.data.data
      else if (Array.isArray(res?.data)) data = res.data
      else if (Array.isArray(res)) data = res

      // A. Kiểm tra User Thật
      const isRealUser = !!localStorage.getItem('userToken');

      // B. Lấy mốc thời gian
      const sessionStartTime = localStorage.getItem('sessionStartTime');

      const myInvoices = data.filter((invoice) => {
        // 1. Lọc theo Chủ sở hữu
        const invoiceOwnerId = getSafeIdString(invoice.user_id) || getSafeIdString(invoice.account_id)
        if (userId && invoiceOwnerId !== userId) return false;

        // 2. Lọc theo Thời gian (SỬA LẠI LOGIC CHO GUEST)
        if (!isRealUser && sessionStartTime) {
          const invoiceTime = new Date(invoice.createdAt || invoice.created_at).getTime();
          const sessionTime = parseInt(sessionStartTime);

          // --- SỬA Ở ĐÂY: THÊM BUFFER 60 PHÚT ---
          // Cho phép sai số thời gian hoặc trường hợp tạo đơn ngay sát lúc đăng nhập
          // (Trừ hao 1 tiếng cho chắc ăn)
          const bufferTime = 60 * 60 * 1000;

          if (invoiceTime < (sessionTime - bufferTime)) {
            return false; // Chỉ ẩn nếu hóa đơn quá cũ (cách đây hơn 1 tiếng so với lúc ngồi vào)
          }
        }

        return true;
      })

      return myInvoices.reverse()
    },

    enabled: isOpen,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const openOrderDetail = (invoice) => {
    onClose()
    navigate(`/flareon/invoices/${invoice._id}`)
  }

  const renderContent = () => {
    if (isLoading && !isRefetching && completedInvoices.length === 0) {
      return <div className="flex justify-center p-10"><Spin tip="Đang tải..." /></div>
    }

    if (isError) return <div className="p-4 text-center text-red-500">Lỗi tải dữ liệu</div>

    if (completedInvoices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-gray-400">
          <Receipt size={48} strokeWidth={1} />
          <span>Chưa có hóa đơn nào trong phiên này</span>
          <Button icon={<RefreshCw size={14} />} onClick={() => refetch()}>Tải lại</Button>
        </div>
      )
    }

    return (
      <List
        dataSource={completedInvoices}
        renderItem={(invoice) => {
          const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
          })

          // Màu trạng thái
          let statusColor = 'default';
          let statusText = 'Chờ thanh toán';
          const status = (invoice.status || '').toLowerCase();

          if (status === 'paid') {
            statusColor = 'success'; statusText = 'Đã thanh toán';
          } else if (status === 'unpaid') {
            statusColor = 'warning'; statusText = 'Chưa thanh toán';
          }

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
                    <div className="font-semibold text-gray-800">Hóa đơn #{invoice._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-gray-500">{date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{formatVnd(invoice.total_amount)}</div>
                  <Tag color={statusColor} className="mr-0 mt-1 text-[10px]">{statusText}</Tag>
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
          <Button type="text" icon={<RefreshCw size={18} />} onClick={() => refetch()} loading={isRefetching} />
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