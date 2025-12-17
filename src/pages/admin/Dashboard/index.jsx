import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Table,
  Tag,
  DatePicker,
  Select,
  Spin,
  Statistic,
  Row,
  Col,
  Tooltip,
  Empty,
  List,
  Avatar,
} from 'antd'
import {
  DollarSign,
  ShoppingBag,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
  Clock, // Icon cho hoạt động gần đây
  User, // Icon cho hoạt động gần đây
} from 'lucide-react'
import dayjs from 'dayjs'
import invoiceAPI from '@/apis/invoice/invoice.api'

// Format tiền tệ
const formatVnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'

// Hàm tính thời gian trôi qua (Cho phần Hoạt động gần đây)
const timeAgo = (dateString) => {
  if (!dateString) return 'Vừa xong'
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' năm trước'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' tháng trước'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' ngày trước'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' giờ trước'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' phút trước'
  return 'Vừa xong'
}

const { RangePicker } = DatePicker
const { Option } = Select

// --- COMPONENT BIỂU ĐỒ (CSS THUẦN) ---
const CustomBarChart = ({ data }) => {
  if (!data || data.length === 0) return <Empty description="Không có dữ liệu" />
  const maxValue = Math.max(...data.map((d) => d.revenue)) || 1

  return (
    <div className="w-full h-[300px] flex items-end gap-2 pt-10 pb-6 px-2 relative">
      <div className="absolute inset-0 border-b border-l border-gray-200 pointer-events-none" />
      {data.map((item, index) => {
        const heightPercent = (item.revenue / maxValue) * 100
        return (
          <Tooltip
            key={index}
            title={
              <div className="text-center">
                <div className="font-bold">{item.dateDisplay}</div>
                <div>{formatVnd(item.revenue)}</div>
                <div className="text-xs">({item.orders} đơn)</div>
              </div>
            }
          >
            <div className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
              <div
                style={{ height: `${heightPercent || 2}%` }}
                className={`w-full max-w-[40px] rounded-t-sm transition-all relative min-h-[4px] ${item.revenue > 0 ? 'bg-blue-400 group-hover:bg-blue-600' : 'bg-gray-100'}`}
              />
              <div className="mt-2 text-[10px] text-gray-500 w-full text-center truncate">
                {item.name}
              </div>
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}

// --- HÀM LẤY TÊN KHÁCH ---
// --- HÀM LẤY TÊN KHÁCH (Đã nâng cấp) ---
const getCustomerName = (record) => {
  if (!record) return 'Khách vãng lai'

  // 1. Ưu tiên lấy từ object "user" ngay trong Invoice (Như ảnh API bạn gửi)
  if (record.user && record.user.name && record.user.name !== 'string') {
    return record.user.name
  }

  // 2. Kiểm tra các biến thể khác (đề phòng backend đổi tên)
  if (record.user_id && (record.user_id.name || record.user_id.full_name)) {
    return record.user_id.name || record.user_id.full_name
  }

  // 3. Kiểm tra nếu order_id đã được populate (Trường hợp Backend sửa lại populate)
  // Xử lý cả trường hợp order_id là mảng hoặc object
  const order = Array.isArray(record.order_id) ? record.order_id[0] : record.order_id
  if (order && typeof order === 'object') {
    // Lấy guest_info trong order
    if (order.guest_info && order.guest_info.name) return order.guest_info.name
    // Lấy user trong order
    if (order.user && order.user.name) return order.user.name
  }

  // 4. Nếu vẫn không thấy tên -> Trả về mặc định
  return 'Khách lẻ'
}

const Dashboard = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')])
  const [filterType, setFilterType] = useState('thisMonth')

  // --- API LẤY DỮ LIỆU ---
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'dashboard_full_v2'],
    queryFn: async () => {
      try {
        const res = await invoiceAPI.getAll()
        return res?.data?.data || res?.data || res || []
      } catch (err) {
        return []
      }
    },
    staleTime: 0,
  })

  // --- TÍNH TOÁN SỐ LIỆU ---
  const { stats, chartData, recentOrders, activities } = useMemo(() => {
    if (!invoices.length) return { stats: {}, chartData: [], recentOrders: [], activities: [] }

    const startDate = dateRange ? dateRange[0] : dayjs().startOf('month')
    const endDate = dateRange ? dateRange[1] : dayjs().endOf('month')

    // 1. Lọc hóa đơn theo ngày
    const filteredInvoices = invoices.filter((inv) => {
      const d = dayjs(inv.created_at || inv.createdAt)
      return d.isAfter(startDate.startOf('day')) && d.isBefore(endDate.endOf('day'))
    })

    // 2. Tính tổng (Chỉ đơn thành công)
    const validInvoices = filteredInvoices.filter((i) =>
      ['paid', 'completed'].includes((i.status || '').toLowerCase())
    )

    const totalRevenue = validInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) || 0),
      0
    )
    const totalOrders = validInvoices.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // 3. Data Biểu đồ
    const dailyData = {}
    let curr = startDate.clone()
    const isLongRange = endDate.diff(startDate, 'day') > 31
    const formatKey = isLongRange ? 'MM/YYYY' : 'DD/MM'
    const stepUnit = isLongRange ? 'month' : 'day'

    while (curr.isBefore(endDate) || curr.isSame(endDate, stepUnit)) {
      const key = curr.format(formatKey)
      dailyData[key] = { name: key, dateDisplay: curr.format('DD/MM/YYYY'), revenue: 0, orders: 0 }
      curr = curr.add(1, stepUnit)
    }

    validInvoices.forEach((inv) => {
      const key = dayjs(inv.created_at || inv.createdAt).format(formatKey)
      if (dailyData[key]) {
        dailyData[key].revenue += Number(inv.total_amount) || 0
        dailyData[key].orders += 1
      }
    })

    // 4. Data Hoạt động gần đây (Lấy 6 cái mới nhất trong toàn bộ lịch sử hoặc trong khoảng lọc tùy bạn)
    // Ở đây mình lấy trong khoảng lọc để đồng bộ
    const sortedInvoices = [...filteredInvoices].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    const actList = sortedInvoices.slice(0, 6).map((inv) => {
      const name = getCustomerName(inv) // <--- Nó sẽ dùng logic mới ở trên
      return {
        id: inv._id,
        user: name, // Tên sẽ hiển thị đúng ở đây
        amount: inv.total_amount,
        time: timeAgo(inv.created_at || inv.createdAt),
        avatar: name.charAt(0).toUpperCase(),
        status: (inv.status || '').toLowerCase(),
      }
    })

    // 5. Growth
    const daysDiff = endDate.diff(startDate, 'day') + 1
    const prevInvoices = invoices.filter((inv) => {
      const d = dayjs(inv.created_at || inv.createdAt)
      return (
        ['paid', 'completed'].includes((inv.status || '').toLowerCase()) &&
        d.isAfter(startDate.subtract(daysDiff, 'day')) &&
        d.isBefore(startDate)
      )
    })
    const prevRevenue = prevInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0)
    let growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return {
      stats: {
        revenue: totalRevenue,
        orders: totalOrders,
        avgValue: avgOrderValue,
        growth,
        prevRevenue,
      },
      chartData: Object.values(dailyData),
      recentOrders: sortedInvoices.slice(0, 8), // Bảng bên trái lấy 8 dòng
      activities: actList, // List bên phải lấy 6 dòng
    }
  }, [invoices, dateRange])

  const handleFilterChange = (value) => {
    setFilterType(value)
    const today = dayjs()
    switch (value) {
      case 'today':
        setDateRange([today.startOf('day'), today.endOf('day')])
        break
      case 'thisWeek':
        setDateRange([today.startOf('week'), today.endOf('week')])
        break
      case 'thisMonth':
        setDateRange([today.startOf('month'), today.endOf('month')])
        break
      case 'thisYear':
        setDateRange([today.startOf('year'), today.endOf('year')])
        break
      default:
        break
    }
  }

  // Cột bảng đơn hàng
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      render: (id) => (
        <span className="text-gray-500 font-mono">#{id ? id.slice(-6).toUpperCase() : '---'}</span>
      ),
    },
    {
      title: 'Khách',
      render: (_, r) => <span className="text-xs font-medium">{getCustomerName(r)}</span>,
    },
    {
      title: 'Tổng',
      dataIndex: 'total_amount',
      align: 'right',
      render: (v) => <span className="font-bold text-xs">{formatVnd(v)}</span>,
    },
    {
      title: 'TT',
      dataIndex: 'status',
      align: 'center',
      width: 80,
      render: (s) => {
        const status = (s || '').toLowerCase()
        return (
          <Tag color={['paid', 'completed'].includes(status) ? 'success' : 'warning'}>
            {status === 'paid' ? 'OK' : s.toUpperCase()}
          </Tag>
        )
      },
    },
  ]

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Spin size="large" tip="Đang tải..." />
      </div>
    )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">Tổng quan</h1>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
          <Select
            value={filterType}
            onChange={handleFilterChange}
            style={{ width: 130 }}
            bordered={false}
          >
            <Option value="today">Hôm nay</Option>
            <Option value="thisWeek">Tuần này</Option>
            <Option value="thisMonth">Tháng này</Option>
            <Option value="thisYear">Năm nay</Option>
            <Option value="custom">Tùy chọn...</Option>
          </Select>
          <div className="w-[1px] bg-gray-200 my-1"></div>
          <RangePicker
            value={dateRange}
            onChange={(d) => {
              setDateRange(d)
              setFilterType('custom')
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            bordered={false}
          />
        </div>
      </div>

      {/* STATS CARDS */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl h-full border-l-4 border-green-500"
          >
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs uppercase">Doanh thu</span>}
              value={stats.revenue}
              formatter={formatVnd}
              valueStyle={{ fontWeight: 700, color: '#16a34a' }}
            />
            <div className="mt-2 text-xs flex items-center gap-1">
              {stats.growth >= 0 ? (
                <span className="text-green-600 bg-green-50 px-1 rounded flex items-center">
                  <ArrowUp size={12} /> {stats.growth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-500 bg-red-50 px-1 rounded flex items-center">
                  <ArrowDown size={12} /> {Math.abs(stats.growth).toFixed(1)}%
                </span>
              )}
              <span className="text-gray-400">so kỳ trước</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full border-l-4 border-blue-500">
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs uppercase">Đơn hàng</span>}
              value={stats.orders}
              valueStyle={{ fontWeight: 700 }}
            />
            <div className="mt-2 text-xs text-gray-400">Đơn hàng thành công</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl h-full border-l-4 border-orange-500"
          >
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs uppercase">TB / Đơn</span>}
              value={stats.avgValue}
              formatter={formatVnd}
              valueStyle={{ fontWeight: 700, color: '#f59e0b' }}
            />
            <div className="mt-2 text-xs text-gray-400">Giá trị trung bình</div>
          </Card>
        </Col>
      </Row>

      {/* CHART */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Calendar size={18} /> <span className="font-bold">Biểu đồ doanh thu</span>
          </div>
        }
        bordered={false}
        className="shadow-sm rounded-xl mb-6"
      >
        <CustomBarChart data={chartData} />
      </Card>

      {/* --- PHẦN GRID CHIA 2 CỘT: BẢNG ĐƠN & HOẠT ĐỘNG --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái (2/3): Bảng đơn hàng */}
        <div className="lg:col-span-2">
          <Card
            title={<span className="font-bold">Giao dịch gần đây</span>}
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <Table
              dataSource={recentOrders}
              columns={columns}
              pagination={false}
              rowKey="_id"
              size="small"
              locale={{ emptyText: 'Không có dữ liệu' }}
            />
          </Card>
        </div>

        {/* Cột Phải (1/3): Hoạt động gần đây (ĐÃ QUAY LẠI) */}
        <div className="lg:col-span-1">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Activity size={18} /> <span className="font-bold">Hoạt động</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            {activities.length === 0 ? (
              <Empty description="Chưa có hoạt động" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={activities}
                renderItem={(item) => (
                  <List.Item className="!px-0 !py-3 border-b border-gray-50 last:border-0">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: ['paid', 'completed'].includes(item.status)
                              ? '#f6ffed'
                              : '#fff7e6',
                            color: ['paid', 'completed'].includes(item.status)
                              ? '#52c41a'
                              : '#fa8c16',
                            border: '1px solid #f0f0f0',
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={
                        <span className="text-sm font-semibold text-gray-700">{item.user}</span>
                      }
                      description={
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">
                            đơn hàng{' '}
                            <span className="font-medium text-gray-700">
                              {formatVnd(item.amount)}
                            </span>
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {item.time}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
