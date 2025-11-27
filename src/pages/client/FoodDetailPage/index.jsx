import React, { useState, useEffect } from 'react'
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
  const [currentUser, setCurrentUser] = useState(null)

  // 1. Lấy thông tin user (Hỗ trợ cả Guest và Admin)
  useEffect(() => {
    try {
      const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
      if (userString && userString !== 'undefined') {
        setCurrentUser(JSON.parse(userString))
      }
    } catch (e) {
      console.error('Không thể parse user data từ localStorage', e)
    }
  }, [location.search])

  const {
    data: foodDetails,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['dish', productId],
    queryFn: async () => {
      const res = await http.get(`/dishes/${productId}`)
      const backendData = res

      if (backendData && backendData.data) {
        return {
          id: backendData.data._id,
          name: backendData.data.dish_name,
          imageUrl: backendData.data.imageUrl,
          description: backendData.data.description,
          price: backendData.data.price,
          _id: backendData.data._id,
        }
      }

      if (backendData && backendData._id) {
        return {
          id: backendData._id,
          name: backendData.dish_name,
          imageUrl: backendData.imageUrl,
          description: backendData.description,
          price: backendData.price,
          _id: backendData._id,
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
      const backendData = res

      if (Array.isArray(backendData?.data)) return backendData.data
      if (Array.isArray(backendData?.Feedbacks)) return backendData.Feedbacks
      if (backendData && (backendData.success || backendData.message)) return []

      throw new Error(backendData?.message || 'Cấu trúc dữ liệu bình luận không hợp lệ.')
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  })

  const addToCartMutation = useMutation({
    mutationFn: (payload) => http.post('/cart/add-item', payload),
    onSuccess: (response, variables) => {
      message.success(`Đã thêm ${variables.quantity} "${variables.dishName}" vào giỏ!`)
      const { table_id: tableId, user_id: userId } = variables
      if (tableId && userId) {
        queryClient.invalidateQueries({ queryKey: ['cart', tableId, userId] })
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ.'
      message.error(errMsg)
    },
  })

  const handleIncrease = () => setQuantity((prev) => prev + 1)
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  // --- HÀM THÊM VÀO GIỎ (ĐÃ SỬA LỖI USER ID) ---
  const handleAddToCart = () => {
    if (!foodDetails) {
      message.warning('Thông tin món ăn chưa sẵn sàng, vui lòng thử lại.')
      return
    }

    // 1. Lấy user_id (Bắt buộc phải đăng nhập)
    let userId = null
    try {
      // Lấy từ state currentUser đã load ở trên
      if (currentUser) {
        userId = currentUser._id || currentUser.id
      } else {
        // Fallback: Lấy trực tiếp từ localStorage nếu state chưa kịp cập nhật
        const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
        if (userString) {
          const userData = JSON.parse(userString)
          userId = userData._id || userData.id
        }
      }

      if (!userId) {
        message.warning('Bạn cần đăng nhập để thêm vào giỏ hàng.')
        // Chuyển hướng sang trang login (nhớ thêm /flareon nếu dùng path đó)
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
        return
      }
    } catch (e) {
      console.error(e)
      message.error('Lỗi xác thực người dùng.')
      return
    }

    const mongoTableId = localStorage.getItem('currentTableId')
    if (!mongoTableId) {
      message.error('Vui lòng quét mã QR để chọn bàn trước khi gọi món.')
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

  if (isLoading) return <p className="text-center mt-10">Đang tải chi tiết món ăn...</p>
  if (isError) return <p className="text-center mt-10 text-red-500">Lỗi: {error?.message || 'Unknown error'}</p>
  if (!foodDetails) return <p className="text-center mt-10">Không tìm thấy thông tin món ăn.</p>

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="lg:w-1/2">
          <img
            src={foodDetails.imageUrl || 'https://via.placeholder.com/600'}
            alt={foodDetails.name}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="lg:w-1/2 flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{foodDetails.name}</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">{foodDetails.description}</p>
          <p className="mt-6 text-4xl font-bold text-orange-500">
            {(foodDetails.price ?? 0).toLocaleString('vi-VN')} ₫
          </p>

          <div className="mt-8 flex items-center space-x-4">
            <button onClick={handleDecrease} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold text-lg">
              -
            </button>
            <span className="w-12 text-center text-xl font-semibold">{quantity}</span>
            <button onClick={handleIncrease} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold text-lg">
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="mt-8 w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-orange-600 transition-colors duration-300 disabled:opacity-50"
            disabled={addToCartMutation.isPending}
          >
            {addToCartMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá & Bình luận</h2>

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
                time: new Date(comment.created_at || comment.createdAt).toLocaleString('vi-VN'),
                replyCount: 0,
              }
              return <CommentCard key={commentProps.id} comment={commentProps} />
            })}
          </div>
        ) : (
          !isLoadingFeedbacks && !isErrorFeedbacks && <p className="text-gray-500 italic">Chưa có đánh giá nào cho món ăn này.</p>
        )}
      </div>
    </div>
  )
}

export default FoodDetailPage