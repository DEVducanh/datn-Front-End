// src/pages/client/CategoryPage/index.jsx
import React, { useEffect } from 'react' // Thêm useEffect
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { useParams, useNavigate, useLocation } from 'react-router' // Thêm hooks
import Banner from '@/layouts/DefaultLayout/components/Banner'
import ProductGrid from '@/layouts/DefaultLayout/components/ProductGrid'

const CategoryPage = () => {
  const { tableId: qrCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (qrCode) {
      // Chỉ bắt buộc đăng nhập khi có mã bàn
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      if (!token || !userString) {
        console.log('Truy cập trang đặt món nhưng chưa đăng nhập, chuyển đến /login')
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      }
    }
  }, [qrCode, navigate, location.pathname]) // Chạy khi qrCode hoặc URL thay đổi

  // --- LẤY DANH SÁCH SẢN PHẨM (Giữ nguyên logic) ---
  const {
    data: products = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      const res = await http.get('/dishes')
      console.log('API GET /dishes trả về:', res)
      if (res && Array.isArray(res.data)) {
        return res.data.map((dish) => ({
          id: dish._id,
          name: dish.dish_name,
          description: dish.description,
          price: dish.price,
          image: dish.imageUrl,
          _id: dish._id,
        }))
      }
      return []
    },
  })

  // --- Mutation để thêm/tăng số lượng ---
  const addToCartMutation = useMutation({
    mutationFn: (payload) => {
      /* ... code gọi POST /cart/add-item ... */
      console.log('Gọi POST /cart/add-item:', payload)
      return http.post('/cart/add-item', payload)
    },
    onSuccess: (response, variables) => {
      console.log('Thêm thành công!', response)
      alert(`Đã thêm "${variables.dishName}" vào giỏ!`)

      const { table_id: tableId, user_id: userId } = variables

      if (tableId && userId) {
        console.log('Làm mới query giỏ hàng:', ['cart', tableId, userId])
        // Báo cho Header (và CartPage) gọi lại API GET /cart
        queryClient.invalidateQueries({ queryKey: ['cart', tableId, userId] })
      }
      // ==========================================
    },
    onError: (err, variables) => {
      /* ... xử lý lỗi, chuyển hướng login nếu 401 ... */
      console.error(`Lỗi khi thêm '${variables.dishName}' vào giỏ:`, err)
      if (err.response?.status === 401) {
        alert('Vui lòng đăng nhập để thêm sản phẩm.')
        navigate(
          `/flareon/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        )
      } else {
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ.'
        alert(errMsg)
      }
    },
  })

  // --- HÀM XỬ LÝ THÊM VÀO GIỎ (Fake bàn "Test") ---
  const handleAddToCart = (product) => {
    console.log('handleAddToCart được gọi cho:', product.name)

    // 1. Lấy user_id (Bắt buộc phải đăng nhập)
    let userId = null
    try {
      const userString = localStorage.getItem('user')
      if (!userString) {
        // Nếu chưa đăng nhập, yêu cầu đăng nhập
        alert('Bạn cần đăng nhập để thêm vào giỏ hàng.')
        // Chuyển hướng đến trang login, lưu lại trang hiện tại
        // Đảm bảo bạn đã import useNavigate và useLocation ở đầu component
        navigate(
          `/flareon/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        )
        return // Dừng hàm
      }
      const userData = JSON.parse(userString)
      userId = userData?._id // Lấy _id từ object user đã lưu
      // Kiểm tra lại userId có hợp lệ không
      if (!userId) {
        throw new Error('User ID không hợp lệ sau khi parse.')
      }
    } catch (e) {
      console.error('Lỗi khi lấy thông tin người dùng từ localStorage:', e)
      alert('Lỗi khi lấy thông tin người dùng. Vui lòng thử đăng nhập lại.')
      return // Dừng hàm nếu có lỗi
    }

    // 2. === FAKE BÀN "Test" ===
    // Luôn dùng mã QR "Test" làm table_id khi gọi API để test
    const tableIdToSend = localStorage.getItem('currentTableId')
    console.log('ĐANG FAKE BÀN (qr_code="Test"):', tableIdToSend)
    // ======================

    // 3. Tạo payload
    const payload = {
      table_id: tableIdToSend,
      dish_id: product._id,
      quantity: 1,
      user_id: userId,
    }

    // 4. Gọi mutation (Truyền thêm tên món để hiển thị alert)
    console.log('>>> Chuẩn bị gọi API VỚI:', JSON.stringify(payload, null, 2)) // Log chi tiết payload
    addToCartMutation.mutate({ ...payload, dishName: product.name })
  }

  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR ---
  if (isLoading) return <p>Đang tải sản phẩm...</p>
  if (isError) return <p>Lỗi khi tải sản phẩm: {error?.message || 'Unknown error'}</p>

  // --- RENDER GIAO DIỆN ---
  // Kiểm tra đăng nhập trước khi render nếu đang ở trang đặt món
  const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('user')
  if (qrCode && !isLoggedIn) {
    return <p className="text-center mt-10">Đang chuyển đến trang đăng nhập...</p>
  }

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  return (
    <div className="px-4 md:px-8">
      {/* Banner */}
      <Banner title="Banner title" image="/images/banner.png" />
      {/* Title */}
      <h2 className="text-xl font-bold mt-6 mb-4">
        {qrCode ? `Thực đơn (Bàn: ${qrCode})` : 'Danh sách món ăn'} {/* Thay đổi tiêu đề */}
      </h2>
      {/* Product Grid - Truyền hàm handleAddToCart xuống */}
      <ProductGrid products={products} onAddToCart={handleAddToCart} />
    </div>
  )
}

export default CategoryPage
