// src/pages/client/CartPage/index.jsx
import React from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query' // Import đủ hooks
import http from '@/apis/http'
import { useNavigate } from 'react-router'
import CartItem from './CartItem'
import { useMessage } from '@/contexts/MessageProvider'

const CartPage = () => {
  const mongoTableId = localStorage.getItem('currentTableId')
  const userString = localStorage.getItem('user')
  const userData = userString ? JSON.parse(userString) : null
  const userId = userData?._id
  const message = useMessage()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const {
    data: cartData,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['cart', mongoTableId, userId], // Key cache bao gồm ID bàn và user
    queryFn: async () => {
      const res = await http.get(`/cart/cart-item/${mongoTableId}/${userId}`)
      return res?.data
    },
    enabled: !!mongoTableId && !!userId, // Chỉ chạy khi có đủ ID
    staleTime: 1000 * 10, // Giữ cache trong 10 giây để tránh gọi API liên tục
  })

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, delta }) => {
      return http.patch(`/cart/${cartItemId}/quantity`, { delta })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] })
      message.success('Cập nhật số lượng thành công')
    },
    onError: (err) => {
      message.error('Có lỗi xảy ra khi cập nhật số lượng.')
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (cartItemIdToDelete) => {
      return http.delete(`/cart/item/${cartItemIdToDelete}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] })
      message.success('Xóa món ăn thành công!')
    },
    onError: (err) => {
      message.error('Có lỗi xảy ra khi xóa món ăn.')
    },
  })

  const handleIncrease = (cartItemId) => {
    if (!cartItemId) {
      console.error('Thiếu cartItemId để tăng số lượng')
      return
    }
    updateQuantityMutation.mutate({ cartItemId, delta: 1 })
  }

  const handleDecrease = (cartItemId, currentQuantity) => {
    if (!cartItemId) {
      console.error('Thiếu cartItemId để giảm số lượng')
      return
    }

    if (currentQuantity <= 1) {
      console.log('Số lượng tối thiểu là 1')
      return
    }
    updateQuantityMutation.mutate({ cartItemId, delta: -1 })
  }

  const handleRemove = (cartItemId) => {
    if (!cartItemId) {
      console.error('Thiếu cartItemId để xóa')
      return
    }

    if (window.confirm(`Bạn có chắc muốn xóa món ăn này khỏi giỏ hàng?`)) {
      removeItemMutation.mutate(cartItemId) // Gọi mutation DELETE
    }
  }

  const handleCheckout = async () => {
    console.log('ĐÃ CLICK NÚT XÁC NHẬN!')
    if (!mongoTableId || !userId) {
      message.error('Lỗi: Thiếu thông tin bàn hoặc người dùng.')
      console.error('Checkout failed: Missing mongoTableId or userId')
      return
    }
    if (items.length === 0) {
      message.warning('Giỏ hàng đang trống, không thể xác nhận.')
      return
    }
    const checkoutPayload = {
      user_id: userId,
      table_id: mongoTableId,
    }
    try {
      const response = await http.post('/cart/checkout', checkoutPayload)
      message.success('Đặt hàng thành công! Đơn hàng đã được tạo.')
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] }) // Làm trống giỏ hàng UI
      navigate('/')
    } catch (checkoutError) {
      const errorMessage =
        checkoutError.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại.'
      message.error(errorMessage)
    }
  }

  if (!mongoTableId || !userId) {
    return (
      <p className="text-center mt-10 text-red-600">
        Lỗi: Không tìm thấy thông tin bàn hoặc người dùng. Vui lòng quay lại trang đặt món.
      </p>
    )
  }
  if (isLoading) return <p className="text-center mt-10">Đang tải giỏ hàng...</p>
  if (isError)
    return (
      <p className="text-center mt-10 text-red-600">
        Lỗi khi tải giỏ hàng: {error?.message || 'Unknown error'}
      </p>
    )
  if (!cartData) return <p className="text-center mt-10">Giỏ hàng trống hoặc có lỗi dữ liệu.</p>

  const items = cartData.items || []
  const total = cartData.total_price || 0

  return (
    <div className="max-w-screen-sm mx-auto bg-gray-50 min-h-screen flex flex-col p-4 md:p-6">
      <div className="w-full mb-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Giỏ hàng</h1>
      </div>

      <div className="flex-grow w-full overflow-y-auto mb-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Giỏ hàng của bạn đang trống</p>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.cart_item_id}
              item={item}
              onIncrease={() => handleIncrease(item.cart_item_id)}
              onDecrease={() => handleDecrease(item.cart_item_id, item.quantity)}
              onRemove={() => handleRemove(item.cart_item_id)}
            />
          ))
        )}
      </div>

      <div className="w-full bg-white p-4 rounded-t-lg shadow-lg mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-700">Tổng tiền</span>
          <span className="text-xl font-bold text-orange-600">
            {total.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <button
          onClick={handleCheckout}
          className="w-full h-12 bg-orange-500 text-white rounded-lg font-semibold text-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            items.length === 0 || updateQuantityMutation.isPending || removeItemMutation.isPending
          }
        >
          {/* Thay đổi text nút nếu đang loading */}
          {updateQuantityMutation.isPending
            ? 'Đang cập nhật...'
            : removeItemMutation.isPending
              ? 'Đang xóa...'
              : 'Xác nhận'}
        </button>
      </div>
    </div>
  )
}
export default CartPage
