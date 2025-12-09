import React from 'react'
import { Modal, Table, Spin, Tag, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const OrderDetailModal = ({ open, onCancel, tableId, tableName }) => {

  // 1. GỌI API LẤY THÔNG TIN ĐƠN HÀNG (SỬA LẠI ĐỂ KHÔNG BỊ LỖI 404)
  const { data: activeOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['currentOrderInfo', tableId],
    queryFn: async () => {
      if (!tableId) return null

      try {
        // --- SỬA Ở ĐÂY: Thay vì gọi /by-table, ta gọi lấy tất cả ---
        const res = await http.get(`/orders`)

        let allOrders = res.data?.data || res.data || res
        if (!Array.isArray(allOrders)) allOrders = []

        // --- TỰ LỌC Ở FRONTEND ---
        // Tìm đơn hàng: (Đúng bàn này) VÀ (Chưa kết thúc)
        const foundOrder = allOrders.find((o) => {
          const tId = o.table_id?._id || o.table_id
          const isSameTable = tId === tableId
          // Các trạng thái được coi là "đang hoạt động"
          const isActive = !['Completed', 'Cancelled', 'Paid'].includes(o.status)
          return isSameTable && isActive
        })

        return foundOrder || null
      } catch (error) {
        console.error("Lỗi lấy đơn hàng:", error)
        return null
      }
    },
    enabled: !!tableId && open,
  })

  const activeOrderId = activeOrder?._id
  // Lấy user_id (có thể là string hoặc object)
  const userIdRaw = activeOrder?.user_id || activeOrder?.user

  // 2. GỌI API LẤY THÔNG TIN USER (NẾU CẦN THIẾT)
  const { data: userInfo } = useQuery({
    queryKey: ['userInfo', userIdRaw],
    queryFn: async () => {
      if (!userIdRaw || typeof userIdRaw === 'object') return null
      try {
        const res = await http.get(`/users/${userIdRaw}`)
        return res.data || res
      } catch (e) {
        return null
      }
    },
    enabled: !!userIdRaw && typeof userIdRaw === 'string' && open,
  })

  // 3. GỌI API LẤY DANH SÁCH MÓN
  const { data: orderItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['currentOrderItems', activeOrderId],
    queryFn: async () => {
      if (!activeOrderId) return []
      try {
        const res = await http.get(`/order-item/order/${activeOrderId}`)
        if (Array.isArray(res?.Orderitems)) return res.Orderitems
        if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
        if (Array.isArray(res?.data)) return res.data
        if (Array.isArray(res)) return res
        return []
      } catch (e) {
        return []
      }
    },
    enabled: !!activeOrderId && open,
  })

  // --- HÀM HIỂN THỊ TÊN KHÁCH ---
  const displayCustomerName = () => {
    if (userInfo?.username) return userInfo.username
    if (userInfo?.name) return userInfo.name

    if (typeof userIdRaw === 'object' && userIdRaw !== null) {
      return userIdRaw.username || userIdRaw.name || userIdRaw.email || 'Khách hàng'
    }

    // Nếu activeOrder có lưu tên khách vãng lai (customer_name)
    if (activeOrder?.customer_name) return activeOrder.customer_name

    return 'Vãng lai (Khách lẻ)'
  }

  const columns = [
    {
      title: 'Tên món',
      dataIndex: 'dish_id',
      key: 'name',
      render: (dish, record) => dish?.dish_name || record.dish_name || record.name || 'Món ăn',
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: (q) => <span className="font-bold">x{q}</span>
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (s) => {
        let color = 'default'
        if (s === 'Served' || s === 'Ready') color = 'green'
        if (s === 'Processing') color = 'blue'
        if (s === 'Pending') color = 'gold'
        if (s === 'Cancelled') color = 'red'

        let text = s
        if (s === 'Served') text = 'Đã phục vụ'
        if (s === 'Ready') text = 'Đã xong'
        if (s === 'Processing') text = 'Đang nấu'
        if (s === 'Pending') text = 'Chờ nấu'

        return <Tag color={color}>{text || s}</Tag>
      },
    },
  ]

  const isLoading = isLoadingOrder || (activeOrderId && isLoadingItems)

  return (
    <Modal
      title={<span className="text-lg">Chi tiết bàn: <b>{tableName}</b></span>}
      open={open}
      onCancel={onCancel}
      footer={<Button onClick={onCancel}>Đóng</Button>}
      width={800}
      centered
    >
      {isLoading ? (
        <div className="flex justify-center p-10">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      ) : !activeOrder ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50 rounded-lg">
          <p className="text-lg">Bàn này đang trống</p>
          <span className="text-sm">(Chưa có đơn hàng nào đang hoạt động)</span>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase font-bold">Khách hàng</span>
              <span className="text-lg font-bold text-blue-700">{displayCustomerName()}</span>
            </div>

            <div className="text-right">
              <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Trạng thái đơn</span>
              <Tag color="processing" className="m-0 text-sm py-1 px-3">
                {activeOrder?.status || 'ĐANG PHỤC VỤ'}
              </Tag>
            </div>
          </div>

          <Table
            dataSource={orderItems}
            columns={columns}
            rowKey={(r) => r._id || Math.random()}
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: 'Chưa gọi món nào' }}
            scroll={{ y: 300 }}
          />

          <div className="mt-4 pt-4 border-t flex justify-end items-center gap-4">
            <span className="text-gray-600 font-medium">Tạm tính:</span>
            <span className="text-2xl font-bold text-red-600">
              {formatVnd(activeOrder?.total_price || 0)}
            </span>
          </div>
        </>
      )}
    </Modal>
  )
}

export default OrderDetailModal 