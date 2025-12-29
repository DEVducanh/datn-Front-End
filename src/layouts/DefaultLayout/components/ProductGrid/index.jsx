import React from 'react'
import { useNavigate } from 'react-router'
import { ShoppingCart } from 'lucide-react'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const ProductGrid = ({ products, onAddToCart }) => {
  const navigate = useNavigate()

  const handleProductClick = (productId) => {
    navigate(`/flareon/product/${productId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        // --- 1. CHUYỂN LOGIC KIỂM TRA VÀO TRONG VÒNG LẶP ---
        // Kiểm tra xem món có hết hàng không (khớp với key trong DB của bạn)
        const isOut = product.status === 'out_of_stock' || product.status === 'unavailable'

        return (
          <div
            key={product._id}
            className={`
                bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 flex flex-col relative
                ${isOut ? 'grayscale opacity-70' : 'hover:shadow-xl'} 
            `}
          >
            {/* --- 2. TEM HẾT MÓN (HIỆN NỔI LÊN TRÊN) --- */}
            {isOut && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/10 pointer-events-none">
                <div className="bg-red-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-xl transform -rotate-12 border-2 border-white">
                  HẾT MÓN
                </div>
              </div>
            )}

            {/* ẢNH SẢN PHẨM */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={() => handleProductClick(product._id)}
            />

            <div className="p-4 flex flex-col flex-grow">
              <h3
                className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-orange-500"
                onClick={() => handleProductClick(product._id)}
              >
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
                {product.description}
              </p>

              <div className="flex justify-between items-center mt-auto">
                <span className="text-xl font-bold text-orange-600">
                  {formatVnd(product.price)}
                </span>

                {/* --- 3. NÚT MUA HÀNG (DISABLE KHI HẾT MÓN) --- */}
                <button
                  disabled={isOut} // Khóa nút
                  onClick={() => !isOut && onAddToCart(product)}
                  className={`
                    p-2 rounded-full transition-colors flex items-center justify-center
                    ${
                      isOut
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' // Style khi hết hàng
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white' // Style bình thường
                    }
                  `}
                  aria-label="Thêm vào giỏ"
                >
                  <ShoppingCart size={20} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProductGrid
