import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Row, Col, Spin, Empty, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import ServeModal from './components/ServeModal'
import TableCard from './components/TableCard'

const WaiterPage = () => {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Lấy danh sách Bàn
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['waiter-tables'],
    queryFn: async () => {
      const res = await http.get('/tables')
      return res.data || []
    },
  })

  // 2. Lấy danh sách Đơn hàng đang hoạt động
  const { data: activeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['waiter-active-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []
      // Lọc đơn chưa hoàn thành
      return data.filter((o) => !['Completed', 'Cancelled', 'Paid'].includes(o.status))
    },
    refetchInterval: 5000, // Refresh 5s/lần
  })

  // Helper: Tìm đơn hàng của bàn
  const getOrderByTable = (tableId) => {
    return activeOrders.find((o) => {
      // table_id có thể là string hoặc object
      const tId = o.table_id?._id || o.table_id
      return tId === tableId
    })
  }

  const handleTableClick = (table, order) => {
    if (!order) return // Bàn trống không bấm được
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const isLoading = loadingTables || loadingOrders

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 m-0">💁‍♂️ Phục vụ - Sơ đồ bàn</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            queryClient.invalidateQueries(['waiter-tables'])
            queryClient.invalidateQueries(['waiter-active-orders'])
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* Grid Tables */}
      {isLoading ? (
        <div className="flex justify-center mt-20">
          <Spin size="large" />
        </div>
      ) : tables.length === 0 ? (
        <Empty description="Chưa có bàn nào được tạo" />
      ) : (
        <Row gutter={[16, 16]}>
          {tables.map((table) => {
            const activeOrder = getOrderByTable(table._id)
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={table._id}>
                <TableCard table={table} activeOrder={activeOrder} onClick={handleTableClick} />
              </Col>
            )
          })}
        </Row>
      )}

      {/* Modal Phục Vụ */}
      <ServeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  )
}

export default WaiterPage
