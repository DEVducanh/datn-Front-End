import React from 'react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { Button, Tag, message, Badge } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { ORDER_ITEM_STATUS } from '../constants'

const ServeItemRow = ({ item, refetchItems }) => {
  // Mutation: Chuyển trạng thái từ Ready -> Served
  const serveItemMutation = useMutation({
    mutationFn: (itemId) =>
      http.patch(`/order-item/${itemId}/status`, { status: ORDER_ITEM_STATUS.SERVED }),
    onSuccess: () => {
      message.success('Đã cập nhật: Đã phục vụ!')
      refetchItems()
    },
    onError: () => message.error('Lỗi cập nhật.'),
  })

  const dishName = item.dish_id?.dish_name || item.dish_name || 'Món không rõ'
  const status = item.status

  // Logic hiển thị nút
  const isReady = status === ORDER_ITEM_STATUS.READY
  const isServed = status === ORDER_ITEM_STATUS.SERVED

  // Màu sắc trạng thái
  let statusTag = <Tag color="default">{status}</Tag>
  if (status === 'Processing') statusTag = <Tag color="blue">Đang nấu</Tag>
  if (status === 'Pending') statusTag = <Tag color="gold">Đang chờ</Tag>
  if (status === 'Ready')
    statusTag = (
      <Tag color="cyan" className="animate-pulse font-bold">
        Món đã xong
      </Tag>
    )
  if (status === 'Served') statusTag = <Tag color="green">Đã phục vụ</Tag>

  return (
    <div
      className={`flex justify-between items-center p-3 mb-2 rounded-lg border ${isReady ? 'bg-cyan-50 border-cyan-200' : 'bg-white border-gray-100'}`}
    >
      {/* Thông tin món */}
      <div className="flex items-center gap-3 flex-1">
        <Badge count={item.quantity} style={{ backgroundColor: '#1890ff' }} />
        <span
          className={`font-medium text-base ${isServed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
        >
          {dishName}
        </span>
      </div>

      {/* Hành động */}
      <div className="flex items-center gap-2">
        {isReady ? (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            className="bg-green-600 hover:bg-green-500"
            loading={serveItemMutation.isPending}
            onClick={() => serveItemMutation.mutate(item._id)}
          >
            Phục vụ
          </Button>
        ) : (
          statusTag
        )}
      </div>
    </div>
  )
}

export default ServeItemRow
