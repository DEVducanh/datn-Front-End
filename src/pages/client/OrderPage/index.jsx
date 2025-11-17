import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Modal, message } from 'antd'
import { EyeOutlined, CreditCardOutlined, DeleteOutlined } from '@ant-design/icons'
import http from '@/apis/http'
import PaymentModal from './paymentModal/index'
import OrderDetailModal from './OrderDetailModal/index'

const OrderPage = () => {
  const [orders, setOrders] = useState([])
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  const [modalApi, modalContextHolder] = Modal.useModal()
  const [messageApi, contextHolder] = message.useMessage()

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
      fetchOrders(userId, tableId)
    }
  }, [])

  const fetchOrders = async (userId, tableId) => {
    try {
      const res = await http.get(
        `https://api-datn-orderfood-backend-2.onrender.com/orders/by-table/${tableId}?userId=${userId}`
      )
      const data = res.data
      setOrders(data)
    } catch (error) {
      console.error('Lỗi khi fetch orders:', error)
      messageApi.error('Không thể tải danh sách đơn hàng.')
    }
  }

  // --- HÀM XỬ LÝ HỦY ĐƠN HÀNG (ĐÃ SỬA ĐỔI) ---
  const handleCancelOrder = (orderId) => {
    const tableId = localStorage.getItem('currentTableId')

    modalApi.confirm({
      title: 'Xác nhận hủy đơn hàng?',
      content: 'Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.',
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      async onOk() {
        if (!currentUserId || !tableId) {
          messageApi.error('Lỗi: Không tìm thấy thông tin người dùng hoặc bàn.')
          return;
        }

        try {
          const BASE_URL = 'https://api-datn-orderfood-backend-2.onrender.com';

          // GỌI API PATCH /orders/{id}/cancel
          // Nếu API thành công (trả về 2xx), code sẽ tiếp tục chạy
          await http.patch(`${BASE_URL}/orders/${orderId}/cancel`)

          // ✅ LOGIC MỚI: CẬP NHẬT TRẠNG THÁI TỨC THỜI VÀ BÁO THÀNH CÔNG
          // Đây là hành động được thực hiện ngay sau khi API trả về 2xx
          messageApi.success(`Đơn hàng #${orderId.slice(-8)} đã được hủy thành công!`)

          setOrders(prevOrders =>
            prevOrders.map(order =>
              order._id === orderId ? { ...order, status: 'Cancelled' } : order
            )
          );

        } catch (error) {
          // Lỗi chỉ xảy ra khi API trả về 4xx hoặc 5xx (tức là HỦY ĐƠN THỰC SỰ THẤT BẠI)
          console.error('Lỗi API khi hủy đơn hàng:', error)
          const status = error.response?.status
          let errorMsg = error.response?.data?.message || 'Có lỗi xảy ra trong quá trình hủy đơn.'

          // Xử lý trường hợp lỗi 404/400 cụ thể
          if (status === 404) {
            errorMsg = 'Lỗi 404: Không tìm thấy đơn hàng hoặc đơn hàng đã bị hủy trước đó.'
          } else if (status === 400 && errorMsg.includes('status')) {
            errorMsg = 'Đơn hàng này không thể hủy vì trạng thái hiện tại không phải Pending.'
          }

          messageApi.error(errorMsg)
        }
      },
    })
  }
  // ------------------------------------

  const handleViewDetail = (record) => {
    console.log('Đang xem chi tiết đơn hàng ID:', record._id)
    setSelectedOrder(record)
    setIsDetailModalVisible(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    setSelectedOrder(null)
  }

  const allCompletedOrCancelled = orders.every(
    (order) => order.status === 'Completed' || order.status === 'Cancelled'
  )

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: '_id',
      key: '_id',
      render: (text) => text.slice(0, 8),
    },
    {
      title: 'Giá',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => `${Number(price).toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue'
        if (status === 'Completed') color = 'green'
        if (status === 'Pending') color = 'orange'
        if (status === 'Cancelled') color = 'red'
        return <Tag color={color}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="default" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            Chi tiết
          </Button>
          {record.status === 'Pending' && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelOrder(record._id)}
            >
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handlePaymentClick = () => {
    setIsPaymentModalVisible(true)
  }

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      {modalContextHolder}
      <h2 className="font-semibold text-2xl p-1">Danh sách đơn hàng của bạn</h2>
      <hr />
      <Table columns={columns} dataSource={orders} rowKey="_id" />
      {allCompletedOrCancelled && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            size="large"
            style={{ padding: '0 30px', fontSize: '18px' }}
            onClick={handlePaymentClick}
          >
            Thanh toán
          </Button>
        </div>
      )}
      {isPaymentModalVisible && (
        <PaymentModal
          orders={orders}
          setOrders={setOrders}
          visible={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
        />
      )}

      {isDetailModalVisible && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          visible={isDetailModalVisible}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  )
}

export default OrderPage