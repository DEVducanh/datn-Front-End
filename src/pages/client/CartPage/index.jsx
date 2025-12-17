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

  // console.log("CartPage Check:", { mongoTableId, userId })

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // =====================================================
  // GET CART DATA
  // =====================================================
  const {
    data: cartData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['cart', mongoTableId],
    queryFn: async () => {
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
      queryClient.invalidateQueries(['cart', mongoTableId])
      message.success('Cập nhật số lượng thành công')
    },
    onError: () => message.error('Có lỗi xảy ra khi cập nhật số lượng.'),
  })

  const removeItemMutation = useMutation({
    mutationFn: (cartItemIdToDelete) => http.delete(`/cart/item/${cartItemIdToDelete}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart', mongoTableId])
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
        table_id: mongoTableId,
      })

      message.success('Đặt hàng thành công!')
      queryClient.invalidateQueries(['cart', mongoTableId])
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

  if (isLoading) return <p className="text-center mt-10">Đang tải giỏ hàng...</p>

  if (isError)
    return (
      <p className="text-center mt-10 text-red-600">
        Lỗi tải giỏ hàng: {error?.message || 'Unknown error'}
      </p>
    )

  // =====================================================
  // MAIN UI (FIXED FOOTER)
  // =====================================================
  return (
    <div className="max-w-screen-sm mx-auto bg-gray-50 min-h-screen relative">

      {/* 1. PHẦN NỘI DUNG CHÍNH (Thêm pb-40 để tránh bị Footer che mất món cuối) */}
      <div className="p-4 md:p-6 pb-40">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Giỏ hàng</h1>

        {/* List Items */}
        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 opacity-60">
              <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
            </div>
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
      </div>

      {/* 2. FOOTER CỐ ĐỊNH (Ghim đáy màn hình) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 border-t border-gray-100">
        {/* Wrapper để căn giữa giống phần nội dung trên (max-w-screen-sm) */}
        <div className="max-w-screen-sm mx-auto p-4">

          {/* Dòng tổng tiền */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 font-medium">Tổng tạm tính:</span>
            <span className="text-xl font-bold text-orange-600">
              {total.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {/* Nút xác nhận */}
          <button
            onClick={handleCheckout}
            disabled={
              !items.length ||
              updateQuantityMutation.isPending ||
              removeItemMutation.isPending ||
              isCheckingOut
            }
            className="w-full h-12 bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <>
                <span className="loading loading-spinner loading-sm"></span> Đang xử lý...
              </>
            ) : updateQuantityMutation.isPending ? (
              'Đang cập nhật...'
            ) : removeItemMutation.isPending ? (
              'Đang xóa...'
            ) : (
              'Xác nhận gọi món'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartPage