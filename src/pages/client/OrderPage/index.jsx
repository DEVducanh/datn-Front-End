import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Modal } from 'antd'
import { EyeOutlined, CreditCardOutlined, DeleteOutlined } from '@ant-design/icons'
import http from '@/apis/http'
import PaymentModal from './paymentModal/index'

const OrderPage = () => {
  const [orders, setOrders] = useState([])
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    let userId = null
    if (userData) {
      try {
        const user = JSON.parse(userData)
        userId = user._id
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
    }
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
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="default" icon={<EyeOutlined />}>
            Chi tiết
          </Button>
          {record.status === 'Pending' && (
            <Button type="primary" danger icon={<DeleteOutlined />}>
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
      <h2 className="font-semibold text-2xl p-1">Danh sách đơn hàng của bạn</h2>
      <hr />
      <Table columns={columns} dataSource={orders} rowKey="id" />
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
    </div>
  )
}

export default OrderPage
