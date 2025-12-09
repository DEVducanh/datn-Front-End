import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { Input, Spin } from 'antd'
import { Search } from 'lucide-react'
import ProductGrid from '@/layouts/DefaultLayout/components/ProductGrid'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useMessage } from '@/contexts/MessageProvider'
import { jwtDecode } from 'jwt-decode'

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1280'

// --- COMPONENT SIDEBAR ---
const CategorySidebar = ({ selectedId, onSelectCategory }) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await http.get('/category')
      if (res && Array.isArray(res.data)) return res.data
      if (res && res.success && Array.isArray(res.data.data)) return res.data.data
      return []
    },
    staleTime: 1000 * 60 * 5,
  })

  const selectedStyle = 'bg-orange-100 text-orange-600 font-semibold'
  const normalStyle = 'text-gray-600 hover:bg-gray-100 hover:text-orange-500'

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm sticky top-24">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Danh mục</h3>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spin />
        </div>
      ) : (
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${!selectedId ? selectedStyle : normalStyle}`}
            >
              Tất cả món
            </button>
          </li>
          {categories.map((category) => (
            <li key={category._id}>
              <button
                onClick={() => onSelectCategory(category._id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${selectedId === category._id ? selectedStyle : normalStyle}`}
              >
                {category.category_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// --- COMPONENT TRANG CATEGORY CHÍNH ---
const CategoryPage = () => {
  const { tableId: qrCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // 2. Sử dụng hook useMessage thay vì message tĩnh
  const message = useMessage()

  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchText, setSearchText] = useState('')

  // --- 1. Kiểm tra đăng nhập khi vào trang ---
  useEffect(() => {
    if (qrCode) {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        console.log('Chưa đăng nhập -> Chuyển hướng Login')
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      }
    }
  }, [qrCode, navigate, location.pathname])

  // --- 2. Lấy danh sách món ăn ---
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      const res = await http.get('/dishes')
      if (res && Array.isArray(res.data)) {
        return res.data.map((dish) => ({
          id: dish._id,
          name: dish.dish_name,
          description: dish.description,
          price: dish.price,
          image: dish.imageUrl,
          _id: dish._id,
          categoryId: dish.category_id?._id || dish.category_id,
        }))
      }
      return []
    },
  })

  // --- 3. Lọc sản phẩm ---
  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoryId === selectedCategoryId)
    }
    if (searchText) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    return result
  }, [products, selectedCategoryId, searchText])

  // --- 4. API Thêm vào giỏ ---
  const addToCartMutation = useMutation({
    mutationFn: (payload) => http.post('/cart/add-item', payload),
    onSuccess: (_, variables) => {
      message.success(`Đã thêm "${variables.dishName}" vào giỏ!`)
      const currentTableId = localStorage.getItem('currentTableId') || variables.table_id
      if (currentTableId) {
        console.log('Làm mới giỏ hàng cho bàn:', currentTableId)
        queryClient.invalidateQueries({
          queryKey: ['cart', currentTableId],
        })
      }
    },
    onError: (err) => {
      const status = err.response?.status
      if (status === 401) {
        message.warning('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        navigate(
          `/flareon/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        )
      } else {
        message.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng')
      }
    },
  })

  // --- 5. Xử lý nút Thêm ---
  // --- 5. Xử lý nút Thêm (Đã nâng cấp logic gộp đơn) ---
  const handleAddToCart = async (product) => {
    // A. LẤY USER ID TỪ TOKEN
    let userId = null
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        const decoded = jwtDecode(token)
        // Lấy ID chuẩn từ token (thường là _id, id hoặc sub)
        userId = decoded._id || decoded.id || decoded.sub
      }
    } catch (e) {
      console.error('Lỗi giải mã token:', e)
    }

    // B. LẤY TABLE ID (Ưu tiên localStorage)
    const tableIdToSend = localStorage.getItem('currentTableId') || qrCode

    if (!tableIdToSend) {
      message.warning('Vui lòng quét mã QR tại bàn trước.')
      return
    }

    // C. LOGIC "HỒI SINH" ĐƠN CŨ (FIX LỖI TÁCH ĐƠN)
    // Trước khi thêm món, kiểm tra xem bàn này có đơn nào đang "ngủ đông" (Served/Completed) không
    try {
      // 1. Lấy danh sách tất cả đơn hàng
      // (Lưu ý: Nếu API /orders trả về cấu trúc khác, bạn cần log ra xem để sửa đoạn res.data)
      const res = await http.get('/orders')
      const allOrders = res.data?.data || res.data || []

      // 2. Tìm đơn hàng của bàn này mà chưa thanh toán (chưa Paid/Cancelled)
      const activeOrder = allOrders.find((o) => {
        const oTableId = o.table_id?._id || o.table_id
        // So sánh ID bàn (chuyển về string cho chắc chắn)
        const isSameTable = String(oTableId) === String(tableIdToSend)
        // Chỉ lấy đơn chưa kết thúc hẳn
        const isNotFinished = o.status !== 'Paid' && o.status !== 'Cancelled'

        return isSameTable && isNotFinished
      })

      // 3. Nếu tìm thấy đơn, kiểm tra trạng thái của nó
      if (activeOrder) {
        // Danh sách các trạng thái khiến Backend tưởng là đơn đã xong -> Tạo đơn mới
        // Thường là: Đã phục vụ (Served), Đã ship (Shipped), Chờ thu tiền (Completed)
        const sleepingStatuses = ['Served', 'Shipped', 'Completed', 'Ready']

        if (sleepingStatuses.includes(activeOrder.status)) {
          console.log(`⚠️ Phát hiện đơn cũ (${activeOrder.status}). Đang mở lại để gộp món...`)

          // => Gọi API cập nhật trạng thái về "Processing" (Đang nấu) hoặc "Pending"
          // Để Backend nhận ra đây là đơn đang hoạt động và gộp món mới vào
          await http.patch(`/orders/${activeOrder._id}/status`, { status: 'Processing' })
        }
      }
    } catch (err) {
      // Lỗi ở bước này không nên chặn việc gọi món, chỉ log ra thôi
      console.warn('Lỗi kiểm tra đơn cũ (có thể bỏ qua):', err)
    }

    // D. GỌI API THÊM MÓN (Chính thức)
    addToCartMutation.mutate({
      table_id: tableIdToSend,
      dish_id: product._id,
      quantity: 1,
      user_id: userId, // ID người dùng (hoặc null)
      dishName: product.name,
    })
  }

  if (isLoading)
    return (
      <div className="p-10 text-center">
        <Spin tip="Đang tải thực đơn..." />
      </div>
    )
  if (isError)
    return <div className="p-10 text-center text-red-500">Lỗi tải dữ liệu: {error.message}</div>

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-64 bg-gray-800">
        <img
          src={HERO_IMAGE_URL}
          alt="Menu"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {qrCode ? `Thực đơn (Bàn: ${qrCode})` : 'Khám phá Thực đơn'}
          </h1>
          <Input
            size="large"
            placeholder="Tìm kiếm món ăn..."
            prefix={<Search className="text-gray-400" />}
            className="w-full max-w-lg !rounded-lg !py-3"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-8 px-4">
        {/* CỘT 1: SIDEBAR DANH MỤC */}
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <CategorySidebar
            selectedId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId} // Truyền hàm set state xuống
          />
        </aside>

        <main className="w-full md:w-3/4 lg:w-4/5">
          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />

          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-10 p-10 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold">Không tìm thấy món ăn nào</h3>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default CategoryPage
