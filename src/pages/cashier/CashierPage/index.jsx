import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import {
  Card,
  Tag,
  Button,
  Table,
  Input,
  Statistic,
  Row,
  Col,
  DatePicker,
  Select,
  Space,
} from 'antd'
import { ReloadOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons'
import CashierPaymentModal from './components/CashierPaymentModal'
import dayjs from 'dayjs'

const { Option } = Select

const CashierPage = () => {
  const queryClient = useQueryClient()

  // --- STATE BỘ LỌC (MỚI) ---
  const [searchText, setSearchText] = useState('')
  const [selectedDate, setSelectedDate] = useState(dayjs()) // Mặc định hôm nay
  const [selectedTable, setSelectedTable] = useState(null)
  const [statusFilter, setStatusFilter] = useState('active') // 'active', 'paid', 'all'

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // API Lấy danh sách đơn hàng (GIỮ NGUYÊN LOGIC CŨ)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['cashier-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []

      if (!Array.isArray(data)) return []

      // Lấy tất cả (trừ Cancelled) để có thể xem lại lịch sử
      return data.filter((o) => o.status !== 'Cancelled')
    },
    refetchInterval: 5000,
  })

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredOrders = useMemo(() => {
    // 1. Sắp xếp trước
    const sorted = [...orders].sort((a, b) => {
      // Ưu tiên Pending > Completed > Served...
      const priority = { 'Pending Payment': 4, Completed: 3, Served: 2, Processing: 2, Paid: 0 }
      const pA = priority[a.status] || 1
      const pB = priority[b.status] || 1
      if (pA !== pB) return pB - pA
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    // 2. Áp dụng bộ lọc
    return sorted.filter((o) => {
      // Tìm kiếm
      const tableName = o.table_id?.name || o.table_id?.table_name || 'Mang về'
      const matchesSearch =
        tableName.toLowerCase().includes(searchText.toLowerCase()) ||
        o._id.toLowerCase().includes(searchText.toLowerCase())

      // Ngày
      let matchesDate = true
      if (selectedDate) {
        const orderDate = dayjs(o.createdAt)
        matchesDate = orderDate.isSame(selectedDate, 'day')
      }

      // Bàn
      let matchesTable = true
      if (selectedTable) {
        const tId = o.table_id?._id || o.table_id
        matchesTable = tId === selectedTable
      }

      // Trạng thái
      let matchesStatus = true
      if (statusFilter === 'active') {
        matchesStatus = [
          'Pending Payment',
          'Completed',
          'Served',
          'Processing',
          'Pending',
        ].includes(o.status)
      } else if (statusFilter === 'paid') {
        matchesStatus = o.status === 'Paid'
      }

      return matchesSearch && matchesDate && matchesTable && matchesStatus
    })
  }, [orders, searchText, selectedDate, selectedTable, statusFilter])

  // Tạo danh sách bàn cho Dropdown
  const uniqueTables = useMemo(() => {
    const tables = []
    const map = new Map()
    orders.forEach((o) => {
      if (o.table_id && typeof o.table_id === 'object') {
        if (!map.has(o.table_id._id)) {
          map.set(o.table_id._id, true)
          tables.push({ id: o.table_id._id, name: o.table_id.name || o.table_id.table_name })
        }
      }
    })
    return tables.sort((a, b) => a.name.localeCompare(b.name))
  }, [orders])

  const handleOpenPayment = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  // Cột bảng
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (d) => dayjs(d).format('HH:mm'),
      width: 80,
    },
    {
      title: 'Bàn',
      dataIndex: 'table_id',
      render: (table) => {
        const name = table?.name || table?.table_name || 'Mang về'
        return <span className="font-bold text-lg">{name}</span>
      },
    },
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      render: (id) => (
        <span className="font-mono text-gray-500">#{id.slice(-6).toUpperCase()}</span>
      ),
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
        if (status === 'Pending Payment') {
          color = 'red'
          text = 'YÊU CẦU TT'
        } else if (status === 'Completed') {
          color = 'purple'
          text = 'CHỜ THU TIỀN'
        } else if (status === 'Served') {
          color = 'blue'
          text = 'ĐANG PHỤC VỤ'
        } else if (status === 'Paid') {
          color = 'green'
          text = 'ĐÃ THANH TOÁN'
        }

        return (
          <Tag color={color} className="font-bold">
            {text}
          </Tag>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        const isPaid = record.status === 'Paid'
        return (
          <Button
            type={isPaid ? 'default' : 'primary'}
            icon={<DollarOutlined />}
            onClick={() => handleOpenPayment(record)}
            className={!isPaid ? 'bg-blue-600 shadow-sm' : ''}
          >
            {isPaid ? 'Xem lại' : 'Thu tiền'}
          </Button>
        )
      },
    },
  ]

  // Thống kê nhanh
  const stats = useMemo(
    () => ({
      // Đếm dựa trên danh sách filtered hoặc orders gốc tùy nhu cầu (ở đây đếm trên orders gốc cho tổng quan)
      active: orders.filter((o) => ['Served', 'Processing', 'Pending'].includes(o.status)).length,
      pending: orders.filter((o) => o.status === 'Pending Payment').length,
      completed: orders.filter((o) => o.status === 'Completed').length,
    }),
    [orders]
  )

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold m-0 text-gray-800">🏪 Thu Ngân (Cashier)</h1>
          <Space>
            <div className="text-right mr-4 text-sm text-gray-500 hidden md:block">
              {dayjs().format('dddd, DD/MM/YYYY')}
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['cashier-orders'])}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {/* --- KHU VỰC BỘ LỌC --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end md:items-center">
          {/* Tabs Trạng thái */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'active' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
              onClick={() => setStatusFilter('active')}
            >
              Đang xử lý
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'paid' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
              onClick={() => setStatusFilter('paid')}
            >
              Đã thanh toán
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
              onClick={() => setStatusFilter('all')}
            >
              Tất cả
            </button>
          </div>

          {/* Inputs */}
          <div className="flex flex-1 gap-2 w-full md:w-auto overflow-x-auto">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm bàn / mã..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 160 }}
            />
            <DatePicker
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              style={{ width: 140 }}
              allowClear={false}
            />
            <Select
              placeholder="Lọc theo bàn"
              allowClear
              style={{ minWidth: 140 }}
              value={selectedTable}
              onChange={setSelectedTable}
            >
              {uniqueTables.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Thống kê (chỉ hiện khi tab Active) */}
        {statusFilter === 'active' && (
          <Row gutter={16} className="mt-2">
            <Col span={8}>
              <Statistic
                title="Yêu cầu thanh toán"
                value={stats.pending}
                valueStyle={{ color: '#cf1322', fontSize: 18 }}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Chờ thu tiền"
                value={stats.completed}
                valueStyle={{ color: '#722ed1', fontSize: 18 }}
              />
            </Col>
            <Col span={8}>
              <Statistic title="Đang phục vụ" value={stats.active} valueStyle={{ fontSize: 18 }} />
            </Col>
          </Row>
        )}
      </div>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không tìm thấy đơn hàng phù hợp' }}
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
