import React from 'react'
import {
  Modal,
  Descriptions,
  Tag,
  Table,
  Typography,
  Button,
  Divider,
  Select,
  Space,
  message,
} from 'antd'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http' // Đảm bảo import này đúng

const { Title } = Typography

// Định nghĩa các trạng thái món ăn có thể chọn
const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Ready', label: 'Ready' },
  { value: 'Served', label: 'Served' },
  { value: 'Cancelled', label: 'Cancelled' },
]

// Hàm API Frontend để gọi PATCH
const updateOrderItemStatusAPI = async ({ id, status }) => {
  return await http.patch(`/order-item/${id}/status`, { status })
}

const itemColumns = (updateStatus, isUpdating) => [
  {
    title: 'Món ăn',
    dataIndex: 'dish_id',
    key: 'dish_name',
    render: (dish) => <span className="font-medium">{dish?.dish_name}</span>,
  },
  {
    title: 'Số lượng',
    dataIndex: 'quantity',
    key: 'quantity',
  },
  {
    title: 'Trạng thái món',
    dataIndex: 'status',
    key: 'status',
    width: 150, // Cố định chiều rộng cho Select
    render: (currentStatus, record) => {
      const isFinalized = currentStatus === 'Cancelled' || currentStatus === 'Served'

      return (
        <Select
          value={currentStatus}
          style={{ width: '100%' }}
          disabled={isFinalized || isUpdating}
          onChange={(newStatus) => updateStatus({ id: record._id, status: newStatus })}
          options={STATUS_OPTIONS}
        />
      )
    },
  },
  {
    title: 'Giá',
    dataIndex: 'dish_id',
    key: 'price',
    render: (dish, record) => {
      const unitPrice = dish?.price ?? 0
      const price = unitPrice * (record.quantity ?? 0)
      return `${price.toLocaleString('vi-VN')} đ`
    },
  },
]

const OrderModalDetail = ({ open, order, onCancel, orderItemsData, isLoadingItems }) => {
  const queryClient = useQueryClient()
  const [messageApi, contextHolder] = message.useMessage()

  const orderItems = orderItemsData || []
  const orderId = order?._id

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: updateOrderItemStatusAPI,
    onSuccess: (response) => {
      message.success(`Cập nhật trạng thái thành công: ${response.message || ''}`)
      queryClient.invalidateQueries({ queryKey: ['orderItems', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error) => {
      const errorMsg =
        error.response?.data?.message || 'Lỗi: Không thể chuyển trạng thái (Quy tắc nghiệp vụ).'
      message.error(errorMsg)
      console.error('Lỗi chuyển trạng thái:', error.response?.data)
    },
  })

  // Tính tổng tiền (giữ nguyên logic)
  const totalAmount = orderItems.reduce(
    (sum, item) => sum + (item.dish_id?.price ?? 0) * (item.quantity ?? 0),
    0
  )

  // Định nghĩa màu cho trạng thái tổng của đơn hàng
  const orderStatusColorMap = {
    Pending: 'gold',
    Processing: 'blue',
    Shipped: 'purple',
    Completed: 'green',
    Cancelled: 'red',
  }

  if (!order) return null

  return (
    <>
      {contextHolder} {/* Đảm bảo contextHolder được đặt ở đây */}
      <Modal
        title={
          <Title level={4} className="!mb-0">
            Chi tiết đơn hàng #{order._id?.slice(-6)}
          </Title>
        }
        open={open}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Đóng
          </Button>,
        ]}
        width={750}
      >
        {/* --- 2. PHẦN THÔNG TIN CHUNG (Dùng Descriptions thay cho Form) --- */}
        <Descriptions bordered column={2} size="small" className="mb-4">
          <Descriptions.Item label="Mã đơn hàng" span={2}>
            <span className="font-medium">{order._id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            {order.user?.username || order.user_id?.username || 'Khách lẻ'}
          </Descriptions.Item>
          <Descriptions.Item label="Bàn">
            {order.table?.table_name || order.table_id?.table_name || 'Không có'}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag
              color={orderStatusColorMap[order.status] || 'default'}
              style={{ fontWeight: 'bold' }}
            >
              {order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            <span className="font-bold text-lg text-orange-500">
              {totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian tạo">
            {new Date(order.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật cuối">
            {new Date(order.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        {/* --- 3. PHẦN DANH SÁCH MÓN ĂN (Sử dụng Table) --- */}
        <Divider orientation="left" className="!mt-2 !mb-4">
          <Title level={5} className="!mb-0">
            Danh sách món ăn và Trạng thái phục vụ
          </Title>
        </Divider>

        {isLoadingItems ? (
          <p className="text-center text-blue-500">Đang tải chi tiết món ăn...</p>
        ) : (
          <Table
            // Truyền hàm updateStatus và trạng thái updating vào columns
            columns={itemColumns(updateStatus, isUpdating)}
            dataSource={orderItems}
            rowKey={(record) => record._id || record.dish_id?._id}
            pagination={false}
            size="middle"
            locale={{ emptyText: 'Đơn hàng chưa có món ăn nào.' }}
            loading={isUpdating} // Hiển thị loading cho toàn bộ bảng khi gửi request cập nhật
          />
        )}
      </Modal>
    </>
  )
}

export default OrderModalDetail
