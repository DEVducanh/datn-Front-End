import React, { useState, useMemo, useEffect } from 'react'
import { Modal, Select, Button, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { SwapOutlined, ArrowRightOutlined } from '@ant-design/icons'

const MoveTableModal = ({ isOpen, onClose, currentTable, currentOrder }) => {
  const queryClient = useQueryClient()
  const [targetTableId, setTargetTableId] = useState(null)

  // Reset state mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setTargetTableId(null)
    }
  }, [isOpen])

  // 1. Lấy danh sách bàn
  const { data: tables = [] } = useQuery({
    queryKey: ['waiter-tables-move'],
    queryFn: async () => {
      const res = await http.get('/tables')
      return res.data || []
    },
    enabled: isOpen,
  })

  // Lọc bàn trống
  const emptyTables = useMemo(() => {
    return tables.filter((t) => t.status === 'empty' && t._id !== currentTable?._id)
  }, [tables, currentTable])

  // 2. Mutation thực hiện chuyển
  const moveTableMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Đang thực hiện chuyển bàn...')

      // Check lại lần cuối cho chắc
      if (!targetTableId) throw new Error('Chưa chọn bàn đích!')
      if (!currentTable) throw new Error('Không xác định được bàn hiện tại!')

      // BƯỚC 1: Nếu có đơn hàng -> Cập nhật Table ID cho đơn hàng
      if (currentOrder && currentOrder._id) {
        console.log(`1. Chuyển đơn ${currentOrder._id} sang bàn ${targetTableId}`)
        await http.patch(`/orders/${currentOrder._id}`, { table_id: targetTableId })
      }

      // BƯỚC 2: Bàn Mới -> Có khách (Occupied)
      console.log(`2. Cập nhật bàn mới ${targetTableId} thành Occupied`)
      await http.patch(`/tables/${targetTableId}`, { status: 'occupied' })

      // BƯỚC 3: Bàn Cũ -> Trống (Empty)
      console.log(`3. Cập nhật bàn cũ ${currentTable._id} thành Empty`)
      await http.patch(`/tables/${currentTable._id}`, { status: 'empty' })
    },
    onSuccess: () => {
      message.success(`Chuyển sang bàn mới thành công!`)
      queryClient.invalidateQueries(['waiter-tables'])
      queryClient.invalidateQueries(['waiter-active-orders'])
      onClose()
    },
    onError: (err) => {
      console.error('❌ Lỗi chuyển bàn:', err)
      message.error('Lỗi hệ thống khi chuyển bàn.')
    },
  })

  // Hàm xử lý khi bấm nút "Xác nhận chuyển"
  const handleSubmit = () => {
    if (!targetTableId) {
      message.warning('Vui lòng chọn bàn muốn chuyển đến')
      return
    }

    // Gọi mutation trực tiếp luôn, không qua Modal.confirm nữa để tránh lỗi
    moveTableMutation.mutate()
  }

  const targetTableName = emptyTables.find((t) => t._id === targetTableId)?.table_name

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-blue-600">
          <SwapOutlined /> Chuyển bàn
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
    >
      <div className="flex flex-col gap-6">
        {/* Sơ đồ trực quan */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-center w-1/3">
            <div className="text-xs text-gray-500">Hiện tại</div>
            <div className="font-bold text-lg text-gray-700">
              {currentTable?.table_name || '???'}
            </div>
          </div>
          <ArrowRightOutlined className="text-gray-400 text-xl" />
          <div className="text-center w-1/3">
            <div className="text-xs text-gray-500">Chuyển đến</div>
            <div className="font-bold text-lg text-blue-600">{targetTableName || '...'}</div>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Chọn bàn trống:</label>
          <Select
            className="w-full"
            placeholder="Chọn bàn muốn chuyển đến..."
            size="large"
            onChange={(val) => setTargetTableId(val)}
            value={targetTableId}
            options={emptyTables.map((t) => ({
              label: `${t.table_name} (${t.capacity} ghế)`,
              value: t._id,
            }))}
            notFoundContent="Không có bàn trống"
          />
          {emptyTables.length === 0 && (
            <div className="text-red-500 text-xs mt-1">Hiện tại không còn bàn trống nào!</div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t mt-2">
          <Button onClick={onClose} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleSubmit}
            loading={moveTableMutation.isPending}
            disabled={!targetTableId}
            size="large"
            className="bg-blue-600"
          >
            Xác nhận chuyển
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default MoveTableModal
