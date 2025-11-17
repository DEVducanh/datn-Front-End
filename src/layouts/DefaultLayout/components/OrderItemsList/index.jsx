import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Spin, Alert, Button, List as AntList } from 'antd'

// Hàm format tiền
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

// --- SỬA 1: XÓA 'status' KHỎI PROPS ---
const OrderItemsList = ({ orderId, onOpenReview }) => {
  const navigate = useNavigate()

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['orderItems', orderId],
    queryFn: async () => {
      const res = await http.get(`/order-item/order/${orderId}`)
      console.log('API /order-item/ trả về (res):', res)

      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data)) return res.data

      throw new Error('Cấu trúc dữ liệu món ăn trả về không hợp lệ.')
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
  })

  // Hàm này chỉ dùng để chuyển trang (nếu bạn muốn bấm vào tên món ăn)

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spin /> <span className="ml-2">Đang tải món ăn...</span>
      </div>
    )
  }

  if (isError) {
    return <Alert type="error" message={error?.message || 'Không thể tải danh sách món ăn.'} />
  }

  if (!items || items.length === 0) {
    return <p className="text-gray-500">Đơn hàng này không có món ăn nào.</p>
  }

  return (
    <AntList
      dataSource={items}
      className="divide-y divide-gray-200"
      renderItem={(item) => {
        const itemName = item.dish_id?.dish_name || 'Món ăn không rõ'
        const dishId = item.dish_id?._id || null

        return (
          <li key={item._id} className="py-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900 cursor-pointer hover:text-orange-500">
                  {itemName}
                </p>

                {dishId && (
                  <div className="mt-1 mb-1">
                    <Button
                      size="small"
                      type="primary"
                      className="!bg-orange-500 !border-orange-500"
                      onClick={() => onOpenReview(dishId, orderId, itemName)}
                    >
                      Viết đánh giá
                    </Button>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Số lượng: {item.quantity} x {formatVnd(item.price)}
                </p>
              </div>

              <p className="text-gray-800 font-semibold text-lg flex-shrink-0 ml-4">
                {formatVnd(item.subtotal || item.price * item.quantity)}
              </p>
            </div>
          </li>
        )
      }}
    />
  )
}

export default OrderItemsList
