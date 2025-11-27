import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Table, Tag, Progress, List, Avatar, Spin, Statistic } from 'antd'
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from 'lucide-react'
import invoiceAPI from '@/apis/invoice/invoice.api'

// Format tiền tệ
const formatVnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'

// Hàm tính thời gian
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

// --- HÀM LẤY TÊN KHÁCH (QUÉT SẠCH MỌI TRƯỜNG DỮ LIỆU) ---
const getCustomerName = (record) => {
  if (!record) return 'Khách vãng lai'

  // Hàm phụ: Tìm tên trong 1 object bất kỳ
  const extractName = (obj) => {
    if (!obj) return null
    // Ưu tiên name -> full_name -> username -> email
    return obj.name || obj.full_name || obj.username || obj.email || obj.display_name
  }

  // 1. Tìm trong field 'user' (Thường gặp nhất)
  if (record.user && typeof record.user === 'object') {
    const name = extractName(record.user)
    if (name) return name
  }

  // 2. Tìm trong field 'user_id' (Nếu backend trả về populate)
  if (record.user_id && typeof record.user_id === 'object') {
    const name = extractName(record.user_id)
    if (name) return name
  }

  // 3. Tìm trong order_id (Nếu lồng nhau)
  const order = Array.isArray(record.order_id) ? record.order_id[0] : record.order_id
  if (order) {
    if (order.user && typeof order.user === 'object') {
      const name = extractName(order.user)
      if (name) return name
    }
    if (order.user_id && typeof order.user_id === 'object') {
      const name = extractName(order.user_id)
      if (name) return name
    }
  }

  // 4. Nếu vẫn không thấy object, kiểm tra xem có string ID không
  if (typeof record.user === 'string') return `Khách (ID: ${record.user.slice(-4)})`
  if (typeof record.user_id === 'string') return `Khách (ID: ${record.user_id.slice(-4)})`

  // 5. Đường cùng
  return 'Khách vãng lai'
}

const Dashboard = () => {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'dashboard_final_fix_name'],
    queryFn: async () => {
      try {
        const res = await invoiceAPI.getAll()
        if (res?.data?.data) return res.data.data
        if (res?.data) return res.data
        return res || []
      } catch (err) {
        return []
      }
    },
    staleTime: 1000 * 60 * 2,
  })

  const { stats, activities } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let result = {
      revenue: 0,
      totalOrders: 0,
      successOrders: 0,
      cancelledOrders: 0,
      growth: 0,
      kpiTarget: 1000000,
      kpiPercent: 0,
      recentOrders: [],
    }

    if (!invoices || invoices.length === 0) return { stats: result, activities: [] }

    const thisMonthInvoices = []
    const lastMonthInvoices = []
    let firstOrderDate = now

    invoices.forEach((inv) => {
      const dateStr = inv.created_at || inv.createdAt
      if (!dateStr) return

      const d = new Date(dateStr)
      if (d < firstOrderDate) firstOrderDate = d

      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonthInvoices.push(inv)
      }

      const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      if (d.getMonth() === lastMonthIndex && d.getFullYear() === lastMonthYear) {
        lastMonthInvoices.push(inv)
      }
    })

    // Doanh thu
    const calculateRevenue = (list) =>
      list
        .filter((inv) => {
          const status = (inv.status || '').toLowerCase().trim()
          return status === 'paid' || status === 'completed'
        })
        .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)

    const revenueThisMonth = calculateRevenue(thisMonthInvoices)
    const revenueLastMonth = calculateRevenue(lastMonthInvoices)

    // Tăng trưởng
    let growthRate = 0
    if (revenueLastMonth > 0) {
      growthRate = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    }

    // KPI
    const monthsDiff =
      (currentYear - firstOrderDate.getFullYear()) * 12 + (currentMonth - firstOrderDate.getMonth())
    const kpiTarget = 1000000 + Math.max(0, monthsDiff) * 1000000
    const kpiPercent =
      kpiTarget > 0 ? Math.min(100, Math.round((revenueThisMonth / kpiTarget) * 100)) : 0

    // Số liệu khác
    const successOrders = thisMonthInvoices.filter((i) =>
      ['paid', 'completed'].includes((i.status || '').toLowerCase())
    ).length
    const cancelledOrders = thisMonthInvoices.filter((i) =>
      ['cancelled', 'rejected'].includes((i.status || '').toLowerCase())
    ).length

    // Sắp xếp
    const sortedAll = [...invoices].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0)
      const dateB = new Date(b.created_at || b.createdAt || 0)
      return dateB - dateA
    })

    result = {
      revenue: revenueThisMonth,
      totalOrders: thisMonthInvoices.length,
      successOrders,
      cancelledOrders,
      growth: growthRate,
      kpiTarget,
      kpiPercent,
      recentOrders: sortedAll.slice(0, 5),
    }

    // Hoạt động gần đây (Activity Log)
    const act = sortedAll.slice(0, 5).map((inv) => {
      const name = getCustomerName(inv) // Sử dụng hàm đã fix
      const dateStr = inv.created_at || inv.createdAt
      const firstChar = name ? name.charAt(0).toUpperCase() : 'K'

      return {
        user: name,
        amount: inv.total_amount,
        time: timeAgo(dateStr),
        avatar: firstChar,
        status: (inv.status || '').toLowerCase(),
      }
    })

    return { stats: result, activities: act }
  }, [invoices])

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (id) => (
        <span className="font-mono text-gray-500">#{id ? id.slice(-6).toUpperCase() : '...'}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <span className="font-medium text-gray-700">{getCustomerName(record)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = (status || '').toLowerCase()
        let color = 'default'
        if (s === 'paid' || s === 'completed') color = 'success'
        else if (s === 'unpaid' || s === 'pending') color = 'warning'
        else if (s === 'cancelled') color = 'error'
        return <Tag color={color}>{(status || 'UNKNOWN').toUpperCase()}</Tag>
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (amount) => <span className="font-bold text-gray-700">{formatVnd(amount)}</span>,
    },
  ]

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Spin size="large" tip="Đang tải..." />
      </div>
    )

  const currentMonthDisplay = new Date().getMonth() + 1

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Trang tổng quan</h1>
        <span className="text-gray-500">Trang chủ / Thống kê</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card bordered={false} className="shadow-sm rounded-lg border-l-4 border-green-500">
          <Statistic
            title={
              <span className="text-gray-600 font-bold text-xs uppercase">
                Doanh thu Tháng {currentMonthDisplay}
              </span>
            }
            value={stats.revenue}
            formatter={(val) => formatVnd(val)}
            prefix={<DollarSign size={20} className="text-green-600" />}
            valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
          />
          <div className="mt-2 text-xs text-gray-400">Đã thanh toán</div>
        </Card>

        <Card bordered={false} className="shadow-sm rounded-lg border-l-4 border-orange-500">
          <Statistic
            title={
              <span className="text-gray-600 font-bold text-xs uppercase">
                Đơn hàng Tháng {currentMonthDisplay}
              </span>
            }
            value={stats.totalOrders}
            prefix={<ShoppingBag size={20} className="text-orange-500" />}
            valueStyle={{ fontWeight: 'bold' }}
          />
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-green-600 flex items-center gap-1 bg-green-50 px-1.5 rounded">
              <CheckCircle size={10} /> {stats.successOrders}
            </span>
            <span className="text-red-500 flex items-center gap-1 bg-red-50 px-1.5 rounded">
              <XCircle size={10} /> {stats.cancelledOrders}
            </span>
          </div>
        </Card>

        <Card bordered={false} className="shadow-sm rounded-lg">
          <Statistic
            title={<span className="text-gray-500 font-medium text-xs">Tăng trưởng TB</span>}
            value={stats.growth}
            precision={1}
            suffix="%"
            prefix={
              <TrendingUp
                size={20}
                className={stats.growth >= 0 ? 'text-blue-500' : 'text-red-500'}
              />
            }
            valueStyle={{ color: stats.growth >= 0 ? '#3b82f6' : '#ef4444' }}
          />
          <div className="mt-2 text-xs text-gray-400">So với tháng trước</div>
        </Card>

        <Card bordered={false} className="shadow-sm rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 font-medium text-xs">
              KPI Tháng {currentMonthDisplay}
            </span>
            <span className="font-bold text-gray-700">{stats.kpiPercent}%</span>
          </div>
          <Progress
            percent={stats.kpiPercent}
            showInfo={false}
            strokeColor="#3b82f6"
            size="small"
          />
          <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
            <span>Mục tiêu:</span>
            <span className="font-bold text-blue-600">{formatVnd(stats.kpiTarget)}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Đơn hàng mới nhất" bordered={false} className="shadow-sm rounded-lg h-full">
            <Table
              dataSource={stats.recentOrders}
              columns={columns}
              pagination={false}
              rowKey="_id"
              size="middle"
              locale={{ emptyText: 'Chưa có đơn hàng nào' }}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Activity size={18} /> Hoạt động gần đây
              </div>
            }
            bordered={false}
            className="shadow-sm rounded-lg h-full"
          >
            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Chưa có hoạt động nào</p>
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
                            backgroundColor:
                              item.status === 'paid' || item.status === 'completed'
                                ? '#f6ffed'
                                : '#fff7e6',
                            color:
                              item.status === 'paid' || item.status === 'completed'
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
                            đã mua đơn hàng{' '}
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
