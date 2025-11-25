import React from 'react'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Modal, Button, Spin, Empty } from 'antd'
import { FireOutlined } from '@ant-design/icons'
import ChefItemRow from './ChefItemRow'

const OrderDetailModal = ({ isOpen, onClose, order }) => {
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['chef-order-items-detail', order?._id],
    queryFn: async () => {
      if (!order?._id) return []
      const res = await http.get(`/order-item/order/${order._id}`)
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    enabled: isOpen && !!order?._id,
    refetchInterval: 5000,
  })

  const tableName = order?.table_id?.name || order?.table_id?.table_name || 'Mang về'

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl text-orange-600">
          <FireOutlined /> Đơn hàng: {tableName}{' '}
          <span className="text-sm text-gray-400 font-normal ml-2">#{order?._id?.slice(-4)}</span>
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
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="Không có món" />
        ) : (
          items.map((item) => <ChefItemRow key={item._id} item={item} refetchItems={refetch} />)
        )}
      </div>
    </Modal>
  )
}
export default OrderDetailModal
