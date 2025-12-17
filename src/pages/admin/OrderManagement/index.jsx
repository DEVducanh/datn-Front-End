import React, { useState } from 'react'
import { Card, Table, Tag, Breadcrumb, Space, Button, Select, Input, message, Modal } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import axios from 'axios'
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined, // Icon refresh
} from '@ant-design/icons'

import OrderModalEdit from './modalEdit'
import OrderModalDetail from './orderDetail'

// --- TỪ ĐIỂN TRẠNG THÁI (ĐÃ VIỆT HÓA) ---
const STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang nấu',
  Ready: 'Món đã xong',
  Shipped: 'Đã phục vụ',
  Served: 'Đã phục vụ',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Paid: 'Đã thanh toán',
}

const STATUS_COLORS = {
  Pending: 'gold',
  Processing: 'blue',
  Ready: 'cyan',
  Shipped: 'green',
  Served: 'green',
  Completed: 'green',
  Cancelled: 'red',
  Paid: 'magenta',
}

const orderItemAPI = {
  getOrderItemDetails: async (orderId) => {
    try {
      const token = localStorage.getItem('token')
      const url = `${import.meta.env.VITE_API_URL || 'https://api-datn-orderfood-backend-2.onrender.com'}/order-item/order/${orderId}`
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      return response.data || {}
    } catch (error) {
      return { data: [] }
    }
  },
}

const { Option } = Select

const OrderManagement = () => {
  const [statusSelected, setStatusSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDetailOpen, setModalDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchText, setSearchtext] = useState('')
  const [messageApi, contextHolder] = message.useMessage()
  const [modalApi, modalContextHolder] = Modal.useModal()
  const confirm = modalApi.confirm
  const [detailOrderId, setDetailOrderId] = useState(null)

  const queryClient = useQueryClient()

  // --- QUERY CHÍNH (CÓ AUTO REFRESH) ---
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', statusSelected, searchText],
    queryFn: async () => {
      let url = '/orders'
      const params = []
      if (statusSelected) params.push(`status=${statusSelected}`)
      if (searchText) params.push(`search=${searchText}`)

      if (params.length > 0) url += `?${params.join('&')}`

      const res = await http.get(url)
      return res.data || []
    },
    enabled: true,

    // 👇 CẤU HÌNH QUAN TRỌNG NHẤT 👇
    refetchInterval: 3000, // Tự động gọi lại API mỗi 3 giây
    staleTime: 0, // Luôn coi dữ liệu là cũ để bắt buộc lấy mới
    cacheTime: 0, // Không lưu cache
  })

  const { data: orderItemData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['orderItems', detailOrderId],
    queryFn: async () => {
      const res = await orderItemAPI.getOrderItemDetails(detailOrderId)
      return res
    },
    enabled: !!detailOrderId,
    staleTime: 0,
  })

  const { mutate: updateOrder } = useMutation({
    mutationFn: async ({ id, data }) => await http.patch(`/orders/${id}/status`, data),
    onSuccess: () => {
      message.success('Cập nhật thành công!')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => message.error('Cập nhật thất bại!'),
  })

  const { mutate: deleteOrder } = useMutation({
    mutationFn: async (id) => await http.delete(`/orders/${id}`),
    onSuccess: () => {
      message.success('Xóa thành công!')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => message.error('Xóa thất bại!'),
  })

  const handleSearch = (value) => setSearchtext(value)
  const handleChange = (value) => setStatusSelected(value)
  const handleUpdate = (value, orderId) => {
    updateOrder({ id: orderId, data: value })
    setModalOpen(false)
  }
  const handleOpenModal = (order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }
  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order)
    setDetailOrderId(order._id)
    setModalDetailOpen(true)
  }
  const handleCancel = () => {
    setModalOpen(false)
    setModalDetailOpen(false)
    setSelectedOrder(null)
    setDetailOrderId(null)
  }

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (v) => <span className="font-medium">#{v.slice(-6)}</span>,
    },
    {
      title: 'Bàn',
      key: 'table_name',
      render: (record) => record.table?.table_name || 'Chưa có bàn',
    },
    {
      title: 'Khách hàng',
      key: 'customer_info',
      render: (_, record) => {
        // 👇 IN RA ĐỂ KIỂM TRA (F12 -> Console)
        console.log('Soi đơn hàng:', record._id)
        console.log('-- Guest Info:', record.guest_info)
        console.log('-- User Info:', record.user_info)
        console.log('-- Toàn bộ record:', record)

        // 1. Cố gắng tìm trong guest_info (Thường backend lưu ở đây)
        let guestName =
          record.guest_info?.name || record.guest_info?.username || record.guest_info?.fullname
        let guestPhone = record.guest_info?.phone || record.guest_info?.phoneNumber

        // 2. Nếu không có, thử tìm trong các biến thể khác (shipping, receiver...)
        if (!guestName) {
          guestName = record.shippingAddress?.name || record.receiver_name || record.full_name
          guestPhone = record.shippingAddress?.phone || record.receiver_phone || record.phone
        }

        // 3. Cuối cùng mới lấy User đăng ký
        const userName = record.user?.username || record.user?.name
        const userPhone = record.user?.phone

        // CHỐT: Ưu tiên Guest -> User -> Mặc định
        const finalName = guestName || userName || 'Khách vãng lai'
        const finalPhone = guestPhone || userPhone || ''

        return (
          <div className="flex flex-col">
            <span className="font-bold text-gray-700">{finalName}</span>
            {finalPhone && <span className="text-xs text-gray-500">{finalPhone}</span>}
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const label = STATUS_LABELS[status] || status
        const color = STATUS_COLORS[status] || 'default'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        // Kiểm tra xem đơn hàng đã kết thúc chưa
        const isFinalized = ['Cancelled', 'Completed', 'Paid'].includes(record.status)

        if (isFinalized) {
          // TRƯỚC ĐÂY: Hiện nút Xóa
          // BÂY GIỜ: Thay bằng nút Xem Chi Tiết
          return (
            <Button
              type="default" // Hoặc type="primary" ghost nếu muốn viền xanh
              icon={<EyeOutlined />} // Icon con mắt
              onClick={() => handleOpenDetailModal(record)} // Mở modal chi tiết
            >
              {/* Có thể thêm chữ "Chi tiết" nếu muốn, hoặc để icon không */}
            </Button>
          )
        }

        // Nếu đơn chưa kết thúc -> Hiện cả Xem và Sửa
        return (
          <Space>
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetailModal(record)}
            />
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Space>
        )
      },
    },
  ]

  const tableData = Array.isArray(data) ? data : data?.data || []
  const orderItems =
    orderItemData?.data ||
    orderItemData?.Orderitems ||
    (Array.isArray(orderItemData) ? orderItemData : [])

  return (
    <div className="h-full overflow-auto">
      {contextHolder} {modalContextHolder}
      <section className="mb-3">
        <h1 className="font-bold text-3xl mb-2">Quản lý đơn hàng</h1>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý đơn hàng' }]} />
      </section>
      <Card className="shadow-sm rounded-2xl xl:col-span-2" title="Danh sách đơn hàng">
        <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
          <Space>
            <Input.Search
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              style={{ width: 180 }}
              suffixIcon={<FilterOutlined />}
              value={statusSelected}
              onChange={handleChange}
            >
              <Option value="Pending">Chờ xác nhận</Option>
              <Option value="Processing">Đang nấu</Option>
              <Option value="Ready">Món đã xong</Option>
              <Option value="Served">Đã phục vụ</Option>
              <Option value="Completed">Hoàn thành</Option>
              <Option value="Cancelled">Đã hủy</Option>
            </Select>
            {/* Nút Refresh thủ công */}
            <Button icon={<SyncOutlined spin={isLoading} />} onClick={() => refetch()} />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={'_id'}
          pagination={{ pageSize: 10 }}
          className="rounded-xl"
        />
      </Card>
      <OrderModalDetail
        order={selectedOrder}
        open={modalDetailOpen}
        onCancel={handleCancel}
        orderItemsData={orderItems}
        isLoadingItems={isLoadingItems}
      />
      <OrderModalEdit
        open={modalOpen}
        order={selectedOrder}
        onCancel={handleCancel}
        onSubmit={(value) => handleUpdate(value, selectedOrder?._id)}
      />
    </div>
  )
}

export default OrderManagement
