import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Button, Spin, Row, Col, Empty, Statistic } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { isSameDay } from './constants'
import OrderSummaryCard from './components/OrderSummaryCard'
import OrderDetailModal from './components/OrderDetailModal'

const ChefOrderPage = () => {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['chef-orders'],
    queryFn: async () => {
      const res = await http.get('/orders')
      const data = res.data?.data || res.data || []
      if (!Array.isArray(data)) return []
      return data.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
    },
    refetchInterval: 10000,
  })

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2">
            👨‍🍳 Bếp - Đơn hàng hôm nay
          </h1>
          <p className="text-gray-500 m-0 mt-1 text-sm">Hệ thống hiển thị vé (KDS)</p>
        </div>
        <div className="flex items-center gap-3">
          <Statistic
            title="Đang chờ"
            value={orders.length}
            valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}
            prefix="#"
          />
          <div className="w-px h-10 bg-gray-200 mx-2"></div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries(['chef-orders'])}
            loading={isLoading}
            shape="round"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center mt-20">
          <Spin size="large" tip="Đang tải vé..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center mt-20">
          <Empty
            description={
              <span className="text-lg text-gray-500">Bếp đang rảnh! Nghỉ ngơi thôi ☕</span>
            }
          />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {orders.map((order) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={order._id}>
              <OrderSummaryCard order={order} onClick={(ord) => setSelectedOrder(ord)} />
            </Col>
          ))}
        </Row>
      )}

      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null)
          queryClient.invalidateQueries(['chef-orders'])
        }}
        order={selectedOrder}
      />
    </div>
  )
}

export default ChefOrderPage
