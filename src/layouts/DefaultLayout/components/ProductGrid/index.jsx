// src/layouts/DefaultLayout/components/ProductGrid/index.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom' // <<< 1. IMPORT
import { ShoppingCart } from 'lucide-react'

// Hàm format tiền (ví dụ, bạn có thể đã có)
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const ProductGrid = ({ products, onAddToCart }) => {
  const navigate = useNavigate() // <<< 2. KHỞI TẠO

  // --- 3. TẠO HÀM XỬ LÝ CLICK ---
  const handleProductClick = (productId) => {
    // Giả sử đường dẫn của bạn là /flareon/dishes/:id
    navigate(`/flareon/product/${productId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product._id}
          className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col"
        >
          {/* --- 4. THÊM onClick VÀO ẢNH --- */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover cursor-pointer" // <<< Thêm cursor-pointer
            onClick={() => handleProductClick(product._id)} // <<< Thêm onClick
          />

          <div className="p-4 flex flex-col flex-grow">
            {/* (Bạn cũng có thể thêm onClick cho cả tên món ăn) */}
            <h3
              className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-orange-500"
              onClick={() => handleProductClick(product._id)} // <<< Thêm onClick
            >
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
              {product.description}
            </p>

            <div className="flex justify-between items-center mt-auto">
              <span className="text-xl font-bold text-orange-600">{formatVnd(product.price)}</span>
              {/* Nút Thêm vào giỏ (giữ nguyên) */}
              <button
                onClick={() => onAddToCart(product)}
                className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="Thêm vào giỏ"
              >
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductGrid
