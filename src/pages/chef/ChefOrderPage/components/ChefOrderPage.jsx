import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Row, Col, Spin, Empty, Button } from 'antd'
import { ReloadOutlined, FireOutlined } from '@ant-design/icons'
import ChefOrderCard from './components/ChefOrderCard'

const ChefOrderPage = () => {
  const queryClient = useQueryClient()

  // 1. LẤY DANH SÁCH BÀN
  const { data: tables = [] } = useQuery({
    queryKey: ['chef-tables'],
    queryFn: async () => {
      const res = await http.get('/tables')
      return res.data || []
    },
  })

  // 2. LẤY ĐƠN HÀNG
  const { data: activeOrders = [], isLoading } = useQuery({
    queryKey: ['chef-active-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []

      if (!Array.isArray(data)) return []

      // Lọc đơn chưa hoàn thành
      return data.filter((order) => !['Completed', 'Cancelled', 'Paid'].includes(order.status))
    },
    refetchInterval: 5000,
  })

  // 3. HÀM TÌM TÊN BÀN (Đã sửa lỗi)
  const getTableName = (order) => {
    // Trường hợp 1: Backend đã gửi kèm tên bàn trong order
    if (order.table_id && (order.table_id.name || order.table_id.table_name)) {
      return order.table_id.name || order.table_id.table_name
    }

    // Trường hợp 2: Backend chỉ gửi ID, phải tìm trong danh sách tables
    const orderTableId = typeof order.table_id === 'object' ? order.table_id._id : order.table_id

    // So sánh tương đối (==) để tránh lỗi string vs objectId
    const foundTable = tables.find((t) => t._id == orderTableId)

    if (foundTable) return foundTable.name || foundTable.table_name

    return 'Mang về / Khác'
  }

  const sortedOrders = [...activeOrders].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-full text-orange-600">
            <FireOutlined className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 m-0">Bếp - Đơn hàng hiện tại</h1>
            <p className="text-gray-500 m-0 text-sm">Hệ thống hiển thị vé (KDS)</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <span className="font-bold text-lg text-orange-600">
            {activeOrders.length}{' '}
            <span className="text-gray-400 text-sm font-normal">đơn đang chờ</span>
          </span>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries(['chef-active-orders'])
              queryClient.invalidateQueries(['chef-tables'])
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center mt-20">
          <Spin size="large" tip="Đang tải đơn hàng..." />
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="mt-20">
          <Empty description="Hiện tại nhà bếp đang rảnh rỗi!" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {sortedOrders.map((order) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={order._id}>
              {/* Truyền tableName đã tìm được vào đây */}
              <ChefOrderCard order={order} tableName={getTableName(order)} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default ChefOrderPage
