import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Tag, Modal, message, Spin, Typography } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined, // Icon xoay cho trạng thái đang nấu
  DollarOutlined,
  DeleteOutlined,
  CreditCardOutlined, // Icon tiền tệ
} from '@ant-design/icons'
import http from '@/apis/http'
import axios from 'axios'
import PaymentModal from './paymentModal/index'

const { Text } = Typography
const BASE_ORDER_URL = 'https://api-datn-orderfood-backend-2.onrender.com/orders'
const BASE_ORDER_ITEM_URL = 'https://api-datn-orderfood-backend-2.onrender.com/order-item'
const ORDER_ITEM_DETAIL_URL = 'https://api-datn-orderfood-backend-2.onrender.com/order-item/order'

const STATUS_CONFIG = {
  Pending: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    text: 'Đang chờ',
  },
  Processing: {
    color: 'blue',
    icon: <SyncOutlined spin />, // Thêm hiệu ứng xoay
    text: 'Đang nấu',
  },
  Ready: {
    color: 'geekblue',
    icon: <CheckCircleOutlined />,
    text: 'Đã nấu xong',
  },
  Served: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    text: 'Đã phục vụ',
  },
  Cancelled: {
    color: 'red',
    icon: <CloseCircleOutlined />,
    text: 'Đã hủy',
  },
  Paid: {
    color: 'magenta',
    icon: <CheckCircleOutlined />,
    text: 'Đã thanh toán',
  },
  'Pending Payment': {
    color: 'purple',
    icon: <DollarOutlined />,
    text: 'Chờ thanh toán',
  },
}

// 2. Hàm hiển thị Tag (Rất ngắn gọn)
const getItemStatusTag = (status) => {
  const config = STATUS_CONFIG[status]

  // Nếu trạng thái không có trong danh sách, trả về mặc định
  if (!config) {
    return <Tag>{status}</Tag>
  }

  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  )
}

const OrderPage = () => {
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([]) // Luôn khởi tạo là mảng rỗng
  const [loading, setLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  const [modalApi, modalContextHolder] = Modal.useModal()
  const [messageApi, contextHolder] = message.useMessage()

  // Hàm gọi chi tiết Items cho từng Order
  const fetchOrderItemsByOrderId = async (orderId) => {
    try {
      const token = localStorage.getItem('token')
      const url = `${ORDER_ITEM_DETAIL_URL}/${orderId}`

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      // Xử lý các trường hợp trả về của API
      if (Array.isArray(response.data.Orderitems)) {
        return response.data.Orderitems
      }
      if (Array.isArray(response.data.data)) {
        return response.data.data
      }
      if (Array.isArray(response.data)) {
        return response.data
      }

      return []
    } catch (error) {
      console.error(
        `[API ERROR] Failed to fetch order items for ${orderId}:`,
        error.response || error.message
      )
      return []
    }
  }

  // Hàm tải đơn hàng và gộp thành Item list
  const fetchOrdersAndItems = useCallback(
    async (userId, tableId) => {
      setLoading(true)
      try {
        const ordersRes = await http.get(`${BASE_ORDER_URL}/by-table/${tableId}?userId=${userId}`)

        let fetchedOrders = ordersRes.data

        // --- SỬA LỖI QUAN TRỌNG TẠI ĐÂY ---
        // Kiểm tra nếu API trả về Object (đơn lẻ) thay vì Array, thì bọc nó vào mảng
        if (!Array.isArray(fetchedOrders)) {
          if (fetchedOrders && typeof fetchedOrders === 'object') {
            fetchedOrders = [fetchedOrders]
          } else {
            fetchedOrders = []
          }
        }
        // ----------------------------------

        console.log('[LOG] FINAL ORDERS LIST:', fetchedOrders)
        setOrders(fetchedOrders)

        if (fetchedOrders.length === 0) {
          setItems([])
          setLoading(false)
          return
        }

        const itemPromises = fetchedOrders.map(async (order) => {
          const items = await fetchOrderItemsByOrderId(order._id)
          // Đảm bảo items luôn là mảng trước khi map
          const safeItems = Array.isArray(items) ? items : []

          return safeItems.map((item) => ({
            ...item,
            orderId: order._id,
            orderStatus: order.status,
            key: item._id,
          }))
        })

        const results = await Promise.all(itemPromises)
        const allItems = results.flat()

        console.log('[LOG] ALL ITEMS FOR TABLE:', allItems)
        setItems(allItems)
      } catch (error) {
        console.error('Lỗi tổng quan khi fetch orders và items:', error.response || error)
        // Dùng setTimeout để tránh warning update trong render
        setTimeout(() => messageApi.error('Không thể tải danh sách món ăn/đơn hàng.'), 0)
      } finally {
        setLoading(false)
      }
    },
    [messageApi]
  )

  useEffect(() => {
    const userData = localStorage.getItem('user')
    let userId = null
    if (userData) {
      try {
        const user = JSON.parse(userData)
        userId = user._id
        setCurrentUserId(userId)
      } catch (error) {
        console.error('Lỗi parse user từ localStorage:', error)
      }
    }
    const tableId = localStorage.getItem('currentTableId')

    if (userId && tableId) {
      fetchOrdersAndItems(userId, tableId)
    } else {
      console.warn('Lưu ý: Không tìm thấy userId hoặc tableId để tải dữ liệu.')
    }
  }, [fetchOrdersAndItems])

  // --- HÀM THANH TOÁN ---
  const handlePaymentClick = () => {
    // Đảm bảo orders là mảng để dùng hàm some
    const safeOrders = Array.isArray(orders) ? orders : []

    const hasCompletedOrderOrPendingPayment = safeOrders.some(
      (order) => order.status === 'Completed' || order.status === 'Pending Payment'
    )
    if (!hasCompletedOrderOrPendingPayment) {
      messageApi.warning('Chưa có đơn hàng nào đã hoàn thành hoặc đang chờ thanh toán.')
      return
    }
    setIsPaymentModalVisible(true)
  }

  // --- HÀM XỬ LÝ HỦY MÓN ĂN ---
  const handleCancelItem = (record) => {
    const { _id: itemId, status: currentStatus, dish_id } = record
    const dishName = dish_id?.dish_name || 'món ăn này'

    if (currentStatus === 'Served' || currentStatus === 'Cancelled' || currentStatus === 'Paid') {
      messageApi.warning(`Không thể hủy: Món **${dishName}** đã ở trạng thái ${currentStatus}.`)
      return
    }

    modalApi.confirm({
      title: 'Xác nhận hủy món ăn?',
      content: `Bạn có chắc chắn muốn hủy món **${dishName}** khỏi đơn hàng không?`,
      okText: 'Hủy món',
      okType: 'danger',
      cancelText: 'Quay lại',
      async onOk() {
        setIsUpdating(true)
        try {
          await http.patch(`${BASE_ORDER_ITEM_URL}/${itemId}/status`, { status: 'Cancelled' })

          setItems((prevItems) =>
            prevItems.map((item) => (item._id === itemId ? { ...item, status: 'Cancelled' } : item))
          )
          messageApi.success(`Món **${dishName}** đã được hủy thành công!`)
        } catch (error) {
          console.error('Lỗi API khi hủy món:', error)
          messageApi.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy món.')
        } finally {
          setIsUpdating(false)
        }
      },
    })
  }

  // --- LOGIC KIỂM TRA HIỂN THỊ NÚT ---
  // Đảm bảo an toàn cho biến orders trước khi dùng .every hoặc .some
  const safeOrders = Array.isArray(orders) ? orders : []

  const allCompletedOrCancelledOrPaid =
    safeOrders.length > 0 &&
    safeOrders.every(
      (order) =>
        order.status === 'Completed' ||
        order.status === 'Cancelled' ||
        order.status === 'Paid' ||
        order.status === 'Pending Payment'
    )

  const hasCompletedOrder = safeOrders.some(
    (order) =>
      order.status === 'Completed' || order.status === 'Paid' || order.status === 'Pending Payment'
  )

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => (text ? text.slice(0, 8) : ''),
      width: 120,
    },
    {
      title: 'Tên món ăn',
      dataIndex: 'dish_id',
      key: 'dish_name',
      render: (dish_id) => dish_id?.dish_name || 'Không rõ tên món',
      sorter: (a, b) => (a.dish_id?.dish_name || '').localeCompare(b.dish_id?.dish_name || ''),
    },
    {
      title: 'Giá/Đơn vị',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${Number(price).toLocaleString('vi-VN')} VNĐ`,
      width: 150,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Trạng thái món',
      dataIndex: 'status',
      key: 'item_status',
      render: (status) => getItemStatusTag(status),
      width: 150,
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (_, record) => {
        const isFinalized = record.status === 'Cancelled' || record.orderStatus === 'Paid'
        const amount = record.subtotal || record.price * record.quantity
        const displayAmount = isFinalized ? 0 : amount

        return (
          <Text strong delete={isFinalized} type={isFinalized ? 'secondary' : 'default'}>
            {displayAmount.toLocaleString('vi-VN')} VNĐ
          </Text>
        )
      },
      width: 150,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) =>
        record.status !== 'Served' && record.status !== 'Cancelled' && record.status !== 'Paid' ? (
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={isUpdating}
            onClick={() => handleCancelItem(record)}
          >
            Hủy món
          </Button>
        ) : (
          <Tag
            color={
              record.status === 'Cancelled'
                ? 'red'
                : record.status === 'Paid'
                  ? 'magenta'
                  : 'default'
            }
          >
            {record.status === 'Cancelled'
              ? 'Đã Hủy'
              : record.status === 'Paid'
                ? 'Đã Trả Tiền'
                : 'Không hủy'}
          </Tag>
        ),
      width: 120,
    },
  ]

  const totalBill = items.reduce((sum, item) => {
    if (item.status === 'Cancelled' || item.orderStatus === 'Paid') return sum
    return sum + (item.subtotal || item.price * item.quantity)
  }, 0)

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      {modalContextHolder}
      <h2 className="font-semibold text-2xl p-1">Trạng thái món ăn tại bàn</h2>
      <hr style={{ marginBottom: '16px' }} />
      {loading || isUpdating ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>
            {isUpdating
              ? 'Đang xử lý hủy món...'
              : `Đang tải ${orders.length > 0 ? orders.length : ''} đơn hàng...`}
          </p>
        </div>
      ) : (
        <Table columns={columns} dataSource={items} rowKey="key" pagination={false} />
      )}

      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong style={{ fontSize: '20px' }}>
          TỔNG CỘNG (Chưa thanh toán):
        </Text>
        <Text strong type="success" style={{ fontSize: '24px' }}>
          {totalBill.toLocaleString('vi-VN')} VNĐ
        </Text>
      </div>

      {allCompletedOrCancelledOrPaid && hasCompletedOrder && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            size="large"
            style={{ padding: '0 30px', fontSize: '18px' }}
            onClick={handlePaymentClick}
            disabled={
              safeOrders.length === 0 ||
              safeOrders.every((o) => o.status === 'Paid' || o.status === 'Cancelled')
            }
          >
            Yêu cầu Thanh toán
          </Button>
        </div>
      )}

      {isPaymentModalVisible && (
        <PaymentModal
          orders={safeOrders}
          items={items} // <--- THÊM DÒNG NÀY (Truyền danh sách món ăn vào modal)
          setOrders={setOrders}
          visible={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
        />
      )}
    </div>
  )
}

export default OrderPage
