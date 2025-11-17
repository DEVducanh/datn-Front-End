// src/components/OrderItemsList/index.jsx
import React from 'react'
import { Button, List as AntList } from 'antd' // Chỉ giữ lại các Ant components cần thiết

// Hàm format tiền
const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

// --- COMPONENT LIST MÓN ĂN ---
// Component này nhận dữ liệu đã được gộp từ InvoiceDetailPage
const OrderItemsList = ({ orderItemsData, orderId, onOpenReview }) => {
  // Dữ liệu được lấy trực tiếp từ props
  const items = orderItemsData || []

  if (!items || items.length === 0) {
    return <p className="text-gray-500">Hóa đơn này không có món ăn nào được liệt kê.</p>
  }

  return (
    <AntList
      dataSource={items}
      className="divide-y divide-gray-200"
      renderItem={(item) => {
        // Lấy tên món ăn
        const itemName = item.dish_name || 'Món ăn không rõ'

        // GÁN ID MÓN ĂN:
        // Ta cần ID món ăn gốc để đánh giá. Dùng tên làm ID tạm nếu ID gốc thiếu.
        // LƯU Ý: Nếu Backend trả về ID món ăn gốc (ví dụ: item.dish_id), hãy dùng nó.
        const dishId = item.original_dish_id || item.dish_name

        // Giả định trường giá và subtotal tồn tại trong item
        const itemPrice = item.price || 0
        const itemSubtotal = item.subtotal || item.quantity * itemPrice

        return (
          <li key={item.dish_name} className="py-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900 cursor-pointer hover:text-orange-500">
                  {itemName}
                </p>

                {/* NÚT ĐÁNH GIÁ (Chỉ hiển thị nếu có ID món ăn) */}
                {dishId && onOpenReview && (
                  <div className="mt-1 mb-1">
                    <Button
                      size="small"
                      type="primary"
                      className="!bg-orange-500 !border-orange-500"
                      // orderId là ID hóa đơn
                      onClick={() => onOpenReview(dishId, orderId, itemName)}
                    >
                      Viết đánh giá
                    </Button>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Số lượng: {item.quantity} x {formatVnd(itemPrice)}
                </p>
              </div>

              <p className="text-gray-800 font-semibold text-lg flex-shrink-0 ml-4">
                {formatVnd(itemSubtotal)}
              </p>
            </div>
          </li>
        )
      }}
    />
  )
}

export default OrderItemsList
