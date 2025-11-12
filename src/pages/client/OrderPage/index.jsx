import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Tag } from 'antd'
import { EyeOutlined, CreditCardOutlined, DeleteOutlined } from '@ant-design/icons'
import http from '@/apis/http'

const mockOrders = [
  {
    id: 'ORD001',
    productName: 'Nước hoa Dior Sauvage',
    quantity: 2,
    price: 3500000,
    status: 'pending',
    createdAt: '2025-11-12 10:30',
  },
  {
    id: 'ORD002',
    productName: 'Nước hoa Chanel No.5',
    quantity: 1,
    price: 4200000,
    status: 'completed',
    createdAt: '2025-11-10 14:15',
  },
  {
    id: 'ORD003',
    productName: 'Nước hoa Gucci Bloom',
    quantity: 3,
    price: 3000000,
    status: 'pending',
    createdAt: '2025-11-09 09:50',
  },
]

const OrderPage = () => {
  const [orders, setOrders] = useState([])

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
        `http://localhost:8080/orders/by-table/${tableId}?userId=${userId}`
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

  return (
    <div style={{ padding: '24px' }}>
      <h2>Danh sách đơn hàng của bạn</h2>
      <Table columns={columns} dataSource={orders} rowKey="id" />
      {allCompletedOrCancelled && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            size="large" // tăng kích thước
            style={{ padding: '0 30px', fontSize: '18px' }} // tùy chỉnh padding và chữ
          >
            Thanh toán
          </Button>
        </div>
      )}
    </div>
  )
}

export default OrderPage
