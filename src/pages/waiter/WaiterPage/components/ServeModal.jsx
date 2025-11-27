import React from 'react'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Modal, Button, Spin, Empty, Tag } from 'antd'
import ServeItemRow from './ServeItemRow'

const ServeModal = ({ isOpen, onClose, order }) => {
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['waiter-order-items', order?._id],
    queryFn: async () => {
      if (!order?._id) return []
      const res = await http.get(`/order-item/order/${order._id}`)
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    enabled: isOpen && !!order?._id,
    refetchInterval: 3000,
  })

  // Sắp xếp: Món "Ready" lên đầu, Món "Served" xuống cuối
  const sortedItems = [...items].sort((a, b) => {
    const statusOrder = { Ready: 1, Processing: 2, Pending: 3, Served: 4, Cancelled: 5 }
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
  })

  const tableName = order?.table_id?.name || order?.table_id?.table_name || 'Mang về'

  // Tính tổng quan
  const totalItems = items.length
  const servedCount = items.filter((i) => i.status === 'Served').length
  const readyCount = items.filter((i) => i.status === 'Ready').length

  return (
    <Modal
      title={
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-800">Bàn: {tableName}</span>
          <span className="text-xs text-gray-500 font-normal">
            Mã đơn: #{order?._id?.slice(-6)}
          </span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Đóng
        </Button>,
      ]}
      width={700}
      centered
    >
      {/* Thanh trạng thái tổng quan */}
      <div className="flex gap-2 mb-4">
        <Tag color="blue">Tổng: {totalItems} món</Tag>
        <Tag color="green">Đã ra: {servedCount}</Tag>
        {readyCount > 0 && (
          <Tag color="cyan" className="animate-pulse">
            Chờ bưng: {readyCount}
          </Tag>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="Không có món nào" />
        ) : (
          sortedItems.map((item) => (
            <ServeItemRow key={item._id} item={item} refetchItems={refetch} />
          ))
        )}
      </div>
    </Modal>
  )
}

export default ServeModal
