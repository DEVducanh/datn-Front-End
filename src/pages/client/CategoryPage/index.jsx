import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { Input, Spin, message as antdMessage } from 'antd' // Đổi tên để tránh trùng
import { Search } from 'lucide-react'
import ProductGrid from '@/layouts/DefaultLayout/components/ProductGrid'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useMessage } from '@/contexts/MessageProvider'
import { jwtDecode } from 'jwt-decode'

// Import API chuẩn
import categoryAPI from '@/apis/category/category.api'
import dishAPI from '@/apis/dish/dish.api'

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1280'

// --- COMPONENT SIDEBAR (ĐÃ LỌC ACTIVE) ---
const CategorySidebar = ({ selectedId, onSelectCategory }) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Dùng API chuẩn
      const res = await categoryAPI.getAll()
      const list = res.data?.data || res.data || res || []

      // CHỈ LẤY DANH MỤC ĐANG HIỂN THỊ (status === 1)
      return list.filter((c) => c.status === 1)
    },
    staleTime: 1000 * 60 * 5,
  })

  const selectedStyle =
    'bg-orange-100 text-orange-600 font-semibold border-l-4 border-orange-500 pl-2'
  const normalStyle = 'text-gray-600 hover:bg-gray-50 hover:text-orange-500 pl-3'

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm sticky top-24 border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800 uppercase tracking-wide border-b pb-2">
        Danh mục
      </h3>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spin size="small" />
        </div>
      ) : (
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left py-2.5 rounded-r-md transition-all text-sm ${!selectedId ? selectedStyle : normalStyle}`}
            >
              Tất cả món
            </button>
          </li>
          {categories.map((category) => (
            <li key={category._id}>
              <button
                onClick={() => onSelectCategory(category._id)}
                className={`w-full text-left py-2.5 rounded-r-md transition-all text-sm ${selectedId === category._id ? selectedStyle : normalStyle}`}
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

// --- COMPONENT TRANG CHÍNH ---
const CategoryPage = () => {
  const { tableId: qrCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const message = useMessage()

  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchText, setSearchText] = useState('')

  // 1. Kiểm tra đăng nhập
  useEffect(() => {
    if (qrCode) {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      }
    }
  }, [qrCode, navigate, location.pathname])

  // 2. Lấy danh sách món ăn (Dùng dishAPI)
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dishes', selectedCategoryId], // Thêm dependency để cache tốt hơn
    queryFn: async () => {
      // Nếu có chọn danh mục -> Gọi API lọc luôn từ server (tối ưu hơn)
      // Nếu không -> Gọi tất cả
      const params = selectedCategoryId ? { category: selectedCategoryId } : null
      const res = await dishAPI.getAll(params)

      const rawList = res.data?.data || res.data || []

      // Map dữ liệu về chuẩn chung cho ProductGrid
      return rawList.map((dish) => ({
        id: dish._id,
        _id: dish._id,
        name: dish.dish_name || dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.imageUrl || dish.image,
        categoryId: dish.category_id?._id || dish.category_id,
        // QUAN TRỌNG: Thêm status để xử lý hết hàng
        status: dish.status,
      }))
    },
    // Khi đổi danh mục thì fetch lại ngay
    staleTime: 1000 * 60,
  })

  // 3. Lọc sản phẩm (Tìm kiếm local)
  const filteredProducts = useMemo(() => {
    let result = products
    // (Nếu API đã lọc category rồi thì bước này thừa, nhưng cứ để cho chắc nếu API trả all)
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoryId === selectedCategoryId)
    }
    if (searchText) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    return result
  }, [products, selectedCategoryId, searchText])

  // 4. Mutation Thêm giỏ hàng
  const addToCartMutation = useMutation({
    mutationFn: (payload) => http.post('/cart/add-item', payload),
    onSuccess: (_, variables) => {
      message.success(`Đã thêm "${variables.dishName}" vào giỏ!`)
      const currentTableId = localStorage.getItem('currentTableId') || variables.table_id
      if (currentTableId) {
        queryClient.invalidateQueries({ queryKey: ['cart', currentTableId] })
      }
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        message.warning('Phiên đăng nhập hết hạn.')
        navigate(`/flareon/login?redirect=${encodeURIComponent(location.pathname)}`)
      } else {
        message.error(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng')
      }
    },
  })

  // 5. Xử lý Thêm vào giỏ
  const handleAddToCart = async (product) => {
    // --- A. CHẶN NẾU HẾT HÀNG ---
    const isOut = product.status === 'out_of_stock' || product.status === 'unavailable'
    if (isOut) {
      message.warning('Món này hiện đang tạm hết, vui lòng chọn món khác!')
      return
    }

    // --- B. LẤY USER ID ---
    let userId = null
    try {
      const token = localStorage.getItem('access_token')
      if (token) userId = jwtDecode(token)._id
    } catch (e) {}

    const tableIdToSend = localStorage.getItem('currentTableId') || qrCode
    if (!tableIdToSend) {
      message.warning('Vui lòng quét mã QR tại bàn.')
      return
    }

    // --- C. HỒI SINH ĐƠN CŨ (Giữ nguyên logic của bạn) ---
    try {
      const res = await http.get('/orders')
      const allOrders = res.data?.data || res.data || []
      const activeOrder = allOrders.find(
        (o) =>
          String(o.table_id?._id || o.table_id) === String(tableIdToSend) &&
          o.status !== 'Paid' &&
          o.status !== 'Cancelled'
      )

      if (activeOrder && ['Served', 'Shipped', 'Completed', 'Ready'].includes(activeOrder.status)) {
        await http.patch(`/orders/${activeOrder._id}/status`, { status: 'Processing' })
      }
    } catch (err) {
      console.warn('Lỗi check đơn cũ', err)
    }

    // --- D. GỌI API ---
    addToCartMutation.mutate({
      table_id: tableIdToSend,
      dish_id: product._id,
      quantity: 1,
      user_id: userId,
      dishName: product.name,
    })
  }

  // Render Loading / Error
  if (isLoading)
    return (
      <div className="p-20 text-center">
        <Spin size="large" tip="Đang tải thực đơn..." />
      </div>
    )
  if (isError)
    return <div className="p-20 text-center text-red-500">Lỗi kết nối: {error.message}</div>

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Section (Giữ nguyên) */}
      <div className="relative h-64 bg-gray-900 overflow-hidden">
        <img
          src={HERO_IMAGE_URL}
          alt="Menu Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90"></div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-md">
            {qrCode ? `Thực đơn Bàn ${qrCode.slice(-4)}` : 'Thực đơn Nhà hàng'}
          </h1>
          <Input
            size="large"
            placeholder="Bạn muốn ăn gì hôm nay?..."
            prefix={<Search className="text-gray-400 mr-2" size={20} />}
            className="w-full max-w-lg !rounded-full !py-3 !px-6 shadow-lg border-none text-base"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-8 px-4 -mt20 relative z-20">
        {/* SIDEBAR */}
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <CategorySidebar
            selectedId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </aside>

        {/* DANH SÁCH SẢN PHẨM */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          {/* QUAN TRỌNG: ProductGrid cần nhận diện prop 'status' để làm mờ món hết hàng.
              Nếu component ProductGrid của bạn chưa hỗ trợ, bạn cần vào sửa nó chút xíu.
              Hoặc bạn có thể map lại logic render ngay tại đây nếu muốn.
           */}
          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-500 mt-10 p-10 bg-white rounded-xl shadow-sm border border-gray-100">
              <Search size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">Không tìm thấy món ăn nào</h3>
              <p className="text-sm">Thử chọn danh mục khác hoặc tìm kiếm từ khóa khác xem sao.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default CategoryPage
