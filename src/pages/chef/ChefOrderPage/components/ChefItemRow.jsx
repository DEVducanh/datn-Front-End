import React from 'react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { message, Select, Tag, Badge } from 'antd'
import { ITEM_STATUS_OPTIONS } from '../constants'

const ChefItemRow = ({ item, refetchItems }) => {
  const updateItemStatusMutation = useMutation({
    mutationFn: ({ itemId, status }) => http.patch(`/order-item/${itemId}/status`, { status }),
    onSuccess: () => {
      message.success('Cập nhật thành công!')
      refetchItems()
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Lỗi cập nhật trạng thái.'
      message.error(msg)
    },
  })

  const dishName = item.dish_id?.dish_name || item.dish_name || 'Món không rõ'
  const currentStatus = item.status || 'Pending'
  const isFinished =
    currentStatus === 'Served' || currentStatus === 'Ready' || currentStatus === 'Cancelled'

  return (
    <div
      className={`flex justify-between items-center p-3 mb-3 rounded-lg border transition-all ${isFinished ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-orange-100 shadow-sm'}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 font-bold rounded-md w-10 h-10 border border-red-100 flex-shrink-0">
          <span className="text-xs text-gray-400">SL</span>
          <span className="text-lg leading-none">{item.quantity}</span>
        </div>
        <span
          className={`font-medium text-lg ${isFinished ? 'line-through text-gray-400' : 'text-gray-800'}`}
        >
          {dishName}
        </span>
      </div>
      <Select
        value={currentStatus}
        style={{ width: 130 }}
        onChange={(val) => updateItemStatusMutation.mutate({ itemId: item._id, status: val })}
        disabled={updateItemStatusMutation.isPending}
        options={ITEM_STATUS_OPTIONS.map((opt) => ({
          value: opt.value,
          label: (
            <Tag color={opt.color} className="mr-0 w-full text-center">
              {opt.label}
            </Tag>
          ),
        }))}
      />
    </div>
  )
}
export default ChefItemRow
