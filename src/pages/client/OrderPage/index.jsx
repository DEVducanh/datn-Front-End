import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, Modal, message, Spin, Typography, Result, Tooltip, Input } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  SmileOutlined,
  StarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import http from '@/apis/http'
import PaymentModal from './paymentModal/index'
import dayjs from 'dayjs'

const { Text } = Typography

// API Endpoints
const BASE_ORDER_URL = '/orders'
const ORDER_ITEM_DETAIL_URL = '/order-item/order'
const BASE_ORDER_ITEM_URL = '/order-item'

// Cấu hình hiển thị trạng thái
const STATUS_CONFIG = {
  Pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang chờ xác nhận' },
  Processing: { color: 'blue', icon: <SyncOutlined spin />, text: 'Đang nấu' },
  Shipped: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã phục vụ' },
  Served: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã phục vụ' },
  Ready: { color: 'geekblue', icon: <CheckCircleOutlined />, text: 'Đã xong (Chờ bưng)' },
  Cancelled: { color: 'red', icon: <CloseCircleOutlined />, text: 'Đã hủy' },
  Paid: { color: 'magenta', icon: <CheckCircleOutlined />, text: 'Đã thanh toán' },
  'Pending Payment': { color: 'purple', icon: <DollarOutlined />, text: 'Chờ thanh toán' },
  Completed: { color: 'gold', icon: <CheckCircleOutlined />, text: 'Hoàn thành' },
}

const getItemStatusTag = (status) => {
  const config = STATUS_CONFIG[status]
  if (!config) return <Tag>{status}</Tag>
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  )
}

const OrderPage = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [currentTableId, setCurrentTableId] = useState(null)
  const [isPaidSuccess, setIsPaidSuccess] = useState(false)

  // State lưu ID đơn hàng vừa thanh toán xong để chuyển sang trang đánh giá
  const [lastPaidOrderId, setLastPaidOrderId] = useState(null)

  const [modalApi, modalContextHolder] = Modal.useModal()
  const [messageApi, contextHolder] = message.useMessage()

  // 1. Khởi tạo: Lấy ID bàn và bắt đầu polling dữ liệu
  useEffect(() => {
    const tableId = localStorage.getItem('currentTableId')
    if (tableId) {
      setCurrentTableId(tableId)
      fetchOrdersAndItems(tableId, false)

      // Tự động tải lại mỗi 5 giây
      const interval = setInterval(() => {
        fetchOrdersAndItems(tableId, true)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [])

  // Hàm phụ trợ: Lấy danh sách món theo ID đơn hàng
  const fetchOrderItemsByOrderId = async (orderId) => {
    try {
      const response = await http.get(`${ORDER_ITEM_DETAIL_URL}/${orderId}`)
      if (response.Orderitems) return response.Orderitems
      if (response.data) return response.data
      if (Array.isArray(response)) return response
      return []
    } catch (error) {
      return []
    }
  }

  // 2. Hàm chính: Lấy dữ liệu đơn hàng và món ăn
  const fetchOrdersAndItems = useCallback(
    async (tableId, isBackground = false) => {
      if (!isBackground) setLoading(true)
      try {
        const response = await http.get(BASE_ORDER_URL)
        let fetchedOrders = []

        // Xử lý các định dạng trả về của API
        if (Array.isArray(response)) fetchedOrders = response
        else if (response.data && Array.isArray(response.data)) fetchedOrders = response.data
        else if (response.data && Array.isArray(response.data.data))
          fetchedOrders = response.data.data

        // Lọc đơn hàng theo bàn hiện tại
        if (tableId) {
          fetchedOrders = fetchedOrders.filter((order) => {
            const orderTableId = order.table_id?._id || order.table_id
            return orderTableId === tableId
          })
        }

        // Kiểm tra xem đã thanh toán hết chưa để hiện màn hình cảm ơn
        const hasPaidOrder = fetchedOrders.some((o) => o.status === 'Paid')
        const allPaid = fetchedOrders.every((o) => o.status === 'Paid')

        if (hasPaidOrder && allPaid && fetchedOrders.length > 0) {
          setIsPaidSuccess(true)
          // Lưu lại ID đơn hàng cuối cùng (hoặc đầu tiên) để dùng cho trang đánh giá
          if (fetchedOrders[0]) {
            setLastPaidOrderId(fetchedOrders[0]._id)
          }
        } else {
          setIsPaidSuccess(false)
        }

        if (fetchedOrders.length === 0) {
          setItems([])
          if (!isBackground) setLoading(false)
          return
        }

        // Lấy chi tiết món cho từng đơn hàng
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

        // Lọc hiển thị: Chỉ ẩn món đã Paid. Vẫn hiện món Cancelled để khách biết.
        const allActiveItems = results.flat().filter((item) => item.orderStatus !== 'Paid')

        setItems(allActiveItems.reverse())
      } catch (error) {
        console.error('Lỗi tải đơn hàng:', error)
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [messageApi]
  )

  const handlePaymentClick = () => {
    // Chỉ tính các món CHƯA HỦY
    const validItems = items.filter((i) => i.status !== 'Cancelled')

    // Chỉ cho phép thanh toán khi có ít nhất 1 món đã phục vụ (hoặc đơn đã completed)
    const hasServedItems = validItems.some(
      (item) => ['Shipped', 'Served'].includes(item.status) || item.orderStatus === 'Completed'
    )

    if (!hasServedItems) {
      messageApi.warning('Chưa có món nào ĐÃ PHỤC VỤ để thanh toán.')
      return
    }
    setIsPaymentModalVisible(true)
  }

  // --- HÀM HỦY MÓN ---
  const handleCancelItem = (record) => {
    const { _id: itemId, status: currentStatus, dish_id, estimated_time } = record
    const dishName = dish_id?.dish_name || 'món này'
    let cancelReason = ''

    // Logic chặn hủy
    const deadStatuses = ['Shipped', 'Served', 'Cancelled', 'Paid', 'Completed', 'Ready']
    const now = dayjs()
    const eta = estimated_time ? dayjs(estimated_time) : null
    const isLate = eta && now.isAfter(eta)

    if (deadStatuses.includes(currentStatus)) {
      messageApi.warning(`Món đã xong hoặc đã phục vụ, không thể hủy.`)
      return
    }

    if (currentStatus === 'Processing' && !isLate) {
      messageApi.warning(`Bếp đang nấu đúng tiến độ. Không thể hủy!`)
      return
    }

    modalApi.confirm({
      title: 'Xác nhận hủy món?',
      icon: <DeleteOutlined style={{ color: 'red' }} />,
      content: (
        <div className="pt-2">
          <p>
            Bạn muốn hủy món <strong>{dishName}</strong>?
          </p>
          {isLate && (
            <p className="text-red-500 italic text-xs mb-2">(Được phép hủy do quá giờ dự kiến)</p>
          )}

          <div className="mt-3">
            <span className="text-gray-500 text-sm">Lý do hủy (bắt buộc):</span>
            <Input.TextArea
              placeholder="Ví dụ: Đổi món, đợi lâu quá..."
              rows={2}
              className="mt-1"
              onChange={(e) => (cancelReason = e.target.value)}
            />
          </div>
        </div>
      ),
      okText: 'Xác nhận Hủy',
      okType: 'danger',
      cancelText: 'Đóng',
      async onOk() {
        if (!cancelReason.trim()) {
          messageApi.warning('Vui lòng nhập lý do hủy!')
          return Promise.reject()
        }

        try {
          await http.patch(`${BASE_ORDER_ITEM_URL}/${itemId}/cancel`, { note: cancelReason })
          fetchOrdersAndItems(currentTableId, true)
          messageApi.success(`Đã hủy món ${dishName}`)
        } catch (error) {
          messageApi.error('Lỗi khi hủy món.')
        }
      },
    })
  }

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: 'Mã ĐH',
      dataIndex: 'orderId',
      render: (t) => t?.slice(0, 8),
      width: 90,
    },
    {
      title: 'Tên món',
      dataIndex: 'dish_id',
      render: (dish, record) => {
        const name = dish?.dish_name || '---'
        const dishId = dish?._id || record.dish_id
        const eta = record.estimated_time ? dayjs(record.estimated_time) : null
        const isLate = eta && dayjs().isAfter(eta) && record.status === 'Processing'
        const isCancelled = record.status === 'Cancelled'

        return (
          <div
            className="cursor-pointer group flex flex-col"
            onClick={() => dishId && navigate(`/flareon/product/${dishId}`)}
          >
            <span
              className={`font-semibold transition-colors ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-800 group-hover:text-orange-600'}`}
            >
              {name}
            </span>

            {isCancelled && record.note && (
              <span className="text-[10px] text-red-400 italic">Lý do: {record.note}</span>
            )}

            {['Pending', 'Processing'].includes(record.status) && eta && (
              <span
                className={`text-xs mt-1 flex items-center gap-1 ${isLate ? 'text-red-500 font-bold' : 'text-gray-500'}`}
              >
                <ClockCircleOutlined />
                {isLate ? `Trễ (${eta.format('HH:mm')})` : `Dự kiến: ${eta.format('HH:mm')}`}
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      render: (p) => `${Number(p).toLocaleString()}đ`,
      width: 110,
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      width: 50,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s) => getItemStatusTag(s),
      width: 130,
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (_, r) => {
        if (r.status === 'Cancelled')
          return (
            <Text delete type="secondary">
              0đ
            </Text>
          )
        return <Text>{(r.price * r.quantity).toLocaleString()}đ</Text>
      },
      width: 110,
    },
    {
      title: '',
      key: 'action',
      render: (_, r) => {
        const isFinished = [
          'Shipped', 'Served', 'Cancelled', 'Paid', 'Processing', 'Completed', 'Ready',
        ].includes(r.status)
        const isProcessing = r.status === 'Processing'
        const eta = r.estimated_time ? dayjs(r.estimated_time) : null
        const isLate = eta && dayjs().isAfter(eta)
        const canDelete = !isFinished && (!isProcessing || isLate)

        if (!canDelete) return null

        return (
          <Tooltip title={isLate ? 'Quá giờ dự kiến - Được phép hủy' : 'Hủy món'}>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              className={isLate ? 'animate-pulse border-red-600 text-red-600 bg-red-50' : ''}
              onClick={(e) => {
                e.stopPropagation()
                handleCancelItem(r)
              }}
            />
          </Tooltip>
        )
      },
      width: 60,
    },
  ]

  const totalBill = items.reduce((sum, item) => {
    if (item.status === 'Cancelled') return sum
    return sum + item.price * item.quantity
  }, 0)

  if (!currentTableId)
    return <div className="p-10 text-center text-red-500">Vui lòng quét mã QR.</div>

  // --- MÀN HÌNH THANH TOÁN THÀNH CÔNG ---
  if (isPaidSuccess && items.length === 0) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <Result
          icon={<SmileOutlined style={{ color: '#52c41a' }} />}
          title="Cảm ơn quý khách đã sử dụng dịch vụ!"
          subTitle="Đơn hàng đã được thanh toán hoàn tất."
          extra={[
            // NÚT ĐÁNH GIÁ (MỚI)
            <Button
              key="feedback"
              type="primary"
              size="large"
              icon={<StarOutlined />}
              className="bg-orange-500 hover:bg-orange-400"
              onClick={() => {
                if (lastPaidOrderId) {
                  navigate(`/flareon/feedback/${lastPaidOrderId}`)
                } else {
                  message.warning("Không tìm thấy đơn hàng để đánh giá!")
                  navigate('/flareon')
                }
              }}
            >
              Đánh giá món ăn
            </Button>,

            // Nút về trang chủ
            <Button key="back" size="large" onClick={() => (window.location.href = '/flareon')}>
              Về trang chủ
            </Button>,
          ]}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      {contextHolder}
      {modalContextHolder}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Đơn hàng tại bàn</h2>
        <Button icon={<SyncOutlined />} onClick={() => fetchOrdersAndItems(currentTableId)}>
          Tải lại
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center p-10">
          <Spin size="large" tip="Đang tải..." />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={items}
          rowKey="key"
          pagination={false}
          scroll={{ x: 600 }}
          locale={{ emptyText: 'Hiện không có món nào đang gọi.' }}
        />
      )}

      {items.length > 0 && (
        <>
          <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <Text strong className="text-lg">
              Tạm tính:
            </Text>
            <Text strong className="text-2xl text-orange-600">
              {totalBill.toLocaleString()} VNĐ
            </Text>
          </div>

          <div className="mt-6 text-center">
            <Button
              type="primary"
              size="large"
              icon={<FileDoneOutlined />}
              onClick={handlePaymentClick}
              disabled={items.filter((i) => i.status !== 'Cancelled').length === 0}
              className="bg-blue-600 hover:bg-blue-500 h-12 px-8 text-lg font-bold"
            >
              Thanh Toán (Món đã phục vụ)
            </Button>
          </div>
        </>
      )}

      <PaymentModal
        items={items.filter((i) => i.status !== 'Cancelled')}
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
      />
    </div>
  )
}

export default OrderPage