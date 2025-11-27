import React from 'react'
import { Card, Badge, Tag } from 'antd'
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'

const TableCard = ({ table, activeOrder, onClick }) => {
  // Gọi API lấy chi tiết món để đếm số lượng
  const { data: items = [] } = useQuery({
    queryKey: ['waiter-card-items', activeOrder?._id],
    queryFn: async () => {
      if (!activeOrder) return []
      const res = await http.get(`/order-item/order/${activeOrder._id}`)
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    enabled: !!activeOrder,
    refetchInterval: 5000,
  })

  // Logic tính toán trạng thái
  const readyCount = items.filter((i) => i.status === 'Ready').length
  const isOccupied = table.status === 'occupied' || table.status === 'reserved' || !!activeOrder

  // Kiểm tra xem đã ra hết món chưa (Có đơn, có món, nhưng không còn món nào đang Ready/Pending/Processing)
  // Hoặc đơn giản là: Có đơn nhưng readyCount = 0
  const isAllServed = activeOrder && readyCount === 0 && items.length > 0

  // --- XỬ LÝ GIAO DIỆN CARD ---
  let cardClass = 'h-full shadow-sm hover:shadow-md transition-all cursor-pointer border-t-4'
  let statusText = ''
  let statusIcon = null
  let statusColorClass = ''

  if (!isOccupied) {
    // Bàn trống
    cardClass += ' border-t-gray-300 bg-gray-50 opacity-70'
    statusText = 'Bàn trống'
    statusColorClass = 'text-gray-400'
  } else if (readyCount > 0) {
    // Có món Bếp vừa nấu xong -> Cần bưng gấp
    cardClass += ' border-t-cyan-500 bg-cyan-50'
    statusText = `${readyCount} món chờ phục vụ!`
    statusIcon = <div className="animate-bounce">🔔</div>
    statusColorClass = 'text-cyan-600 font-bold'
  } else if (isAllServed) {
    // Đã bưng hết -> Khách đang ăn
    cardClass += ' border-t-green-500 bg-green-50'
    statusText = 'Đã ra đủ món'
    statusIcon = <CheckCircleOutlined />
    statusColorClass = 'text-green-600 font-medium'
  } else {
    // Khách mới vào / Đang chờ bếp nấu
    cardClass += ' border-t-orange-400 bg-white'
    statusText = 'Đang chờ món...'
    statusIcon = <ClockCircleOutlined />
    statusColorClass = 'text-orange-500'
  }

  return (
    <Card
      className={cardClass}
      bodyStyle={{
        padding: '12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      // Luôn cho phép bấm nếu bàn có khách
      onClick={() => isOccupied && onClick(table, activeOrder)}
    >
      {/* Header Card */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-700 m-0">{table.table_name}</h3>
          <p className="text-gray-400 text-xs m-0">{table.capacity} ghế</p>
        </div>

        {isOccupied ? (
          <Badge count={readyCount} showZero={false}>
            <div
              className={`p-2 rounded-full ${readyCount > 0 ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              <UserOutlined className="text-lg" />
            </div>
          </Badge>
        ) : (
          <div className="p-2 rounded-full bg-gray-100 text-gray-300 border border-dashed border-gray-300">
            <UserOutlined className="text-lg" />
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className={`flex items-center gap-2 text-sm ${statusColorClass}`}>
        {statusIcon}
        <span>{statusText}</span>
      </div>
    </Card>
  )
}

export default TableCard
