import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, Modal, message, Spin, Typography } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  FileDoneOutlined
} from '@ant-design/icons'
import http from '@/apis/http'
import PaymentModal from './paymentModal/index'

const { Text } = Typography

const BASE_ORDER_URL = '/orders'
const ORDER_ITEM_DETAIL_URL = '/order-item/order'
const BASE_ORDER_ITEM_URL = '/order-item'

const STATUS_CONFIG = {
  Pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang chờ xác nhận' },
  Processing: { color: 'blue', icon: <SyncOutlined spin />, text: 'Đang nấu' },
  Shipped: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã phục vụ' },
  Served: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã phục vụ' },
  Ready: { color: 'geekblue', icon: <CheckCircleOutlined />, text: 'Đã xong (Chờ bưng)' },
  Cancelled: { color: 'red', icon: <CloseCircleOutlined />, text: 'Đã hủy' },
  Paid: { color: 'magenta', icon: <CheckCircleOutlined />, text: 'Đã thanh toán' },
  'Pending Payment': { color: 'purple', icon: <DollarOutlined />, text: 'Chờ thanh toán' },
  Completed: { color: 'gold', icon: <CheckCircleOutlined />, text: 'Hoàn thành' }
}

const getItemStatusTag = (status) => {
  const config = STATUS_CONFIG[status]
  if (!config) return <Tag>{status}</Tag>
  return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
}

const OrderPage = () => {
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [currentTableId, setCurrentTableId] = useState(null)

  const [modalApi, modalContextHolder] = Modal.useModal()
  const [messageApi, contextHolder] = message.useMessage()

  // 1. Logic Tự động cập nhật (Auto Refresh)
  useEffect(() => {
    const tableId = localStorage.getItem('currentTableId')
    if (tableId) {
      setCurrentTableId(tableId)

      // Gọi ngay lập tức lần đầu
      fetchOrdersAndItems(tableId, false)

      // Cài đặt gọi lại sau mỗi 5 giây (Polling)
      const interval = setInterval(() => {
        // Truyền true để chạy ngầm (không hiện loading xoay xoay)
        fetchOrdersAndItems(tableId, true)
      }, 5000)

      // Dọn dẹp khi thoát trang
      return () => clearInterval(interval)
    }
  }, [])

  const fetchOrderItemsByOrderId = async (orderId) => {
    try {
      const response = await http.get(`${ORDER_ITEM_DETAIL_URL}/${orderId}`)
      if (response.Orderitems) return response.Orderitems
      if (response.data) return response.data
      if (Array.isArray(response)) return response
      return []
    } catch (error) {
      // console.error(`Lỗi chi tiết đơn ${orderId}`, error) // Tắt log cho đỡ rối
      return []
    }
  }

  // 2. Hàm Fetch Data (Hỗ trợ chạy ngầm isBackground)
  const fetchOrdersAndItems = useCallback(async (tableId, isBackground = false) => {
    if (!isBackground) setLoading(true)

    try {
      const response = await http.get(BASE_ORDER_URL)

      let fetchedOrders = []
      if (Array.isArray(response)) fetchedOrders = response
      else if (response.data && Array.isArray(response.data)) fetchedOrders = response.data
      else if (response.data && Array.isArray(response.data.data)) fetchedOrders = response.data.data

      // Lọc theo bàn
      if (tableId) {
        fetchedOrders = fetchedOrders.filter(order => {
          const orderTableId = order.table_id?._id || order.table_id
          return orderTableId === tableId
        })
      }

      // Check thay đổi để tránh render lại không cần thiết (Optional optimization)
      // Ở đây ta cứ set lại để cập nhật mới nhất
      setOrders(fetchedOrders)

      if (fetchedOrders.length === 0) {
        setItems([])
        if (!isBackground) setLoading(false)
        return
      }

      const itemPromises = fetchedOrders.map(async (order) => {
        const items = await fetchOrderItemsByOrderId(order._id)
        const safeItems = Array.isArray(items) ? items : []
        return safeItems.map((item) => ({
          ...item,
          orderId: order._id,
          orderStatus: order.status,
          key: item._id || Math.random(),
        }))
      })

      const results = await Promise.all(itemPromises)
      const allActiveItems = results.flat().filter(item => item.status !== 'Cancelled')
      setItems(allActiveItems.reverse())

    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [messageApi])


  const handlePaymentClick = () => {
    const hasServedItems = items.some(item =>
      (item.status === 'Shipped' || item.status === 'Served') && item.orderStatus !== 'Paid'
    )

    if (!hasServedItems) {
      messageApi.warning('Chưa có món nào ĐÃ PHỤC VỤ để thanh toán.')
      return
    }
    setIsPaymentModalVisible(true)
  }

  const handleCancelItem = (record) => {
    const { _id: itemId, status: currentStatus, dish_id } = record
    const dishName = dish_id?.dish_name || 'món này'

    if (['Shipped', 'Served', 'Cancelled', 'Paid', 'Completed'].includes(currentStatus)) {
      messageApi.warning(`Món đã phục vụ hoặc hoàn thành, không thể hủy.`)
      return
    }

    modalApi.confirm({
      title: 'Hủy món ăn?',
      content: `Bạn muốn hủy **${dishName}**?`,
      okText: 'Hủy ngay',
      okType: 'danger',
      cancelText: 'Không',
      async onOk() {
        setIsUpdating(true)
        try {
          await http.patch(`${BASE_ORDER_ITEM_URL}/${itemId}/status`, { status: 'Cancelled' })

          // Cập nhật nóng ngay lập tức
          setItems(prev => prev.filter(item => item._id !== itemId))

          // Gọi lại API để đồng bộ
          fetchOrdersAndItems(currentTableId, true)

          messageApi.success(`Đã hủy món ${dishName}`)
        } catch (error) {
          messageApi.error('Lỗi khi hủy món.')
        } finally {
          setIsUpdating(false)
        }
      },
    })
  }

  const columns = [
    { title: 'Mã ĐH', dataIndex: 'orderId', render: t => t?.slice(0, 8), width: 90 },
    { title: 'Tên món', dataIndex: 'dish_id', render: d => d?.dish_name || '---' },
    { title: 'Giá', dataIndex: 'price', render: p => `${Number(p).toLocaleString()}đ`, width: 110 },
    { title: 'SL', dataIndex: 'quantity', width: 50, align: 'center' },
    { title: 'Trạng thái', dataIndex: 'status', render: s => getItemStatusTag(s), width: 130 },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (_, r) => <Text>{(r.price * r.quantity).toLocaleString()}đ</Text>,
      width: 110
    },
    {
      title: '',
      key: 'action',
      render: (_, r) =>
        !['Shipped', 'Served', 'Cancelled', 'Paid', 'Processing', 'Completed'].includes(r.status) ? (
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleCancelItem(r)} />
        ) : null,
      width: 60
    },
  ]

  const totalBill = items.reduce((sum, item) => {
    if (item.status === 'Cancelled') return sum
    return sum + (item.price * item.quantity)
  }, 0)

  if (!currentTableId) return <div className="p-10 text-center text-red-500">Vui lòng quét mã QR.</div>

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      {contextHolder}
      {modalContextHolder}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Đơn hàng tại bàn</h2>
        <Button icon={<SyncOutlined />} onClick={() => fetchOrdersAndItems(currentTableId)}>Tải lại</Button>
      </div>

      {loading ? (
        <div className="text-center p-10"><Spin size="large" tip="Đang tải..." /></div>
      ) : (
        <Table
          columns={columns}
          dataSource={items}
          rowKey="key"
          pagination={false}
          scroll={{ x: 600 }}
          locale={{ emptyText: 'Bạn chưa gọi món nào' }}
        />
      )}

      <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <Text strong className="text-lg">Tạm tính:</Text>
        <Text strong className="text-2xl text-orange-600">{totalBill.toLocaleString()} VNĐ</Text>
      </div>

      <div className="mt-6 text-center">
        <Button
          type="primary"
          size="large"
          icon={<FileDoneOutlined />}
          onClick={handlePaymentClick}
          disabled={items.length === 0}
          className="bg-blue-600 hover:bg-blue-500 h-12 px-8 text-lg font-bold"
        >
          Thanh Toán (Món đã phục vụ)
        </Button>
      </div>

      <PaymentModal
        items={items}
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
      />
    </div>
  )
}

export default OrderPage