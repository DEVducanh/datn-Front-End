import React, { useMemo } from 'react'
import { Card, Progress, Tag, Spin } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import ChefItemRow from './ChefItemRow'

const ChefOrderCard = ({ order, tableName }) => {
  // Lấy món ăn
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['chef-order-items', order._id],
    queryFn: async () => {
      const res = await http.get(`/order-item/order/${order._id}`)
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    refetchInterval: 5000,
  })

  // Phân loại
  const { pendingItems, processingItems, completedItems, shouldShowCard } = useMemo(() => {
    const validItems = items.filter((i) => i.status !== 'Cancelled')

    const pending = validItems.filter((i) => i.status === 'Pending')
    const processing = validItems.filter((i) => i.status === 'Processing')
    const completed = validItems.filter((i) => ['Ready', 'Served'].includes(i.status))

    return {
      pendingItems: pending,
      processingItems: processing,
      completedItems: completed,
      shouldShowCard: validItems.length > 0,
    }
  }, [items])

  const totalCount = items.filter((i) => i.status !== 'Cancelled').length
  const doneCount = completedItems.length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const timeString = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!shouldShowCard && !isLoading) return null

  return (
    <Card
      className="h-full shadow-md border-t-4 border-t-blue-500 flex flex-col hover:shadow-lg transition-shadow"
      bodyStyle={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex justify-between items-center mb-2 border-b pb-2 border-dashed">
        <div>
          <div className="text-lg font-bold text-gray-800">
            #{order._id.slice(-4).toUpperCase()}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <ClockCircleOutlined /> {timeString}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-blue-600 text-base">
            {tableName} {/* Hiển thị tên bàn ở đây */}
          </div>
          <Tag color={percent === 100 ? 'green' : 'blue'}>
            {doneCount}/{totalCount} món
          </Tag>
        </div>
      </div>

      <Progress
        percent={percent}
        size="small"
        status={percent === 100 ? 'success' : 'active'}
        className="mb-3"
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[400px]">
        {isLoading ? (
          <div className="text-center py-4">
            <Spin />
          </div>
        ) : (
          <>
            {/* 1. Đang nấu (Processing) - Hiện đầu tiên */}
            {processingItems.map((item) => (
              <ChefItemRow key={item._id} item={item} refetch={refetch} />
            ))}

            {/* 2. Chờ nấu (Pending) */}
            {pendingItems.map((item) => (
              <ChefItemRow key={item._id} item={item} refetch={refetch} />
            ))}

            {/* 3. Đã xong (Ready/Served) */}
            {completedItems.map((item) => (
              <ChefItemRow key={item._id} item={item} refetch={refetch} />
            ))}
          </>
        )}
      </div>
    </Card>
  )
}

export default ChefOrderCard
