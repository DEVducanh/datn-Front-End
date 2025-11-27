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
} from '@ant-design/icons'

import OrderModalEdit from './modalEdit'
import OrderModalDetail from './orderDetail'

// --- BỘ TỪ ĐIỂN TRẠNG THÁI (ANH -> VIỆT) ---
const STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang nấu',
  Shipped: 'Đã phục vụ', 
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Paid: 'Đã thanh toán'
}

const STATUS_COLORS = {
  Pending: 'gold',
  Processing: 'blue',
  Shipped: 'cyan', 
  Completed: 'green',
  Cancelled: 'red',
  Paid: 'magenta'
}

// LOGIC API AN TOÀN
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
      console.error('[API ERROR] Failed to fetch items:', error.response || error.message)
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

  const deleteSuccess = () => {
    messageApi.open({ type: 'success', content: 'Xóa đơn hàng thành công!' })
  }

  const deleteError = (errorMsg) => {
    messageApi.open({ type: 'error', content: errorMsg || 'Xóa đơn hàng thất bại!' })
  }

  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', statusSelected, searchText],
    queryFn: async () => {
      let url = '/orders'
      const params = []
      if (statusSelected) params.push(`status=${statusSelected}`)
      if (searchText) params.push(`search=${searchText}`)

      if (params.length > 0) {
        url += `?${params.join('&')}`
      }

      const res = await http.get(url)
      return res.data || []
    },
    enabled: true,
  })

  const { data: orderItemData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['orderItems', detailOrderId],
    queryFn: async () => {
      const res = await orderItemAPI.getOrderItemDetails(detailOrderId)
      return res
    },
    enabled: !!detailOrderId,
    staleTime: 5 * 60 * 1000,
  })

  const { mutate: updateOrder } = useMutation({
    mutationFn: async ({ id, data }) => {
      return await http.patch(`/orders/${id}/status`, data)
    },
    onSuccess: () => {
      message.success('Cập nhật đơn hàng thành công!')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      message.error('Cập nhật thất bại!')
    },
  })

  const { mutate: deleteOrder } = useMutation({
    mutationFn: async (id) => {
      console.log(`[DELETE API] Đang gọi API DELETE cho ID: ${id}`)
      return await http.delete(`/orders/${id}`)
    },
    onSuccess: (data) => {
      deleteSuccess()
      console.log('✅ XÓA ĐƠN HÀNG THÀNH CÔNG:', data)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error) => {
      console.error('❌ LỖI API DELETE Order:', error.response)
      let errorMessage = 'Xóa đơn hàng thất bại.'
      if (error.response) {
        const status = error.response.status
        const messageData = error.response.data?.message
        if (status === 401 || status === 403) {
          errorMessage = `Lỗi ${status} - Phân quyền: Bạn không có quyền xóa đơn hàng này.`
        } else if (status === 404) {
          errorMessage = 'Lỗi 404: Không tìm thấy đơn hàng.'
        } else if (messageData) {
          errorMessage = `Thất bại: ${messageData}`
        } else {
          errorMessage = `Lỗi Server: ${status}`
        }
      }
      deleteError(errorMessage)
    },
  })

  const handleSearch = (value) => {
    setSearchtext(value)
  }

  const handleChange = (value) => {
    setStatusSelected(value)
  }

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
      key: 'username',
      render: (record) => record.user?.username || 'Khách lẻ',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        // ⭐ SỬA: Hiển thị tiếng Việt và màu tương ứng
        const label = STATUS_LABELS[status] || status
        const color = STATUS_COLORS[status] || 'default'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const isFinalized = record.status === 'Cancelled' || record.status === 'Completed'

        if (isFinalized) {
          return (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                confirm({
                  title: 'Xác nhận xóa?',
                  content: `Bạn có chắc chắn muốn xóa đơn hàng #${record._id.slice(-6)} này không?`,
                  okText: 'Xóa',
                  okType: 'danger',
                  cancelText: 'Hủy',
                  onOk: async () => {
                    return deleteOrder(record._id)
                  },
                })
              }}
            />
          )
        }
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

  if (isLoading) return <p>Đang tải đơn hàng...</p>
  if (error) return <p>Lỗi: Không thể tải đơn hàng ({error.message})</p>

  const tableData = Array.isArray(data) ? data : data?.data || []

  const orderItems =
    orderItemData && Array.isArray(orderItemData.data)
      ? orderItemData.data
      : orderItemData?.Orderitems && Array.isArray(orderItemData.Orderitems)
        ? orderItemData.Orderitems
        : orderItemData && Array.isArray(orderItemData)
          ? orderItemData
          : []

  return (
    <div className="h-full overflow-auto">
      {contextHolder}
      {modalContextHolder}
      <section className="mb-3">
        <h1 className="font-bold text-3xl mb-2">Quản lý đơn hàng</h1>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý đơn hàng' }]} />
      </section>
      <Card className="shadow-sm rounded-2xl xl:col-span-2" title="Danh sách đơn hàng">
        <div className="mb-4 flex justify-between">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Space>
              <Input.Search
                placeholder="Tìm kiếm theo bàn hoặc khách..."
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                onSearch={handleSearch}
              />
            </Space>
            <Space>
              {/* ⭐ SỬA: Dropdown lọc cũng hiển thị tiếng Việt */}
              <Select
                placeholder="Lọc theo trạng thái"
                allowClear
                style={{ width: 180 }}
                suffixIcon={<FilterOutlined />}
                value={statusSelected}
                onChange={handleChange}
              >
                <Option value="Pending">Chờ xác nhận</Option>
                <Option value="Processing">Đang nấu</Option>
                <Option value="Shipped">Đã phục vụ</Option>
                <Option value="Completed">Hoàn thành</Option>
                <Option value="Cancelled">Đã hủy</Option>
              </Select>
            </Space>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm đơn hàng
          </Button>
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
        onCancel={() => handleCancel()}
        orderItemsData={orderItems}
        isLoadingItems={isLoadingItems}
      />

      {/* Lưu ý: Modal Edit cũng cần phải sửa file modalEdit.jsx thì dropdown bên trong mới hiện tiếng Việt */}
      <OrderModalEdit
        open={modalOpen}
        order={selectedOrder}
        onCancel={() => handleCancel()}
        onSubmit={(value) => handleUpdate(value, selectedOrder?._id)}
      />
    </div>
  )
}

export default OrderManagement