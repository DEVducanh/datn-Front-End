import React, { useEffect, useMemo, useState } from 'react' // Thêm lại useMemo, useState
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { Input, Spin } from 'antd' // Thêm lại Input, Spin
import { Search } from 'lucide-react' // Thêm lại Search icon
import ProductGrid from '@/layouts/DefaultLayout/components/ProductGrid'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useMessage } from '@/contexts/MessageProvider'

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1280'

const CategorySidebar = ({ selectedId, onSelectCategory }) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await http.get('/category')
      if (res && Array.isArray(res.data)) {
        return res.data
      }
      if (res && res.success && Array.isArray(res.data.data)) {
        return res.data.data
      }
      return []
    },
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  })

  const selectedStyle = 'bg-orange-100 text-orange-600 font-semibold'
  const normalStyle = 'text-gray-600 hover:bg-gray-100 hover:text-orange-500'

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm sticky top-24">
      {' '}
      {/* Sticky để sidebar đứng yên khi cuộn */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">Danh mục</h3>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spin />
        </div>
      ) : (
        <ul className="space-y-2">
          {/* Nút TẤT CẢ */}
          <li>
            <button
              onClick={() => onSelectCategory(null)} // null = chọn tất cả
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                !selectedId ? selectedStyle : normalStyle
              }`}
            >
              Tất cả món
            </button>
          </li>

          {/* Lặp qua các danh mục từ API */}
          {categories.map((category) => (
            <li key={category._id}>
              <button
                onClick={() => onSelectCategory(category._id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedId === category._id ? selectedStyle : normalStyle
                }`}
              >
                {category.category_name} {/* Giả sử tên là 'category_name' */}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
// --- KẾT THÚC COMPONENT SIDEBAR ---

// --- COMPONENT TRANG CATEGORY CHÍNH ---
const CategoryPage = () => {
  const { tableId: qrCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const message = useMessage()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null) // null = tất cả
  const [searchText, setSearchText] = useState('') // State cho tìm kiếm

  // --- useEffect (Giữ nguyên của bạn) ---
  useEffect(() => {
    if (qrCode) {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      if (!token || !userString) {
        console.log('Truy cập trang đặt món nhưng chưa đăng nhập, chuyển đến /login')
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      }
    }
  }, [qrCode, navigate, location.pathname]) // Chạy khi qrCode hoặc URL thay đổi

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
          categoryId: dish.category_id?._id || dish.category_id,
        }))
      }
      return []
    },
  })

  const filteredProducts = useMemo(() => {
    let productsToFilter = products

    // 1. Lọc theo Danh mục
    if (selectedCategoryId) {
      productsToFilter = productsToFilter.filter(
        (product) => product.categoryId === selectedCategoryId
      )
    }

    // 2. Lọc theo Tìm kiếm (searchText)
    if (searchText) {
      productsToFilter = productsToFilter.filter((product) =>
        product.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    return productsToFilter
  }, [products, selectedCategoryId, searchText]) // Tính lại khi 1 trong 3 thay đổi

  // --- Mutation (Giữ nguyên của bạn) ---
  const addToCartMutation = useMutation({
    mutationFn: (payload) => {
      return http.post('/cart/add-item', payload)
    },
    onSuccess: (response, variables) => {
      message.success(`Đã thêm "${variables.dishName}" vào giỏ!`)
      const { user_id: userId, table_id: tableId } = variables
      if (tableId && userId) {
        queryClient.invalidateQueries({ queryKey: ['cart', tableId, userId] })
      }
    },
    onError: (err, variables) => {
      message.error(`Lỗi khi thêm '${variables.dishName}' vào giỏ:`, err)
      if (err.response?.status === 401) {
        message.success('Vui lòng đăng nhập để thêm sản phẩm.')
        navigate(
          `/flareon/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
        )
      } else {
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ.'
        message.error(errMsg)
      }
    },
  })

  // --- HÀM XỬ LÝ THÊM VÀO GIỎ (Giữ nguyên của bạn) ---
  const handleAddToCart = (product) => {
    console.log('handleAddToCart được gọi cho:', product.name)

    // 1. Lấy user_id (Bắt buộc phải đăng nhập)
    let userId = null
    try {
      const userString = localStorage.getItem('user')
      if (!userString) {
        message.warning('Bạn cần đăng nhập để thêm vào giỏ hàng.')
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)
        return // Dừng hàm
      }
      const userData = JSON.parse(userString)
      userId = userData?._id // Lấy _id từ object user đã lưu
      if (!userId) {
        throw new Error('User ID không hợp lệ sau khi parse.')
      }
    } catch (e) {
      message.error('Lỗi khi lấy thông tin người dùng. Vui lòng thử đăng nhập lại.')
      return
    }

    // 2. Lấy table_id từ localStorage
    const tableIdToSend = localStorage.getItem('currentTableId')

    // *** THÊM KIỂM TRA NẾU KHÔNG CÓ currentTableId ***
    if (!tableIdToSend) {
      message.warning('Vui lòng quét mã QR tại bàn để chọn bàn trước khi thêm món.')
      console.log('Lỗi: Không tìm thấy currentTableId trong localStorage.')
      return // Dừng lại nếu không có bàn
    }

    console.log('Sử dụng table_id từ localStorage:', tableIdToSend)

    // 3. Tạo payload
    const payload = {
      table_id: tableIdToSend,
      dish_id: product._id,
      quantity: 1,
      user_id: userId,
    }

    // 4. Gọi mutation
    console.log('>>> Chuẩn bị gọi API VỚI:', JSON.stringify(payload, null, 2))
    addToCartMutation.mutate({ ...payload, dishName: product.name })
  }

  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR (Giữ nguyên của bạn) ---
  if (isLoading) return <p>Đang tải sản phẩm...</p>
  if (isError) return <p>Lỗi khi tải sản phẩm: {error?.message || 'Unknown error'}</p>

  // --- RENDER GIAO DIỆN ---
  // (Giữ nguyên kiểm tra đăng nhập của bạn)
  const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('user')
  if (qrCode && !isLoggedIn) {
    return <p className="text-center mt-10">Đang chuyển đến trang đăng nhập...</p>
  }

  // --- THAY THẾ TOÀN BỘ GIAO DIỆN RENDER (TỪ CODE CŨ) ---
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* === 1. HERO SECTION (TỪ CODE CŨ) === */}
      <div className="relative h-64 bg-gray-800">
        <img
          src={HERO_IMAGE_URL}
          alt="Thực đơn Flareon"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {qrCode ? `Thực đơn (Bàn: ${qrCode})` : 'Khám phá Thực đơn'}
          </h1>
          {/* Thanh tìm kiếm */}
          <Input
            size="large"
            placeholder="Tìm kiếm món ăn (ví dụ: Gà rán...)"
            prefix={<Search className="text-gray-400" />}
            className="w-full max-w-lg !rounded-lg !py-3"
            onChange={(e) => setSearchText(e.target.value)} // Cập nhật state tìm kiếm
          />
        </div>
      </div>

      {/* === 2. BỐ CỤC CHÍNH (Sidebar + Grid) (TỪ CODE CŨ) === */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-8 px-4">
        {/* CỘT 1: SIDEBAR DANH MỤC */}
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <CategorySidebar
            selectedId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId} // Truyền hàm set state xuống
          />
        </aside>

        {/* CỘT 2: SẢN PHẨM */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          {/* Truyền 'filteredProducts' (sản phẩm đã lọc) xuống ProductGrid */}
          <ProductGrid
            products={filteredProducts} // Dùng danh sách đã lọc
            onAddToCart={handleAddToCart} // Truyền hàm add (đã giữ nguyên của bạn)
          />
          {/* Hiển thị nếu lọc không có kết quả */}
          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-10 p-10 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold">Không tìm thấy sản phẩm</h3>
              <p>Vui lòng thử lại với danh mục hoặc từ khóa tìm kiếm khác.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default CategoryPage
