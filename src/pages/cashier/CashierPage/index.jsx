import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Card, Tag, Button, Table, Space, Input, Statistic, Row, Col } from 'antd'
import { ReloadOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons'
import CashierPaymentModal from './components/CashierPaymentModal'

const CashierPage = () => {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  // API Lấy danh sách đơn hàng
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['cashier-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []

      // Thu ngân cần thấy:
      // 1. Đơn "Pending Payment" (Khách yêu cầu thanh toán) - Ưu tiên
      // 2. Đơn đang ăn ("Processing", "Served") để thanh toán bất cứ lúc nào
      // Bỏ qua đơn đã Completed hoặc Cancelled
      return data
        .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Paid')
        .sort((a, b) => {
          // Đưa đơn "Pending Payment" lên đầu
          if (a.status === 'Pending Payment') return -1
          if (b.status === 'Pending Payment') return 1
          return 0
        })
    },
    refetchInterval: 5000,
  })

  // Lọc theo tìm kiếm
  const filteredOrders = orders.filter(
    (o) =>
      (o.table_id?.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      o._id.includes(searchText)
  )

  const handleOpenPayment = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Bàn',
      dataIndex: 'table_id',
      render: (table) => <span className="font-bold text-lg">{table?.name || 'Mang về'}</span>,
    },
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      render: (id) => <span className="font-mono text-gray-500">#{id.slice(-6)}</span>,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      render: (price) => (
        <span className="font-bold text-red-600">{(price || 0).toLocaleString()}đ</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => {
        let color = 'default'
        if (status === 'Pending Payment') color = 'red' // Cần chú ý
        if (status === 'Served') color = 'green'
        return (
          <Tag
            color={color}
            className={status === 'Pending Payment' ? 'animate-pulse font-bold' : ''}
          >
            {status === 'Pending Payment' ? 'YÊU CẦU TT' : status}
          </Tag>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => handleOpenPayment(record)}
          className={
            record.status === 'Pending Payment' ? 'bg-red-500 hover:bg-red-400 border-red-500' : ''
          }
        >
          Thu tiền
        </Button>
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold m-0 text-gray-800">🏪 Thu Ngân (Cashier)</h1>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries(['cashier-orders'])}
          >
            Làm mới
          </Button>
        </div>

        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên bàn hoặc mã đơn..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={16} className="flex justify-end gap-4">
            <Statistic title="Đang phục vụ" value={orders.length} />
            <Statistic
              title="Yêu cầu thanh toán"
              value={orders.filter((o) => o.status === 'Pending Payment').length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <CashierPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  )
}

export default CashierPage
