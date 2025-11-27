import React from 'react'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Card, Tag, Progress, Spin } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
  ShopOutlined,
} from '@ant-design/icons'

const OrderSummaryCard = ({ order, onClick }) => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['chef-order-items-summary', order._id],
    queryFn: async () => {
      const res = await http.get(`/order-item/order/${order._id}`)
      // Xử lý các kiểu trả về của API
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
  })

  const tableName = order.table_id?.name || order.table_id?.table_name || 'Mang về'
  const time = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const totalItems = items.length
  const doneItems = items.filter((i) => ['Served', 'Ready', 'Cancelled'].includes(i.status)).length
  const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
  const isAllDone = totalItems > 0 && percent === 100

  return (
    <Card
      hoverable
      onClick={() => onClick(order)}
      className={`h-full shadow-sm hover:shadow-md transition-all border-l-4 ${isAllDone ? 'border-l-green-500' : 'border-l-orange-500'}`}
      bodyStyle={{ padding: '16px' }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {tableName === 'Mang về' ? (
            <ShopOutlined className="text-blue-500 text-xl" />
          ) : (
            <FireOutlined className="text-orange-500 text-xl" />
          )}
          <h3
            className="text-xl font-bold text-gray-800 m-0 truncate max-w-[120px]"
            title={tableName}
          >
            {tableName}
          </h3>
        </div>
        <Tag icon={<ClockCircleOutlined />} color="default">
          {time}
        </Tag>
      </div>
      <div className="mb-4">
        {isLoading ? (
          <div className="py-2 flex justify-center">
            <Spin size="small" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-400 text-sm">Trống</p>
        ) : (
          <>
            <div className="flex justify-between text-gray-500 text-sm mb-1">
              <span>Tiến độ</span>
              <span>
                {doneItems}/{totalItems} món
              </span>
            </div>
            <Progress
              percent={percent}
              size="small"
              status={isAllDone ? 'success' : 'active'}
              strokeColor={isAllDone ? '#52c41a' : '#fa8c16'}
            />
          </>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-4)}</span>
        {isAllDone ? (
          <Tag color="success" className="m-0 px-2 rounded-full">
            <CheckCircleOutlined /> Hoàn tất
          </Tag>
        ) : (
          <Tag color="processing" className="m-0 px-2 rounded-full">
            Đang nấu...
          </Tag>
        )}
      </div>
    </Card>
  )
}
export default OrderSummaryCard
