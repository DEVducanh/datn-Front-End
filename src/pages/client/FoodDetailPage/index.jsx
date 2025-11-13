import React, { useState, useEffect } from 'react' // Thêm useEffect
import { useParams, useNavigate, useLocation } from 'react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import CommentCard from '@/layouts/DefaultLayout/components/CommentCard'
import { useMessage } from '@/contexts/MessageProvider'

const FoodDetailPage = () => {
  const message = useMessage()
  const { id: productId } = useParams()
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [orderIdToReview, setOrderIdToReview] = useState(null)

  useEffect(() => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        setCurrentUser(JSON.parse(userString))
      }
    } catch (e) {
      console.error('Không thể parse user data từ localStorage', e)
    }

    const searchParams = new URLSearchParams(location.search)
    const orderId = searchParams.get('order_id')
    if (orderId) {
      setOrderIdToReview(orderId)
      console.log('Phát hiện order_id để đánh giá:', orderId)
    }
  }, [location.search]) // Chạy lại khi URL thay đổi

  const {
    data: foodDetails,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['dish', productId],
    queryFn: async () => {
      const res = await http.get(`/dishes/${productId}`)
      if (res && res.data) {
        return {
          id: res.data._id,
          name: res.data.dish_name,
          imageUrl: res.data.imageUrl,
          description: res.data.description,
          price: res.data.price,
          _id: res.data._id,
        }
      }
      throw new Error('Không nhận được dữ liệu sản phẩm hợp lệ')
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: feedbackData,
    isLoading: isLoadingFeedbacks,
    isError: isErrorFeedbacks,
    error: feedbackError,
  } = useQuery({
    queryKey: ['feedbacks', productId],
    queryFn: async () => {
      const res = await http.get(`/feedback/dish/${productId}`)
      console.log('API GET /feedback/dish/{id} trả về:', res)
      if (res && res.success) {
        return res.data
      }
      throw new Error(res?.message || 'Không thể tải bình luận')
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  })

  // --- Mutation để thêm vào giỏ hàng (GIỮ NGUYÊN) ---
  const addToCartMutation = useMutation({
    mutationFn: (payload) => http.post('/cart/add-item', payload),
    onSuccess: (response, variables) => {
      message.success(`Đã thêm ${variables.quantity} "${variables.dishName}" vào giỏ!`)
      const { table_id: tableId, user_id: userId } = variables
      if (tableId && userId) {
        queryClient.invalidateQueries({ queryKey: ['cart', tableId, userId] })
      }
    },
    onError: (err, variables) => {
      console.error(`Lỗi khi thêm '${variables.dishName}' vào giỏ:`, err)
      if (err.response?.status === 401) {
        message.warning('Vui lòng đăng nhập để thêm sản phẩm.')
        navigate(
          `/flareon/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        )
      } else {
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ.'
        message.error(errMsg)
      }
    },
  })

  const createFeedbackMutation = useMutation({
    mutationFn: (payload) => {
      return http.post('/feedback', payload)
    },
    onSuccess: (res) => {
      message.success('Tạo feedback thành công:', res)
      if (res && (res.success || res.newFeedBack)) {
        message.success('Cảm ơn bạn đã gửi đánh giá!')
        queryClient.invalidateQueries({ queryKey: ['feedbacks', productId] })
        setNewComment('')
        setNewRating(5)
        navigate(location.pathname, { replace: true })
        setOrderIdToReview(null)
      } else {
        message.error(`Lỗi: ${res?.message || 'Không thể gửi đánh giá.'}`)
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      message.error(errMsg)
    },
  })

  const handleIncrease = () => setQuantity((prev) => prev + 1)
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = () => {
    if (!foodDetails) {
      message.warning('Thông tin món ăn chưa sẵn sàng, vui lòng thử lại.')
      return
    }
    let userId = null
    try {
      const userString = localStorage.getItem('user')
      if (!userString) {
        message.warning('Bạn cần đăng nhập để thêm vào giỏ hàng.')
        return
      }
      userId = JSON.parse(userString)?._id
      if (!userId) throw new Error('User ID không hợp lệ.')
    } catch (e) {
      message.error('Lỗi khi lấy thông tin người dùng. Vui lòng thử đăng nhập lại.')
      return
    }
    const mongoTableId = localStorage.getItem('currentTableId')
    if (!mongoTableId) {
      message.error('Lỗi: Không tìm thấy thông tin bàn hiện tại.')
      return
    }
    const payload = {
      table_id: mongoTableId,
      dish_id: foodDetails._id,
      quantity: quantity,
      user_id: userId,
    }
    addToCartMutation.mutate({ ...payload, dishName: foodDetails.name })
  }

  // === 4. HÀM MỚI: XỬ LÝ GỬI ĐÁNH GIÁ ===
  const handleSubmitFeedback = (e) => {
    e.preventDefault()

    if (!currentUser || !currentUser._id) {
      message.error('Vui lòng đăng nhập để đánh giá.')
      return
    }
    if (!orderIdToReview) {
      message.error('Lỗi: Không tìm thấy đơn hàng ("order_id") để đánh giá.')
      return
    }
    if (newComment.trim() === '') {
      message.error('Vui lòng nhập nội dung bình luận.')
      return
    }

    const feedbackType = newRating >= 4 ? 'positive' : newRating >= 3 ? 'neutral' : 'negative'

    const payload = {
      user_id: currentUser._id,
      order_id: orderIdToReview,
      dish_id: productId, // Lấy từ useParams
      type: feedbackType,
      rating: newRating,
      content: newComment.trim(),
    }

    console.log('Chuẩn bị gửi feedback:', payload)
    createFeedbackMutation.mutate(payload)
  }

  if (isLoading) return <p>Đang tải chi tiết món ăn...</p>
  if (isError) return <p>Lỗi khi tải món ăn: {error?.message || 'Unknown error'}</p>
  if (!foodDetails) return <p>Không tìm thấy thông tin món ăn.</p>

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* ... (Phần JSX cho thông tin món ăn và nút "Thêm vào giỏ") ... */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Ảnh món ăn */}
        <div className="lg:w-1/2">
          <img
            src={foodDetails.imageUrl || 'https://via.placeholder.com/600'}
            alt={foodDetails.name}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>
        {/* Thông tin món ăn */}
        <div className="lg:w-1/2 flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{foodDetails.name}</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">{foodDetails.description}</p>
          <p className="mt-6 text-4xl font-bold text-orange-500">
            {(foodDetails.price ?? 0).toLocaleString('vi-VN')} ₫
          </p>
          {/* Số lượng */}
          <div className="mt-8 flex items-center space-x-4">
            <button onClick={handleDecrease} className="px-3 py-1 ...">
              -
            </button>
            <span className="w-12 text-center ...">{quantity}</span>
            <button onClick={handleIncrease} className="px-3 py-1 ...">
              +
            </button>
          </div>
          {/* Nút Thêm vào giỏ */}
          <button
            onClick={handleAddToCart}
            className="mt-8 w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-orange-600 transition-colors duration-300 disabled:opacity-50"
            disabled={addToCartMutation.isLoading}
          >
            {addToCartMutation.isLoading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      {/* === 5. CẬP NHẬT PHẦN BÌNH LUẬN (THÊM FORM) === */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá & Bình luận</h2>

        {/* --- FORM THÊM BÌNH LUẬN MỚI --- */}
        {/* Chỉ hiển thị nếu có user và order_id từ URL */}
        {orderIdToReview && currentUser ? (
          <form
            onSubmit={handleSubmitFeedback}
            className="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50"
          >
            <h3 className="text-lg font-semibold mb-2">Để lại đánh giá của bạn</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn đang đánh giá cho món ăn trong đơn hàng{' '}
              <span className="font-mono text-sm">{orderIdToReview}</span>
            </p>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block font-medium mb-1">Xếp hạng:</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`text-3xl cursor-pointer ${
                      star <= newRating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:scale-110 transition-transform`}
                    aria-label={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="mb-4">
              <label htmlFor="commentText" className="block font-medium mb-1">
                Nội dung:
              </label>
              <textarea
                id="commentText"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                rows="4"
                placeholder="Bạn thấy món ăn này thế nào?..."
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              disabled={createFeedbackMutation.isLoading}
            >
              {createFeedbackMutation.isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-gray-600">
            Bạn chỉ có thể đánh giá món ăn sau khi đã hoàn tất đơn hàng.
          </p>
        )}

        {/* --- DANH SÁCH BÌNH LUẬN HIỆN CÓ --- */}
        {isLoadingFeedbacks && <p>Đang tải bình luận...</p>}
        {isErrorFeedbacks && (
          <p className="text-red-500">
            Lỗi khi tải bình luận: {feedbackError?.message || 'Unknown error'}
          </p>
        )}

        {feedbackData && feedbackData.length > 0 ? (
          <div className="space-y-6">
            {feedbackData.map((comment) => {
              const commentProps = {
                id: comment._id,
                author: comment.user_id?.username || 'Người dùng',
                avatar: `https://i.pravatar.cc/150?u=${comment.user_id?._id || comment._id}`,
                rating: comment.rating,
                text: comment.content,
                time: new Date(comment.created_at).toLocaleString('vi-VN'),
                replyCount: 0,
              }
              return <CommentCard key={commentProps.id} comment={commentProps} />
            })}
          </div>
        ) : (
          !isLoadingFeedbacks && !isErrorFeedbacks && <p>Chưa có đánh giá nào cho món ăn này.</p>
        )}
      </div>
    </div>
  )
}

export default FoodDetailPage
