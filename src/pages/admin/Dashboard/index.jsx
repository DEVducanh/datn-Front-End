import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Select,
  Spin,
  Statistic,
  Row,
  Col,
  Empty,
  List,
  Avatar,
  Progress,
  Tabs,
  DatePicker,
  Alert,
  Tag,
} from 'antd'
import {
  Activity,
  ArrowUp,
  ArrowDown,
  Clock,
  PieChart as PieChartIcon,
  Users,
  TrendingUp,
} from 'lucide-react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import invoiceAPI from '@/apis/invoice/invoice.api'
import http from '@/apis/http'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

dayjs.extend(isBetween)

// --- HELPERS (ĐỂ TRÊN CÙNG ĐỂ TRÁNH LỖI) ---
const formatVnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const timeAgo = (dateString) => {
  if (!dateString) return 'Vừa xong'
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

const getCustomerName = (record) => {
  if (!record) return 'Khách vãng lai'
  if (record.user?.name) return record.user.name
  if (record.user_id?.name) return record.user_id.name
  if (record.guest_info?.name) return record.guest_info.name

  const order = Array.isArray(record.order_id) ? record.order_id[0] : record.order_id
  if (order) {
    if (order.user?.name) return order.user.name
    if (order.guest_info?.name) return order.guest_info.name
  }
  return 'Khách lẻ'
}

const UserOutlined = () => (
  <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor">
    <path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path>
  </svg>
)

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

// --- BIỂU ĐỒ CỘT (Đã fix lỗi width) ---
const RevenueChart = ({ data }) => (
  <div style={{ width: '100%', height: 300 }}>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="dateDisplay" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(val) =>
            val >= 1000000 ? `${val / 1000000}M` : val >= 1000 ? `${val / 1000}k` : val
          }
        />
        <RechartsTooltip formatter={(val) => formatVnd(val)} labelStyle={{ color: '#333' }} />
        <Bar
          dataKey="revenue"
          name="Doanh thu"
          fill="#1890ff"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

const Dashboard = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')])
  const [filterType, setFilterType] = useState('thisMonth')

  // 1. LẤY HÓA ĐƠN
  const { data: invoices = [], isLoading: loadingInv } = useQuery({
    queryKey: ['invoices', 'dashboard-full'],
    queryFn: async () => {
      const res = await invoiceAPI.getAll()
      return res?.data?.data || res?.data || []
    },
  })

  // 2. LẤY ĐƠN HÀNG
  const { data: orders = [], isLoading: loadingOrd } = useQuery({
    queryKey: ['orders', 'dashboard-full'],
    queryFn: async () => {
      const res = await http.get('/orders')
      return res?.data?.data || res?.data || []
    },
  })

  // 3. [QUAN TRỌNG] LỌC ĐƠN HÀNG HỢP LỆ THEO NGÀY
  const validOrders = useMemo(() => {
    if (!orders.length) return []
    const start = dateRange ? dateRange[0].startOf('day') : dayjs().startOf('month')
    const end = dateRange ? dateRange[1].endOf('day') : dayjs().endOf('month')

    return orders.filter((ord) => {
      const d = dayjs(ord.created_at || ord.createdAt)
      return (
        d.isBetween(start, end, null, '[]') &&
        ['paid', 'completed', 'served'].includes((ord.status || '').toLowerCase())
      )
    })
  }, [orders, dateRange])

  // 4. [CỨU CÁNH] LẤY CHI TIẾT MÓN ĂN CHO CÁC ĐƠN HÀNG HỢP LỆ
  // Logic: Lặp qua từng đơn -> Gọi API detail -> Ghép lại
  const { data: detailItems = [], isLoading: loadingDetails } = useQuery({
    queryKey: ['order-details-batch', validOrders.map((o) => o._id).join(',')],
    queryFn: async () => {
      if (validOrders.length === 0) return []

      // Giới hạn chỉ lấy 50 đơn mới nhất để tránh treo máy nếu quá nhiều đơn
      const ordersToFetch = validOrders.slice(0, 50)

      console.log(`🔥 Đang tải chi tiết cho ${ordersToFetch.length} đơn hàng...`)

      try {
        const requests = ordersToFetch.map(
          (order) => http.get(`/order-item/order/${order._id}`).catch((err) => null) // Bắt lỗi từng cái để ko chết cả chùm
        )

        const responses = await Promise.all(requests)

        // Gộp tất cả item lại thành 1 mảng lớn
        let allItems = []
        responses.forEach((res) => {
          if (!res) return
          let items = []
          if (Array.isArray(res)) items = res
          else if (res.data && Array.isArray(res.data)) items = res.data
          else if (res.Orderitems) items = res.Orderitems

          allItems = [...allItems, ...items]
        })

        return allItems
      } catch (err) {
        console.error('Lỗi lấy chi tiết món:', err)
        return []
      }
    },
    enabled: validOrders.length > 0,
  })

  const isLoading = loadingInv || loadingOrd

  // --- LOGIC TÍNH TOÁN (ĐÃ CẬP NHẬT) ---
  const {
    stats,
    chartData,
    recentActivities,
    topItems,
    bottomItems,
    categoryStats,
    paymentStats,
    timeSlotStats,
    customerStats,
  } = useMemo(() => {
    const def = {
      stats: {},
      chartData: [],
      recentActivities: [],
      topItems: [],
      bottomItems: [],
      categoryStats: [],
      paymentStats: [],
      timeSlotStats: [],
      customerStats: { total: 0, new: 0, returning: 0 },
    }

    if (!invoices.length && !orders.length) return def

    const start = dateRange ? dateRange[0].startOf('day') : dayjs().startOf('month')
    const end = dateRange ? dateRange[1].endOf('day') : dayjs().endOf('month')

    const validInvoices = invoices.filter((inv) => {
      const d = dayjs(inv.created_at || inv.createdAt)
      return (
        d.isBetween(start, end, null, '[]') &&
        ['paid', 'completed'].includes((inv.status || '').toLowerCase())
      )
    })

    // --- A. THỐNG KÊ CƠ BẢN ---
    const totalRevenue = validInvoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
    const estimatedProfit = totalRevenue * 0.35
    const uniqueTables = new Set(
      validOrders.map((o) => o.table_id?._id || o.table_id).filter(Boolean)
    ).size

    const customerMap = {}
    validOrders.forEach((o) => {
      const key = o.user?._id || o.user_id || o.guest_info?.phone || 'unknown'
      if (key !== 'unknown') customerMap[key] = (customerMap[key] || 0) + 1
    })
    const totalCustomers = Object.keys(customerMap).length
    const returningCustomers = Object.values(customerMap).filter((count) => count > 1).length
    const newCustomers = totalCustomers - returningCustomers

    // --- B. BIỂU ĐỒ TIMELINE ---
    const dailyData = {}
    let curr = start.clone()
    while (curr.isBefore(end) || curr.isSame(end, 'day')) {
      const k = curr.format('DD/MM')
      dailyData[k] = { dateDisplay: k, revenue: 0, orders: 0 }
      curr = curr.add(1, 'day')
    }
    validInvoices.forEach((inv) => {
      const k = dayjs(inv.created_at || inv.createdAt).format('DD/MM')
      if (dailyData[k]) {
        dailyData[k].revenue += Number(inv.total_amount) || 0
        dailyData[k].orders += 1
      }
    })

    // --- C. TOP MÓN ĂN (SỬ DỤNG DỮ LIỆU CHI TIẾT VỪA TẢI) ---
    const itemMap = {}

    // Nếu có dữ liệu chi tiết tải về -> Dùng nó
    const sourceItems = detailItems.length > 0 ? detailItems : []

    sourceItems.forEach((it) => {
      let name = it.dish_name || it.product_name || it.name
      // Nếu chưa có tên, check trong dish_id object
      if (!name && it.dish_id && typeof it.dish_id === 'object') {
        name = it.dish_id.dish_name || it.dish_id.name
      }

      if (!name) return

      let cat = 'other'
      const lowerName = name.toLowerCase()
      if (
        ['trà', 'cafe', 'cà phê', 'nước', 'bia', 'drink', 'sting', 'coca'].some((k) =>
          lowerName.includes(k)
        )
      )
        cat = 'drink'
      else if (['bánh', 'kem', 'chè', 'dessert'].some((k) => lowerName.includes(k))) cat = 'dessert'
      else cat = 'food'

      const qty = Number(it.quantity || 1)
      const price = Number(it.price || 0)

      if (!itemMap[name]) itemMap[name] = { name, quantity: 0, revenue: 0, category: cat }
      itemMap[name].quantity += qty
      itemMap[name].revenue += price * qty
    })

    const sortedItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
    const top10 = sortedItems.slice(0, 10)
    const bottom5 = [...sortedItems]
      .reverse()
      .slice(0, 5)
      .filter((i) => i.quantity > 0)

    const catStatsRaw = { food: 0, drink: 0, dessert: 0, other: 0 }
    Object.values(itemMap).forEach((i) => {
      catStatsRaw[i.category] += i.revenue
    })
    const finalCatStats = [
      { name: 'Món chính', value: catStatsRaw.food },
      { name: 'Đồ uống', value: catStatsRaw.drink },
      { name: 'Tráng miệng', value: catStatsRaw.dessert },
    ].filter((i) => i.value > 0)

    // --- D. THANH TOÁN ---
    // Map order ID để tra cứu
    const orderLookup = {}
    validOrders.forEach((o) => {
      orderLookup[o._id] = o
    })

    const payMap = { Cash: 0, VnPay: 0, Other: 0 }
    validInvoices.forEach((inv) => {
      let method = inv.method
      if (!method) {
        const orderId = typeof inv.order_id === 'object' ? inv.order_id._id : inv.order_id
        const linkedOrder = orderLookup[orderId]
        if (linkedOrder) method = linkedOrder.payment?.method || linkedOrder.method
      }
      const m = (method || 'Cash').toLowerCase()
      if (m.includes('vn') || m.includes('qr') || m.includes('pay') || m.includes('card'))
        payMap.VnPay++
      else if (m.includes('cash') || m.includes('tiền')) payMap.Cash++
      else payMap.Cash++
    })
    const finalPayStats = [
      { name: 'Tiền mặt', value: payMap.Cash },
      { name: 'VNPay/QR', value: payMap.VnPay },
    ].filter((i) => i.value > 0)

    // --- E. GIỜ VÀNG ---
    const hoursMap = {
      'Trưa (11h-14h)': 0,
      'Chiều (14h-18h)': 0,
      'Tối (18h-23h)': 0,
      'Đêm (23h-11h)': 0,
    }
    validOrders.forEach((ord) => {
      const h = dayjs(ord.created_at || ord.createdAt).hour()
      if (h >= 11 && h < 14) hoursMap['Trưa (11h-14h)']++
      else if (h >= 14 && h < 18) hoursMap['Chiều (14h-18h)']++
      else if (h >= 18 && h <= 23) hoursMap['Tối (18h-23h)']++
    })
    const finalTimeStats = Object.entries(hoursMap).map(([k, v]) => ({ name: k, value: v }))

    // --- F. HOẠT ĐỘNG ---
    const activities = validInvoices
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((inv) => ({
        id: inv._id,
        user: getCustomerName(inv),
        amount: inv.total_amount,
        time: timeAgo(inv.created_at || inv.createdAt),
        status: inv.status,
      }))

    return {
      stats: {
        revenue: totalRevenue,
        profit: estimatedProfit,
        orders: validOrders.length,
        tables: uniqueTables,
      },
      chartData: Object.values(dailyData),
      recentActivities: activities,
      topItems: top10,
      bottomItems: bottom5,
      categoryStats: finalCatStats,
      paymentStats: finalPayStats,
      timeSlotStats: finalTimeStats,
      customerStats: { total: totalCustomers, new: newCustomers, returning: returningCustomers },
    }
  }, [invoices, validOrders, detailItems, dateRange])

  // --- UI HANDLERS ---
  const handleFilterChange = (val) => {
    setFilterType(val)
    const today = dayjs()
    if (val === 'today') setDateRange([today.startOf('day'), today.endOf('day')])
    else if (val === 'thisWeek') setDateRange([today.startOf('week'), today.endOf('week')])
    else if (val === 'thisMonth') setDateRange([today.startOf('month'), today.endOf('month')])
  }

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 m-0">Thống Kê Kinh Doanh</h1>
        <div className="flex gap-2 bg-white p-1 rounded-lg border">
          <Select
            value={filterType}
            onChange={handleFilterChange}
            bordered={false}
            style={{ width: 110 }}
          >
            <Option value="thisMonth">Tháng này</Option>
            <Option value="thisWeek">Tuần này</Option>
            <Option value="today">Hôm nay</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            bordered={false}
            allowClear={false}
            format="DD/MM/YYYY"
          />
        </div>
      </div>

      {loadingDetails && (
        <Alert
          message="Đang phân tích món ăn chi tiết, vui lòng đợi..."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* 1. KEY METRICS */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl border-l-4 border-blue-500">
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs">DOANH THU THUẦN</span>}
              value={stats.revenue}
              formatter={formatVnd}
              valueStyle={{ fontWeight: 800, color: '#1890ff' }}
            />
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Tổng thu thực tế
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl border-l-4 border-green-500">
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs">LỢI NHUẬN (35%)</span>}
              value={stats.profit}
              formatter={formatVnd}
              valueStyle={{ fontWeight: 800, color: '#52c41a' }}
            />
            <div className="text-xs text-gray-400 mt-1">Chưa trừ chi phí cố định</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl border-l-4 border-orange-500">
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs">TỔNG ĐƠN / BÀN</span>}
              value={`${stats.orders} / ${stats.tables}`}
              valueStyle={{ fontWeight: 800 }}
            />
            <div className="text-xs text-gray-400 mt-1">Số đơn hàng & Bàn phục vụ</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl border-l-4 border-purple-500">
            <Statistic
              title={<span className="text-gray-500 font-bold text-xs">KHÁCH HÀNG</span>}
              value={customerStats.total}
              prefix={<Users size={18} className="mr-1" />}
              valueStyle={{ fontWeight: 800 }}
            />
            <div className="flex gap-2 text-[10px] mt-1">
              <span className="text-blue-500 bg-blue-50 px-1 rounded">
                Mới: {customerStats.new}
              </span>
              <span className="text-purple-500 bg-purple-50 px-1 rounded">
                Cũ: {customerStats.returning}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2. CHARTS */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Activity size={18} /> <span className="font-bold">Biểu đồ doanh thu</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <RevenueChart data={chartData} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <PieChartIcon size={18} /> <span className="font-bold">Phân tích</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <Tabs defaultActiveKey="1" size="small">
              <TabPane tab="Danh mục" key="1">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatVnd(val)} />
                      <Legend
                        verticalAlign="bottom"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabPane>
              {/* <TabPane tab="Thanh toán" key="2">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={paymentStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {paymentStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#FFBB28', '#0088FE', '#FF8042'][index]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabPane> */}
              <TabPane tab="Giờ vàng" key="3">
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={timeSlotStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar
                        dataKey="value"
                        fill="#8884d8"
                        barSize={20}
                        radius={[0, 4, 4, 0]}
                        label={{ position: 'right', fill: '#666', fontSize: 12 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* 3. LISTS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUp size={18} /> <span className="font-bold">Top 5 Món Bán Chạy</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <Spin spinning={loadingDetails}>
              {topItems.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={topItems.slice(0, 5)}
                  renderItem={(item, index) => (
                    <List.Item className="!py-2">
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: index < 3 ? '#ffec3d' : '#f0f0f0',
                              color: '#000',
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        }
                        title={<span className="text-sm font-semibold">{item.name}</span>}
                        description={
                          <span className="text-xs text-gray-500">
                            Đã bán: <b>{item.quantity}</b> - Thu: {formatVnd(item.revenue)}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2 text-red-500">
                <ArrowDown size={18} /> <span className="font-bold">Món Ít Bán (Cần KM)</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <Spin spinning={loadingDetails}>
              {bottomItems.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={bottomItems}
                  renderItem={(item) => (
                    <List.Item className="!py-2">
                      <List.Item.Meta
                        title={<span className="text-sm text-gray-600">{item.name}</span>}
                        description={
                          <Progress
                            percent={item.quantity > 10 ? 100 : item.quantity * 10}
                            size="small"
                            status="exception"
                            showInfo={false}
                          />
                        }
                      />
                      <div className="text-xs font-bold text-gray-500 ml-2">
                        {item.quantity} suất
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Chưa có dữ liệu món ế" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Clock size={18} /> <span className="font-bold">Hoạt động mới</span>
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-xl h-full"
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item className="!py-3 border-b border-gray-50 last:border-0">
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                    }
                    title={<span className="text-sm font-medium">{item.user}</span>}
                    description={<div className="text-xs text-gray-400">{item.time}</div>}
                  />
                  <div className="text-right">
                    <div className="font-bold text-xs">{formatVnd(item.amount)}</div>
                    <Tag color="green" className="!mr-0 text-[10px]">
                      {item.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
