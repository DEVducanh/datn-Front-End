import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { message, Spin, Empty, Divider, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

import http from '@/apis/http'
import feedbackAPI from '@/apis/feedback/feedback.api'
import CommentCard from '@/components/CommentCard/CommentCard'

const FoodDetailPage = () => {
  const { id: productId } = useParams()
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const userString = localStorage.getItem('user') || localStorage.getItem('user_info')
      if (userString && userString !== 'undefined') {
        setCurrentUser(JSON.parse(userString))
      }
    } catch (e) { }
  }, [location.search])

  // 1. LẤY CHI TIẾT MÓN ĂN
  const {
    data: foodDetails,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dish', productId],
    queryFn: async () => {
      const res = await http.get(`/dishes/${productId}`)
      const backendData = res
      // Logic map dữ liệu món ăn
      if (backendData && backendData.data) {
        return {
          id: backendData.data._id,
          _id: backendData.data._id,
          name: backendData.data.dish_name,
          imageUrl: backendData.data.imageUrl || backendData.data.image,
          description: backendData.data.description,
          price: backendData.data.price,
        }
      }
      if (backendData && backendData._id) {
        return {
          id: backendData._id,
          _id: backendData._id,
          name: backendData.dish_name,
          imageUrl: backendData.imageUrl || backendData.image,
          description: backendData.description,
          price: backendData.price,
        }
      }
      throw new Error('Dữ liệu sản phẩm không hợp lệ')
    },
    enabled: !!productId,
  })

  // 2. LẤY FEEDBACK (LOGIC MỚI: BẮT MỌI TRƯỜNG HỢP)
  const {
    data: reviews = [],
    isLoading: isLoadingReviews
  } = useQuery({
    queryKey: ['feedbacks', productId],
    queryFn: async () => {
      try {
        console.log("🚀 Đang gọi API lấy feedback cho ID:", productId);
        const res = await feedbackAPI.getByDish(productId)
        console.log("🔥 DỮ LIỆU FEEDBACK GỐC TỪ BACKEND:", res); // Bạn xem dòng này trong Console (F12)

        // BẮT MỌI CẤU TRÚC DỮ LIỆU CÓ THỂ
        if (Array.isArray(res)) return res;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (res.Feedbacks && Array.isArray(res.Feedbacks)) return res.Feedbacks; // Chữ Hoa
        if (res.feedbacks && Array.isArray(res.feedbacks)) return res.feedbacks; // Chữ thường
        if (res.reviews && Array.isArray(res.reviews)) return res.reviews;
        if (res.docs && Array.isArray(res.docs)) return res.docs;

        // Nếu backend trả về { success: true, data: [...] }
        if (res.success && Array.isArray(res.data)) return res.data;

        return []
      } catch (err) {
        console.error("❌ Lỗi khi lấy feedback:", err)
        return []
      }
    },
    enabled: !!productId,
  })

  // Tính điểm trung bình
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : 0

  // 3. Logic thêm giỏ hàng
  const addToCartMutation = useMutation({
    mutationFn: (payload) => http.post('/cart/add-item', payload),
    onSuccess: (response, variables) => {
      message.success(`Đã thêm ${variables.quantity} "${variables.dishName}" vào giỏ!`)
      const { table_id: tableId, user_id: userId } = variables
      if (tableId && userId) {
        queryClient.invalidateQueries({ queryKey: ['cart', tableId, userId] })
      }
    },
    onError: (err) => message.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
  })

  const handleIncrease = () => setQuantity((prev) => prev + 1)
  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = () => {
    if (!foodDetails) return
    let userId = currentUser?._id || currentUser?.id
    if (!userId) {
      const uStr = localStorage.getItem('user');
      if (uStr) userId = JSON.parse(uStr)._id;
    }

    if (!userId) {
      message.warning('Bạn cần đăng nhập để gọi món.')
      navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }

    const mongoTableId = localStorage.getItem('currentTableId')
    if (!mongoTableId) {
      message.error('Vui lòng quét mã QR trước.')
      return
    }

    addToCartMutation.mutate({
      table_id: mongoTableId,
      dish_id: foodDetails._id,
      quantity: quantity,
      user_id: userId,
      dishName: foodDetails.name
    })
  }

  if (isLoading) return <div className="text-center mt-20"><Spin size="large" /></div>
  if (isError || !foodDetails) return <p className="text-center mt-10">Không tìm thấy món ăn.</p>

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} className="mb-4">Quay lại</Button>

      {/* CHI TIẾT MÓN ĂN */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12">
        <div className="lg:w-1/2">
          <img src={foodDetails.imageUrl || 'https://via.placeholder.com/600'} alt={foodDetails.name} className="w-full h-auto object-cover rounded-xl shadow-lg aspect-square" />
        </div>
        <div className="lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{foodDetails.name}</h1>
          <p className="mt-4 text-gray-600 leading-relaxed text-lg">{foodDetails.description}</p>
          <p className="mt-6 text-4xl font-bold text-orange-600">{(foodDetails.price ?? 0).toLocaleString('vi-VN')} ₫</p>

          <div className="mt-8 flex items-center space-x-4">
            <button onClick={handleDecrease} className="w-12 h-12 bg-gray-100 rounded-lg font-bold text-xl">-</button>
            <span className="w-12 text-center text-xl font-semibold">{quantity}</span>
            <button onClick={handleIncrease} className="w-12 h-12 bg-gray-100 rounded-lg font-bold text-xl">+</button>
          </div>

          <button onClick={handleAddToCart} className="mt-8 w-full bg-orange-600 text-white font-bold py-4 px-6 rounded-xl text-lg hover:bg-orange-500 shadow-md transition-all disabled:opacity-70" disabled={addToCartMutation.isPending}>
            {addToCartMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      {/* BÌNH LUẬN & ĐÁNH GIÁ */}
      <div className="bg-gray-50 p-6 md:p-8 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 m-0">Đánh giá & Bình luận</h2>
          {reviews.length > 0 && (
            <div className="text-right">
              <div className="text-3xl font-black text-yellow-500 flex items-center justify-end gap-1">
                {averageRating} <span className="text-xl">★</span>
              </div>
              <div className="text-sm text-gray-500">{reviews.length} lượt đánh giá</div>
            </div>
          )}
        </div>

        <Divider className="my-4" />

        {isLoadingReviews ? (
          <div className="text-center py-8"><Spin tip="Đang tải bình luận..." /></div>
        ) : reviews.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá nào." />
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((item, index) => {
              // MAP DỮ LIỆU ĐỂ COMMENT CARD HIỂU
              const reviewData = {
                ...item,
                user_id: item.user_id || item.userId || { username: 'Khách ẩn danh' },
                comment: item.comment || item.content || item.text || item.description || '',
                rating: Number(item.rating) || 5,
                createdAt: item.createdAt || item.created_at || new Date()
              }
              return <CommentCard key={item._id || index} review={reviewData} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodDetailPage