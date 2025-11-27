import React from 'react'
import { Modal, Table, Spin, Tag, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const OrderDetailModal = ({ open, onCancel, tableId, tableName }) => {
  // 1. GỌI API LẤY THÔNG TIN ĐƠN HÀNG
  const { data: activeOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['currentOrderInfo', tableId],
    queryFn: async () => {
      if (!tableId) return null
      const res = await http.get(`/orders/by-table/${tableId}`)

      let data = res.data || res
      // Tìm đơn hàng đang hoạt động
      if (Array.isArray(data)) {
        return data.find((o) => !['Completed', 'Cancelled', 'Paid'].includes(o.status)) || null
      }
      return data
    },
    enabled: !!tableId && open,
  })

  const activeOrderId = activeOrder?._id
  // Lấy user_id (có thể là string hoặc object)
  const userIdRaw = activeOrder?.user_id || activeOrder?.user

  // 2. GỌI API LẤY THÔNG TIN USER (NẾU user_id LÀ CHUỖI)
  const { data: userInfo } = useQuery({
    queryKey: ['userInfo', userIdRaw],
    queryFn: async () => {
      // Nếu userIdRaw là object (đã populate) hoặc không tồn tại -> bỏ qua
      if (!userIdRaw || typeof userIdRaw === 'object') return null

      // Nếu là string ID, gọi API lấy chi tiết user
      try {
        console.log('Đang lấy thông tin khách hàng ID:', userIdRaw)
        // Giả sử API lấy user là /users/:id
        const res = await http.get(`/users/${userIdRaw}`)
        return res.data || res
      } catch (e) {
        console.error('Lỗi lấy tên khách:', e)
        return null
      }
    },
    // Chỉ chạy khi userIdRaw là một chuỗi ID
    enabled: !!userIdRaw && typeof userIdRaw === 'string' && open,
  })

  // 3. GỌI API LẤY DANH SÁCH MÓN
  const { data: orderItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['currentOrderItems', activeOrderId],
    queryFn: async () => {
      if (!activeOrderId) return []
      const res = await http.get(`/order-item/order/${activeOrderId}`)

      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      if (Array.isArray(res)) return res

      return []
    },
    enabled: !!activeOrderId && open,
  })

  // --- HÀM TÍNH TOÁN TÊN KHÁCH HÀNG ---
  const displayCustomerName = () => {
    // 1. Nếu có data từ API user vừa gọi
    if (userInfo?.username) return userInfo.username
    if (userInfo?.name) return userInfo.name
    if (userInfo?.email) return userInfo.email

    // 2. Nếu activeOrder đã có sẵn object user (backend populate sẵn)
    if (typeof userIdRaw === 'object' && userIdRaw !== null) {
      return userIdRaw.username || userIdRaw.name || userIdRaw.email || 'Khách hàng'
    }

    return 'Vãng lai (Khách lẻ)'
  }
  // -------------------------------------

  const columns = [
    {
      title: 'Tên món',
      dataIndex: 'dish_id',
      key: 'name',
      render: (dish, record) => dish?.dish_name || record.dish_name || 'Món không xác định',
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => formatVnd(price),
    },
    {
      title: 'Tổng',
      key: 'total',
      align: 'right',
      render: (_, r) => formatVnd((r.price || 0) * (r.quantity || 0)),
    },
    {
      title: 'TT Món',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (s) => {
        let color = 'default'
        if (s === 'Served') color = 'green'
        if (s === 'Processing') color = 'blue'
        if (s === 'Pending') color = 'gold'
        if (s === 'Cancelled') color = 'red'
        return <Tag color={color}>{s}</Tag>
      },
    },
  ]

  const isLoading = isLoadingOrder || (activeOrderId && isLoadingItems)

  return (
    <Modal
      title={`Đơn hàng tại: ${tableName}`}
      open={open}
      onCancel={onCancel}
      footer={<Button onClick={onCancel}>Đóng</Button>}
      width={800}
    >
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : !activeOrder ? (
        <div className="text-center p-8 text-gray-500">
          Bàn này chưa có đơn hàng nào đang hoạt động.
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between bg-gray-50 p-3 rounded border">
            {/* HIỂN THỊ TÊN KHÁCH HÀNG */}
            <span className="text-base">
              Khách: <strong>{displayCustomerName()}</strong>
            </span>

            <Tag color="blue" className="font-bold text-sm uppercase">
              {activeOrder?.status}
            </Tag>
          </div>

          <Table
            dataSource={orderItems}
            columns={columns}
            rowKey={(r) => r._id || Math.random()}
            pagination={false}
            size="middle"
            bordered
            locale={{ emptyText: 'Không tìm thấy món ăn trong đơn hàng này' }}
          />

          <div className="mt-4 text-right text-2xl font-bold text-red-600">
            Tổng tiền: {formatVnd(activeOrder?.total_price)}
          </div>
        </>
      )}
    </Modal>
  )
}

export default OrderDetailModal
