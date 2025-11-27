// src/pages/client/CartPage/index.jsx
import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { useNavigate } from 'react-router'
import CartItem from './CartItem'
import { useMessage } from '@/contexts/MessageProvider'

const CartPage = () => {
  const message = useMessage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // --- 1. LOGIC LẤY ID ---
  const mongoTableId = localStorage.getItem('currentTableId')

  const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
  const userData = userString ? JSON.parse(userString) : {}

  // Lấy _id (User thường) hoặc id (Guest)
  const userId = userData?._id || userData?.id

  console.log("CartPage Check:", { mongoTableId, userId })

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // =====================================================
  // GET CART DATA (ĐÃ SỬA LỖI 404)
  // =====================================================
  const {
    data: cartData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['cart', mongoTableId], // Bỏ userId khỏi key vì không cần nữa
    queryFn: async () => {
      // --- SỬA THEO ẢNH SWAGGER ---
      // Đường dẫn chuẩn: /cart/cart-item/MÃ_BÀN
      const res = await http.get(`/cart/cart-item/${mongoTableId}`)
      return res?.data
    },
    enabled: !!mongoTableId,
    staleTime: 10000
  })
  
  const items = cartData?.items || []
  const total = cartData?.total_price || 0
 
  // =====================================================
  // MUTATIONS
  // =====================================================
  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, delta }) => http.patch(`/cart/${cartItemId}/quantity`, { delta }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart', mongoTableId, userId])
      message.success('Cập nhật số lượng thành công')
    },
    onError: () => message.error('Có lỗi xảy ra khi cập nhật số lượng.'),
  })

  const removeItemMutation = useMutation({
    mutationFn: (cartItemIdToDelete) => http.delete(`/cart/item/${cartItemIdToDelete}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart', mongoTableId, userId])
      message.success('Xóa món ăn thành công!')
    },
    onError: () => message.error('Có lỗi xảy ra khi xóa món ăn.'),
  })

  // =====================================================
  // ACTIONS
  // =====================================================
  const handleIncrease = (id) => id && updateQuantityMutation.mutate({ cartItemId: id, delta: 1 })

  const handleDecrease = (id, currentQuantity) => {
    if (!id || currentQuantity <= 1) return
    updateQuantityMutation.mutate({ cartItemId: id, delta: -1 })
  }

  const handleRemove = (id) => {
    if (!id) return
    if (window.confirm('Bạn có chắc muốn xóa món ăn này khỏi giỏ hàng?')) {
      removeItemMutation.mutate(id)
    }
  }

  // =====================================================
  // CHECKOUT
  // =====================================================
  const handleCheckout = async () => {
    if (isCheckingOut) return
    if (!mongoTableId) {
      message.error('Lỗi: Thiếu thông tin bàn.')
      return
    }
    if (!items.length) {
      message.warning('Giỏ hàng trống, không thể xác nhận.')
      return
    }

    setIsCheckingOut(true)

    try {
      // Gửi checkout (Backend tự lấy user_id từ token)
      await http.post('/cart/checkout', {
        // user_id: userId, // Thử bỏ dòng này nếu BE bảo không cần
        table_id: mongoTableId,
      })

      message.success('Đặt hàng thành công!')
      queryClient.invalidateQueries(['cart', mongoTableId, userId])
      navigate('/')
    } catch (err) {
      message.error(err.response?.data?.message || 'Đặt hàng thất bại.')
      setIsCheckingOut(false)
    }
  }

  // =====================================================
  // RENDER CONDITIONS
  // =====================================================
  if (!mongoTableId)
    return <p className="text-center mt-10 text-red-500">Vui lòng quét mã QR để chọn bàn.</p>

  // (Tạm bỏ check userId chặt chẽ để tránh lỗi hiển thị nếu guest chưa sync kịp)

  if (isLoading) return <p className="text-center mt-10">Đang tải giỏ hàng...</p>

  if (isError)
    return (
      <p className="text-center mt-10 text-red-600">
        Lỗi tải giỏ hàng: {error?.message || 'Unknown error'}
      </p>
    )

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="max-w-screen-sm mx-auto bg-gray-50 min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Giỏ hàng</h1>

      {/* List */}
      <div className="flex-grow overflow-y-auto mb-4">
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

      {/* Footer */}
      <div className="bg-white p-4 rounded-t-lg shadow-lg mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-700">Tổng tiền</span>
          <span className="text-xl font-bold text-orange-600">
            {total.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={
            !items.length ||
            updateQuantityMutation.isPending ||
            removeItemMutation.isPending ||
            isCheckingOut
          }
          className="w-full h-12 bg-orange-500 text-white rounded-lg font-semibold text-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingOut
            ? 'Đang xử lý...'
            : updateQuantityMutation.isPending
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