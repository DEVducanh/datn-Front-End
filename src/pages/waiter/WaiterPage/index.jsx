import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Row, Col, Spin, Empty, Button, Tag, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import ServeModal from './components/ServeModal'
import TableCard from './components/TableCard'
import MoveTableModal from './components/MoveTableModal'

const WaiterPage = () => {
  const queryClient = useQueryClient()

  // State Modal Phục vụ
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isServeModalOpen, setIsServeModalOpen] = useState(false)

  // State Modal Chuyển bàn
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveData, setMoveData] = useState({ table: null, order: null })

  // 1. Lấy danh sách Bàn
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['waiter-tables'],
    queryFn: async () => {
      const res = await http.get('/tables')
      const data = res.data || []
      // Sắp xếp: Occupied lên đầu
      return data.sort((a, b) => {
        const score = { occupied: 2, empty: 1 }
        return (score[b.status] || 0) - (score[a.status] || 0)
      })
    },
    refetchInterval: 3000,
  })

  // 2. Lấy danh sách Đơn hàng
  const { data: activeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['waiter-active-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []
      return data.filter((o) => !['Completed', 'Cancelled', 'Paid'].includes(o.status))
    },
    refetchInterval: 5000,
  })

  const getOrderByTable = (tableId) => {
    return activeOrders.find((o) => {
      const tId = o.table_id?._id || o.table_id
      return tId === tableId
    })
  }

  // --- HÀM 1: Click vào thẻ -> Mở Phục Vụ ---
  const handleTableClick = (table, order) => {
    if (!order) {
      if (table.status === 'occupied') {
        message.info('Khách mới vào, chưa gọi món.')
      }
      return
    }
    setSelectedOrder(order)
    setIsServeModalOpen(true)
  }

  // --- HÀM 2: Click nút Chuyển -> Mở Chuyển Bàn ---
  const handleOpenMoveTable = (table, order) => {
    if (!order) {
      message.warning('Chưa có đơn hàng để chuyển!')
      return
    }
    setMoveData({ table, order })
    setIsMoveModalOpen(true)
  }

  const isLoading = loadingTables || loadingOrders

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 m-0">💁‍♂️ Phục vụ - Sơ đồ bàn</h1>
        <div className="flex gap-2">
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
      </div>

      {isLoading ? (
        <div className="flex justify-center mt-20">
          <Spin size="large" />
        </div>
      ) : tables.length === 0 ? (
        <Empty description="Chưa có bàn nào" />
      ) : (
        <Row gutter={[16, 16]}>
          {tables.map((table) => {
            const activeOrder = getOrderByTable(table._id)
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={table._id}>
                {/* TRUYỀN ĐỦ PROPS XUỐNG ĐÂY */}
                <TableCard
                  table={table}
                  activeOrder={activeOrder}
                  onClick={handleTableClick}
                  onMoveTable={handleOpenMoveTable} // <--- QUAN TRỌNG
                />
              </Col>
            )
          })}
        </Row>
      )}

      <ServeModal
        isOpen={isServeModalOpen}
        onClose={() => setIsServeModalOpen(false)}
        order={selectedOrder}
      />

      {/* Modal Chuyển Bàn */}
      <MoveTableModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        currentTable={moveData.table}
        currentOrder={moveData.order}
      />
    </div>
  )
}

export default WaiterPage
