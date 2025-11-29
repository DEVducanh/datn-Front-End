import React, { useMemo } from 'react'
import { Modal, List, Spin, Alert, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Receipt, ChevronRight, Calendar, DollarSign } from 'lucide-react'
import invoiceAPI from '@/apis/invoice/invoice.api'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

// Hàm lấy ID an toàn (Giữ nguyên logic này vì nó đang hoạt động tốt)
const getSafeIdString = (field) => {
  if (!field) return null;
  if (typeof field === 'object' && field._id) return String(field._id);
  if (typeof field === 'string') return field;
  return null;
}

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  const userId = useMemo(() => {
    try {
      const userString = localStorage.getItem('user')
      const id = userString ? JSON.parse(userString)._id : null
      return id ? String(id) : null;
    } catch (e) {
      return null
    }
  }, [])

  const {
    data: myInvoices = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    // Thêm userId vào key để cache riêng cho từng user
    queryKey: ['invoices', userId, 'history_all'],

    queryFn: async () => {
      if (!userId) return []

      // --- SỬA ĐOỔI 1: KHÔNG LỌC THEO STATUS NỮA ---
      // Lấy tất cả hóa đơn về (cả paid và unpaid) để hiển thị hết
      const res = await invoiceAPI.getAll({
        // Bỏ dòng status: 'completed' đi
      })

      // Chuẩn hóa data
      let data = []
      if (res && res.data && Array.isArray(res.data.data)) data = res.data.data
      else if (res && Array.isArray(res.data)) data = res.data
      else if (res && Array.isArray(res)) data = res

      // --- LỌC CLIENT-SIDE (GIỮ NGUYÊN LOGIC CHUẨN) ---
      const filteredInvoices = data.filter(invoice => {
        const invoiceOwnerId = getSafeIdString(invoice.user_id) || getSafeIdString(invoice.account_id) || getSafeIdString(invoice.userId);

        let orderOwnerId = null;
        if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0) {
          orderOwnerId = getSafeIdString(invoice.order_id[0].user_id);
        } else if (invoice.order_id) {
          orderOwnerId = getSafeIdString(invoice.order_id.user_id);
        }

        return (invoiceOwnerId === userId) || (orderOwnerId === userId);
      })

      // Sắp xếp: Mới nhất lên đầu
      return filteredInvoices.reverse();
    },
    enabled: isOpen && !!userId,
    staleTime: 0, // Luôn tải mới khi mở
    refetchOnWindowFocus: false,
  })

  const openOrderDetail = (invoice) => {
    onClose()
    navigate(`/flareon/invoices/${invoice._id}`)
  }

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-48"><Spin size="large" /></div>

    if (isError) return (
      <div className="flex justify-center p-4">
        <Alert message="Lỗi" description="Không thể tải lịch sử." type="error" showIcon />
      </div>
    )

    if (!myInvoices || myInvoices.length === 0) {
      return (
        <div className="flex justify-center items-center h-48 flex-col gap-2">
          <Receipt className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">Bạn chưa có hóa đơn nào.</p>
        </div>
      )
    }

    return (
      <List
        dataSource={myInvoices}
        renderItem={(invoice) => {
          // Xử lý tên bàn
          let tableName = 'Mang về / Khác';
          let order = null;
          if (Array.isArray(invoice.order_id) && invoice.order_id.length > 0) order = invoice.order_id[0];
          else if (invoice.order_id) order = invoice.order_id;

          if (order?.table_id?.name) tableName = order.table_id.name;
          else if (invoice.table_id?.name) tableName = invoice.table_id.name;

          const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString('vi-VN')

          // --- SỬA ĐỔI 2: HIỂN THỊ TRẠNG THÁI (PAID/UNPAID) ---
          // Backend trả về chữ thường 'paid', 'unpaid'
          let statusColor = 'default';
          let statusText = 'Chờ xử lý';

          if (invoice.status === 'paid' || invoice.status === 'Paid') {
            statusColor = 'success';
            statusText = 'Đã thanh toán';
          } else if (invoice.status === 'unpaid' || invoice.status === 'Unpaid') {
            statusColor = 'warning';
            statusText = 'Chưa thanh toán';
          } else if (invoice.status === 'cancelled') {
            statusColor = 'error';
            statusText = 'Đã hủy';
          }

          return (
            <List.Item
              onClick={() => openOrderDetail(invoice)}
              className="!p-4 hover:!bg-gray-50 !cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
              actions={[<ChevronRight key="arrow" className="text-gray-400 w-5 h-5" />]}
            >
              <List.Item.Meta
                avatar={
                  <div className="bg-orange-50 p-2 rounded-full">
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </div>
                }
                title={
                  <div className="flex justify-between items-center pr-4">
                    <span className="font-semibold text-gray-800">{`Hóa đơn tại ${tableName}`}</span>
                    <Tag color={statusColor} className="mr-0">{statusText}</Tag>
                  </div>
                }
                description={
                  <div className="flex flex-col mt-2 gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} /> {date}
                    </div>
                    <div className="flex items-center gap-2 font-bold text-orange-600 text-base">
                      <DollarSign size={14} /> {formatVnd(invoice.total_amount)}
                    </div>
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