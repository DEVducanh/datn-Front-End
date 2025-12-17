import React, { useState, useEffect } from 'react'
import { Modal, Select, Button, message, Form, Typography } from 'antd'
import { SwapOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'

const { Text } = Typography

const MoveTableModal = ({ isOpen, onClose, currentTable, currentOrder }) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [targetTableId, setTargetTableId] = useState(null)

  // 1. Lấy danh sách bàn đang TRỐNG để chuyển tới
  const { data: availableTables = [] } = useQuery({
    queryKey: ['available-tables-for-move'],
    queryFn: async () => {
      const res = await http.get('/tables')
      const data = res.data || []
      // Chỉ lấy bàn 'available' (hoặc 'empty' tùy database của bạn)
      return data.filter(t => t.status === 'available' || t.status === 'empty')
    },
    enabled: isOpen, // Chỉ gọi API khi modal mở
  })

  // 2. Mutation thực hiện chuyển bàn
  const moveTableMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrder || !currentTable || !targetTableId) {
        throw new Error('Thiếu thông tin để chuyển bàn')
      }

      // Bước A: Cập nhật Đơn hàng (Đổi table_id sang bàn mới)
      // Lưu ý: API update order của bạn cần cho phép sửa table_id
      await http.patch(`/orders/${currentOrder._id}`, {
        table_id: targetTableId
      })

      // Bước B: Cập nhật trạng thái Bàn Mới -> Occupied
      await http.patch(`/tables/${targetTableId}`, { status: 'occupied' })

      // Bước C: Cập nhật trạng thái Bàn Cũ -> Available
      await http.patch(`/tables/${currentTable._id}`, { status: 'available' })
    },
    onSuccess: () => {
      message.success('Chuyển bàn thành công!')
      queryClient.invalidateQueries(['waiter-tables'])
      queryClient.invalidateQueries(['waiter-active-orders'])
      handleClose()
    },
    onError: (err) => {
      console.error(err)
      message.error('Lỗi khi chuyển bàn: ' + (err.response?.data?.message || err.message))
    }
  })

  const handleConfirm = () => {
    form.validateFields().then(() => {
      moveTableMutation.mutate()
    })
  }

  const handleClose = () => {
    form.resetFields()
    setTargetTableId(null)
    onClose()
  }

  return (
    <Modal
      title={<><SwapOutlined /> Chuyển bàn</>}
      open={isOpen}
      onCancel={handleClose}
      confirmLoading={moveTableMutation.isPending}
      onOk={handleConfirm}
      okText="Xác nhận chuyển"
      cancelText="Hủy"
      centered
    >
      <div className="flex items-center justify-between mb-6 px-4 py-2 bg-gray-50 rounded border">
        <div className="text-center">
          <Text type="secondary" className="text-xs">Hiện tại</Text>
          <div className="font-bold text-lg text-red-600">{currentTable?.table_name}</div>
        </div>
        <ArrowRightOutlined className="text-gray-400" />
        <div className="text-center">
          <Text type="secondary" className="text-xs">Chuyển tới</Text>
          <div className="font-bold text-lg text-green-600">
            {availableTables.find(t => t._id === targetTableId)?.table_name || '...'}
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="targetTable"
          label="Chọn bàn muốn chuyển đến"
          rules={[{ required: true, message: 'Vui lòng chọn bàn mới!' }]}
        >
          <Select
            placeholder="Chọn bàn trống..."
            onChange={(val) => setTargetTableId(val)}
            options={availableTables.map(t => ({
              value: t._id,
              label: `${t.table_name} (${t.capacity} ghế) - Trống`
            }))}
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MoveTableModal