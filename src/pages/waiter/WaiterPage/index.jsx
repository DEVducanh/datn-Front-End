import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Row, Col, Spin, Empty, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

// Import đầy đủ các Components
import ServeModal from './components/ServeModal'
import TableCard from './components/TableCard'
import MoveTableModal from './components/MoveTableModal'
import StatusModal from './components/StatusModal'

const WaiterPage = () => {
  const queryClient = useQueryClient()

  // --- STATE QUẢN LÝ CÁC MODAL ---
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isServeModalOpen, setIsServeModalOpen] = useState(false)

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveData, setMoveData] = useState({ table: null, order: null })

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusModalData, setStatusModalData] = useState({ table: null, order: null })

  // --- API ---

  // 1. Lấy danh sách Bàn (Tự động refresh mỗi 3s)
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['waiter-tables'],
    queryFn: async () => {
      const res = await http.get('/tables')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []

      // Sắp xếp ưu tiên: Có khách (occupied) -> Đặt trước (reserved) -> Trống (available)
      return data.sort((a, b) => {
        const score = { occupied: 3, reserved: 2, maintenance: 0, available: 1, empty: 1 }
        return (score[b.status] || 0) - (score[a.status] || 0)
      })
    },
    refetchInterval: 3000, // Quan trọng: Để cập nhật trạng thái bàn real-time
  })

  // 2. Lấy danh sách Đơn hàng (Tự động refresh mỗi 3s)
  const { data: activeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['waiter-active-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []

      // --- SỬA LỖI Ở ĐÂY: Lọc trạng thái không phân biệt hoa thường ---
      return data.filter((o) => {
        const status = (o.status || '').toLowerCase() // Chuyển về chữ thường
        // Những trạng thái này coi như "Đã xong", sẽ bị ẩn đi
        return !['completed', 'cancelled', 'paid'].includes(status)
      })
      // -------------------------------------------------------------
    },
    refetchInterval: 3000, // Quan trọng: Để biết khi nào đơn đã thanh toán xong
  })

  // Hàm helper: Tìm đơn hàng của bàn cụ thể
  const getOrderByTable = (tableId) => {
    return activeOrders.find((o) => {
      const tId = o.table_id?._id || o.table_id
      return tId === tableId
    })
  }

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

  // Click vào thẻ bàn -> Mở Modal Phục vụ (Serve)
  const handleTableClick = (table, order) => {
    if (!order) {
      if (table.status === 'occupied') {
        message.info('Bàn đang có khách nhưng chưa có đơn hàng.')
      }
      return
    }
    setSelectedOrder(order)
    setIsServeModalOpen(true)
  }

  // Click nút Chuyển bàn -> Mở Modal Chuyển (Move)
  const handleOpenMoveTable = (table, order) => {
    if (!order) {
      message.warning('Bàn này chưa có đơn hàng để chuyển!')
      return
    }
    setMoveData({ table, order })
    setIsMoveModalOpen(true)
  }

  // Click nút Sửa -> Mở Modal Đổi Trạng Thái (Status)
  const handleOpenStatusModal = (table) => {
    const order = getOrderByTable(table._id)
    setStatusModalData({ table, order })
    setIsStatusModalOpen(true)
  }

  const isLoading = loadingTables || loadingOrders

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">💁‍♂️ Phục vụ - Sơ đồ bàn</h1>
          <p className="text-gray-400 text-sm m-0">Tự động cập nhật sau mỗi 3 giây</p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries(['waiter-tables'])
              queryClient.invalidateQueries(['waiter-active-orders'])
              message.success('Đã làm mới dữ liệu')
            }}
          >
            Làm mới ngay
          </Button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1">
        {isLoading && tables.length === 0 ? (
          <div className="flex justify-center mt-20"><Spin size="large" tip="Đang tải..." /></div>
        ) : tables.length === 0 ? (
          <Empty description="Chưa có bàn nào trong hệ thống" />
        ) : (
          <Row gutter={[16, 16]}>
            {tables.map((table) => {
              const activeOrder = getOrderByTable(table._id)
              return (
                <Col xs={12} sm={8} md={6} lg={4} key={table._id}>
                  <TableCard
                    table={table}
                    activeOrder={activeOrder}
                    onClick={handleTableClick}
                    onMoveTable={handleOpenMoveTable}
                    onUpdateStatus={handleOpenStatusModal}
                  />
                </Col>
              )
            })}
          </Row>
        )}
      </div>

      {/* --- DANH SÁCH MODALS --- */}

      <ServeModal
        isOpen={isServeModalOpen}
        onClose={() => setIsServeModalOpen(false)}
        order={selectedOrder}
      />

      <MoveTableModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        currentTable={moveData.table}
        currentOrder={moveData.order}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        table={statusModalData.table}
        activeOrder={statusModalData.order}
      />
    </div>
  )
}

export default WaiterPage