// src/pages/client/CartPage/index.jsx
import React from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query' // Import đủ hooks
import http from '@/apis/http'
import { useNavigate } from 'react-router'
import CartItem from './CartItem'

const CartPage = () => {
  // --- Lấy ID từ localStorage ---
  const mongoTableId = localStorage.getItem('currentTableId') // Lấy _id (dài) của bàn
  const userString = localStorage.getItem('user')
  const userData = userString ? JSON.parse(userString) : null
  const userId = userData?._id // Lấy _id (dài) của user
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // --- Query để lấy giỏ hàng ---
  const {
    data: cartData,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['cart', mongoTableId, userId], // Key cache bao gồm ID bàn và user
    queryFn: async () => {
      // Gọi API GET /cart/cart-item/{table_id}/{user_id}
      const res = await http.get(`/cart/cart-item/${mongoTableId}/${userId}`)
      console.log('API GET /cart trả về:', res)
      // Dữ liệu trả về là { success: true, data: { items: [{ cart_item_id: '...', ... }], total_price: ... } }
      return res?.data // Trả về data bên trong object { success, data }
    },
    enabled: !!mongoTableId && !!userId, // Chỉ chạy khi có đủ ID
    staleTime: 1000 * 10, // Giữ cache trong 10 giây để tránh gọi API liên tục
  })

  // --- Mutation để cập nhật số lượng (PATCH) ---
  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, delta }) => {
      // Gọi API PATCH /cart/{cart_item_id}/quantity
      console.log(`Gọi API PATCH /cart/${cartItemId}/quantity với delta: ${delta}`)
      return http.patch(`/cart/${cartItemId}/quantity`, { delta })
    },
    onSuccess: () => {
      // Tự động làm mới (refetch) query 'cart' sau khi thành công
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] })
      console.log('Cập nhật số lượng thành công!')
    },
    onError: (err) => {
      console.error('Lỗi khi cập nhật số lượng:', err)
      alert('Có lỗi xảy ra khi cập nhật số lượng.')
    },
  })

  // --- Mutation để XÓA món ăn (DELETE) ---
  const removeItemMutation = useMutation({
    mutationFn: (cartItemIdToDelete) => {
      // Gọi API DELETE /cart/item/{cart_item_id}
      console.log(`Gọi API DELETE /cart/item/${cartItemIdToDelete}`)
      return http.delete(`/cart/item/${cartItemIdToDelete}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] }) // Làm mới giỏ hàng
      console.log('Xóa món ăn thành công!')
    },
    onError: (err) => {
      console.error('Lỗi khi xóa món ăn:', err)
      alert('Có lỗi xảy ra khi xóa món ăn.')
    },
  })

  // --- Hàm xử lý Tăng/Giảm (Dùng ID thật từ API GET) ---
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
    // Nếu số lượng là 1, không giảm nữa (hoặc có thể gọi Xóa)
    if (currentQuantity <= 1) {
      console.log('Số lượng tối thiểu là 1')
      // Nếu muốn xóa khi giảm từ 1:
      // handleRemove(cartItemId);
      return
    }
    updateQuantityMutation.mutate({ cartItemId, delta: -1 })
  }

  // --- Hàm xử lý Xóa (Dùng ID thật từ API GET) ---
  const handleRemove = (cartItemId) => {
    if (!cartItemId) {
      console.error('Thiếu cartItemId để xóa')
      return
    }
    // Hỏi xác nhận trước khi xóa
    if (window.confirm(`Bạn có chắc muốn xóa món ăn này khỏi giỏ hàng?`)) {
      removeItemMutation.mutate(cartItemId) // Gọi mutation DELETE
    }
  }

  // --- Hàm Checkout ---
  const handleCheckout = async () => {
    console.log('ĐÃ CLICK NÚT XÁC NHẬN!')
    if (!mongoTableId || !userId) {
      alert('Lỗi: Thiếu thông tin bàn hoặc người dùng.')
      console.error('Checkout failed: Missing mongoTableId or userId')
      return
    }
    if (items.length === 0) {
      // Kiểm tra giỏ trống
      alert('Giỏ hàng đang trống, không thể xác nhận.')
      return
    }
    const checkoutPayload = {
      user_id: userId,
      table_id: mongoTableId, // Gửi _id (dài) của bàn
    }
    console.log('Chuẩn bị checkout với payload:', checkoutPayload)
    try {
      const response = await http.post('/cart/checkout', checkoutPayload)
      console.log('API Checkout thành công:', response)
      alert('Đặt hàng thành công! Hóa đơn đã được tạo.')
      queryClient.invalidateQueries({ queryKey: ['cart', mongoTableId, userId] }) // Làm trống giỏ hàng UI
      navigate('/') // Về trang chủ
    } catch (checkoutError) {
      console.error('Lỗi khi checkout:', checkoutError)
      const errorMessage =
        checkoutError.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại.'
      alert(errorMessage)
    }
  }

  // ----- Xử lý hiển thị -----
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

  // Lấy dữ liệu từ cartData (đã có cart_item_id)
  const items = cartData.items || []
  const total = cartData.total_price || 0

  return (
    <div className="max-w-screen-sm mx-auto bg-gray-50 min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="w-full mb-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Giỏ hàng</h1>
      </div>

      {/* Danh sách CartItem */}
      <div className="flex-grow w-full overflow-y-auto mb-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Giỏ hàng của bạn đang trống</p>
        ) : (
          items.map((item) => (
            // Dùng cart_item_id làm key và truyền vào handlers
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

      {/* Phần Tổng tiền và Xác nhận */}
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
          // Vô hiệu hóa nút khi đang có mutation chạy hoặc giỏ trống
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
