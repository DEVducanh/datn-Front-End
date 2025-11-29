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
      const data = res.data?.data || res.data || [] // Xử lý các dạng trả về

      if (!Array.isArray(data)) return []

      // --- LOGIC LỌC ĐƠN HÀNG (ĐÃ SỬA) ---
      // Thu ngân cần thấy:
      // 1. Pending Payment: Khách gọi thanh toán.
      // 2. Completed: Đã chốt món xong xuôi, đang chờ thu tiền (quan trọng).
      // 3. Processing/Served: Đang ăn.
      // CHỈ ẨN: Paid (Đã xong hẳn) và Cancelled (Đã hủy)
      return data
        .filter((o) => o.status !== 'Paid' && o.status !== 'Cancelled')
        .sort((a, b) => {
          // Ưu tiên 1: Pending Payment (Đỏ)
          if (a.status === 'Pending Payment' && b.status !== 'Pending Payment') return -1
          if (b.status === 'Pending Payment' && a.status !== 'Pending Payment') return 1

          // Ưu tiên 2: Completed (Cần thu tiền ngay)
          if (a.status === 'Completed' && b.status !== 'Completed') return -1
          if (b.status === 'Completed' && a.status !== 'Completed') return 1

          return new Date(b.createdAt) - new Date(a.createdAt) // Mới nhất lên đầu
        })
    },
    refetchInterval: 5000, // Tự động refresh mỗi 5s
  })

  // Lọc theo tìm kiếm
  const filteredOrders = orders.filter((o) => {
    // Xử lý an toàn tên bàn
    const tableName = o.table_id?.name || o.table_id?.table_name || 'Mang về'
    return tableName.toLowerCase().includes(searchText.toLowerCase()) || o._id.includes(searchText)
  })

  const handleOpenPayment = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Bàn',
      dataIndex: 'table_id',
      render: (table) => {
        // Xử lý hiển thị an toàn
        const name = table?.name || table?.table_name || '---'
        return <span className="font-bold text-lg">{name}</span>
      },
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
        let text = status
        let className = ''

        if (status === 'Pending Payment') {
          color = 'red'
          text = 'KHÁCH GỌI THANH TOÁN'
          className = 'animate-pulse font-bold'
        } else if (status === 'Completed') {
          color = 'purple'
          text = 'CHỜ THU TIỀN' // Đã xong quy trình bếp, chờ tiền
        } else if (status === 'Served') {
          color = 'green'
        }

        return (
          <Tag color={color} className={className}>
            {text}
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
            record.status === 'Pending Payment'
              ? 'bg-red-500 hover:bg-red-400 border-red-500 shadow-md'
              : 'bg-blue-600'
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
            <Statistic
              title="Chờ thu tiền"
              value={orders.filter((o) => o.status === 'Completed').length}
              valueStyle={{ color: '#722ed1' }}
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
          locale={{ emptyText: 'Không có đơn hàng nào cần xử lý' }}
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
