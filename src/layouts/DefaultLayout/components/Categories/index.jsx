// src/components/Categories/index.jsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Spin } from 'antd'
import {
  Coffee,
  Soup,
  Sandwich,
  Salad,
  Pizza,
  IceCream,
  FlameKindling,
  Utensils,
  Beer,
  Drumstick,
} from 'lucide-react'

// --- BẢN ĐỒ ICON + MÀU SẮC (ĐÃ TỐI ƯU HÓA) ---
const categoryVisuals = {
  'Món chính': { icon: Utensils, color: 'bg-orange-500' },
  'Món phụ': { icon: Sandwich, color: 'bg-amber-500' },
  'Món khai vị': { icon: Salad, color: 'bg-green-500' },
  'Đồ uống': { icon: Coffee, color: 'bg-blue-500' },
  'Fast food': { icon: Pizza, color: 'bg-red-500' },
  'Tráng miệng': { icon: IceCream, color: 'bg-pink-500' },

  // Các món riêng trong app
  'Món gà': { icon: Drumstick, color: 'bg-yellow-600' },
  'Món cơm và canh': { icon: Soup, color: 'bg-cyan-500' },
  'Món nhậu': { icon: Beer, color: 'bg-amber-600' },
  'Các món lẩu': { icon: FlameKindling, color: 'bg-red-700' },
  'Món ăn kèm': { icon: Salad, color: 'bg-gray-500' },

  default: { icon: Utensils, color: 'bg-gray-400' },
}

const Categories = () => {
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await http.get('/category')

      if (res && Array.isArray(res.data)) return res.data
      if (res?.success && Array.isArray(res.data?.data)) return res.data.data
      if (Array.isArray(res)) return res

      return []
    },
    staleTime: 1000 * 60 * 10,
  })

  if (isError) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-orange-50 to-white">
        <p className="text-center text-red-500">Lỗi khi tải danh mục: {error?.message}</p>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Tiêu đề */}
        <div className="text-center mb-16">
          <div className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full mb-4">
            Danh mục
          </div>
          <h2 className="text-4xl md:text-5xl mb-4 text-gray-900">Khám phá menu đa dạng</h2>
          <p className="text-xl text-gray-600">Những món ăn ngon đang chờ bạn khám phá</p>
        </div>

        {/* Lưới danh mục */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            categories.map((category) => {
              const visuals = categoryVisuals[category.category_name] || categoryVisuals.default
              const Icon = visuals.icon
              const color = visuals.color

              return (
                <div key={category._id} className="group cursor-pointer">
                  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 hover:-translate-y-2">
                    <div
                      className={`w-16 h-16 ${color} rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-center mb-2 text-gray-900">{category.category_name}</h3>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default Categories
