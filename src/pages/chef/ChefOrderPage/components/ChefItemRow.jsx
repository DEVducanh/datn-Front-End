import React from 'react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { Button, message, Tag, Badge, Popconfirm } from 'antd' // Thêm Popconfirm
import { FireOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons' // Thêm CloseOutlined

const ChefItemRow = ({ item, refetch }) => {
  // API cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: ({ itemId, newStatus }) =>
      http.patch(`/order-item/${itemId}/status`, { status: newStatus }),
    onSuccess: (data, variables) => {
      let msg = ''
      switch (variables.newStatus) {
        case 'Processing':
          msg = '👨‍🍳 Bắt đầu nấu!'
          break
        case 'Ready':
          msg = '✅ Món đã xong!'
          break
        case 'Cancelled':
          msg = '🗑️ Đã hủy món!'
          break
        default:
          msg = 'Đã cập nhật'
      }
      message.success(msg)
      refetch()
    },
    onError: () => message.error('Lỗi kết nối!'),
  })

  const handleUpdate = (newStatus) => {
    updateStatusMutation.mutate({ itemId: item._id, newStatus })
  }

  const status = item.status
  const dishName = item.dish_id?.dish_name || item.dish_name || 'Tên món lỗi'
  const note = item.note

  // --- TRẠNG THÁI: ĐÃ XONG HOẶC ĐÃ PHỤC VỤ ---
  if (status === 'Served' || status === 'Ready') {
    return (
      <div className="flex justify-between items-center p-2 mb-2 bg-gray-50 rounded border border-gray-100 opacity-60">
        <span className="text-gray-500 line-through text-sm">
          x{item.quantity} {dishName}
        </span>
        <Tag color="green">Đã xong</Tag>
      </div>
    )
  }

  // --- TRẠNG THÁI: ĐANG NẤU HOẶC CHỜ NẤU ---
  const isProcessing = status === 'Processing'
  const isPending = status === 'Pending'

  return (
    <div
      className={`p-3 mb-2 rounded border-l-4 shadow-sm transition-all ${
        isProcessing
          ? 'bg-blue-50 border-l-blue-500 border-blue-100'
          : 'bg-white border-l-orange-400 border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-gray-800 text-base">
          <Badge
            count={item.quantity}
            style={{ backgroundColor: isProcessing ? '#1890ff' : '#fa8c16' }}
            className="mr-2"
          />
          {dishName}
        </div>

        {/* NÚT HỦY MÓN (Nằm góc trên bên phải) */}
        {(isPending || isProcessing) && (
          <Popconfirm
            title="Hủy món này?"
            description="Bạn có chắc chắn muốn hủy món ăn này không?"
            onConfirm={() => handleUpdate('Cancelled')}
            okText="Hủy món"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<CloseOutlined />}
              className="hover:bg-red-50"
            />
          </Popconfirm>
        )}
      </div>

      {note && (
        <div className="mb-2 text-red-500 text-xs italic bg-red-50 p-1 rounded">Lưu ý: {note}</div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        {/* Nút NẤU NGAY */}
        {isPending && (
          <Button
            type="primary"
            size="small"
            className="bg-orange-500 hover:bg-orange-600 border-orange-500 flex-1 font-semibold"
            icon={<FireOutlined />}
            loading={updateStatusMutation.isPending}
            onClick={() => handleUpdate('Processing')}
          >
            Nấu ngay
          </Button>
        )}

        {/* Nút HOÀN TẤT */}
        {isProcessing && (
          <Button
            type="primary"
            size="small"
            className="bg-green-600 hover:bg-green-500 border-green-600 flex-1 font-semibold"
            icon={<CheckOutlined />}
            loading={updateStatusMutation.isPending}
            onClick={() => handleUpdate('Ready')}
          >
            Hoàn tất
          </Button>
        )}
      </div>
    </div>
  )
}

export default ChefItemRow
