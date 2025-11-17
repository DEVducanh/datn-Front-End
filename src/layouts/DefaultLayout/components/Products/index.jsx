import React from 'react' // Import React
import { useQuery } from '@tanstack/react-query' // 1. Import useQuery
import http from '@/apis/http' // 2. Import http client
import { Eye, Star, Clock } from 'lucide-react'
import { Tag, Button } from 'antd' // Giữ lại import của Ant Design
import { useNavigate } from 'react-router'

// ⭐ CHỖ SỬA 1: Nhận prop 'limit'
const Products = ({ limit }) => {
  const navigate = useNavigate()
  const {
    data: productsData = [], // Đổi tên biến để chứa dữ liệu thô từ API
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      console.log('Đang gọi API GET /dishes...')
      const res = await http.get('/dishes') // Gọi API
      console.log('API GET /dishes trả về:', res)

      // Trả về mảng 'data' bên trong object response
      if (res && Array.isArray(res.data)) {
        // Map dữ liệu API sang cấu trúc component cần
        return res.data.map((dish) => ({
          id: dish._id,
          name: dish.dish_name,
          description: dish.description,
          price: dish.price,
          image: dish.imageUrl,
          category: dish.category_id?.category_name || 'Chưa phân loại',
        }))
      }
      return []
    },
  })

  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR ---
  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-white">
        <p className="text-center text-gray-600">Đang tải sản phẩm...</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="py-20 px-4 bg-white">
        <p className="text-center text-red-500">
          Lỗi khi tải sản phẩm: {error?.message || 'Unknown error'}
        </p>
      </section>
    )
  }

  // ⭐ CHỖ SỬA 2: Áp dụng logic giới hạn (Slicing)
  const allProducts = productsData

  // Logic cắt mảng: Nếu 'limit' tồn tại, cắt mảng. Ngược lại, giữ nguyên toàn bộ mảng.
  const productsToDisplay =
    limit && allProducts.length > limit
      ? allProducts.slice(0, limit) // Cắt mảng (ví dụ: lấy 10 món đầu tiên)
      : allProducts // Hiển thị tất cả (nếu limit là undefined hoặc không hợp lệ)

  const handleViewDetails = (productId) => {
    console.log('Chuyển đến chi tiết sản phẩm:', productId)
    navigate(`product/${productId}`) // Chuyển trang
  }

  // --- RENDER GIAO DIỆN VỚI DỮ LIỆU THẬT ---
  return (
    <>
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Phần tiêu đề giữ nguyên */}
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full mb-4">
              Món ngon đề xuất
            </div>
            <h2 className="text-4xl md:text-5xl mb-4 text-gray-900">Món ăn nổi bật</h2>
            <p className="text-xl text-gray-600">Những món ăn được yêu thích nhất tại nhà hàng</p>
          </div>

          {/* Grid hiển thị sản phẩm */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsToDisplay.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">Không có sản phẩm nào.</p>
            ) : (
              // ⭐ CHỖ SỬA 3: Đảm bảo cú pháp JSX ternary operator đúng
              productsToDisplay.map((product) => (
                <div
                  key={product.id} // Dùng id đã map
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image || 'https://via.placeholder.com/300'} // Ảnh sản phẩm, có fallback
                      alt={product.name || 'Ảnh món ăn'}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Hiển thị category */}
                      <Tag variant="outline" className="text-orange-500 border-orange-300">
                        {product.category || 'N/A'}
                      </Tag>
                    </div>

                    {/* Tên sản phẩm */}
                    <h3 className="text-xl mb-2 text-gray-900 group-hover:text-orange-500 transition-colors">
                      {product.name || 'N/A'}
                    </h3>

                    {/* Mô tả */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description || ''}</p>

                    {/* Rating và Thời gian chuẩn bị */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{product.rating?.toFixed(1) || 'N/A'}</span> {/* Định dạng rating */}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{product.prepTime || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Giá và Nút chi tiết */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-2xl text-orange-500">
                        {/* Định dạng giá tiền */}
                        {(product.price ?? 0).toLocaleString('vi-VN')}đ
                      </span>
                      <Button
                        onClick={() => handleViewDetails(product.id)}
                        variant="outline"
                        className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Products
