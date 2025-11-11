import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Tag } from 'antd'

import http from '@/apis/http'


const STATUS_COLOR = {
  pending: 'orange',
  processing: 'blue',
  completed: 'green',
  cancelled: 'red',
  'n/a': 'default',
  unknown: 'default'
}

const formatCurrency = (amount) => {
  return (amount || 0).toLocaleString('vi-VN') + 'đ';
}


const ORDER_ITEM_BASE_URL = '/order-item'
const orderAPI = {
  getOrdersForTableId: (tableId) => {
    return http.get(`${ORDER_ITEM_BASE_URL}/by-user-or-table?table_id=${tableId}`)
  },
  getOrderItemsByCurrentUser: () => {
    return http.get(`${ORDER_ITEM_BASE_URL}/by-user-or-table`)
  }
}


const useAuth = () => {
  const rawUserData = localStorage.getItem('userData');
  return { isLoggedIn: !!rawUserData };
};

const FinalOrderBill = ({ itemsList, totalAmount, contextId }) => {

  // Hàm giả lập cho nút thanh toán
  const handlePayment = (total) => {
    console.log(`Yêu cầu Thanh toán TỔNG HỢP: ${formatCurrency(total)}`);
    alert(`Yêu cầu thanh toán tổng hợp ${contextId} với tổng: ${formatCurrency(total)}`);
    // TODO: GỌI API THANH TOÁN TỔNG HỢP!
  };

  if (itemsList.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-600 text-lg">
        Bạn chưa có món ăn nào trong các đơn hàng hiện tại.
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-8 shadow-md w-[672px]">
      {/* Header chung: Không hiển thị mã đơn hàng */}
      <div className="pb-2 border-b border-gray-200 mb-4">
        <div className="text-2xl font-bold text-gray-800">
          Hóa đơn Tạm tính
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Tổng số món đang chờ xử lý: **{itemsList.length}**
        </div>
      </div>

      {/* Bảng Chi Tiết Món Ăn (Tất cả món được gộp) */}
      <div className="w-full text-sm">
        {/* Header Bảng */}
        <div className="grid grid-cols-7 gap-2 font-semibold text-gray-600 border-b border-gray-200 pb-2">
          <div className="col-span-3">Món ăn</div>
          <div className="text-center">SL</div>
          <div className="text-right">Giá (Đơn)</div>
          <div className="text-center">Trạng thái</div>
          <div className="text-right">Tổng món</div>
        </div>

        {/* Danh sách Món Ăn Gộp */}
        {itemsList.map((item, index) => (
          <div key={item.id || index} className="grid grid-cols-7 gap-2 py-2 border-b border-gray-100 last:border-b-0">
            <div className="col-span-3 text-gray-800">{item.name}</div>
            <div className="text-center font-medium">{item.quantity}</div>
            <div className="text-right">{formatCurrency(item.price)}</div>
            <div className="text-center">
              <Tag size="small" color={STATUS_COLOR[(item.status || '').toLowerCase()] || 'default'}>
                {item.status}
              </Tag>
            </div>
            <div className="text-right font-medium text-orange-600">
              {formatCurrency(item.subtotal)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Tổng Tiền và Nút Thanh Toán DUY NHẤT */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300">
        <div className="text-2xl font-bold text-gray-800">
          TỔNG CỘNG HÓA ĐƠN: <span className="text-red-600">{formatCurrency(totalAmount)}</span>
        </div>

        <button
          onClick={() => handlePayment(totalAmount)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition duration-200 shadow-lg"
        >
          THANH TOÁN TỔNG HỢP ({formatCurrency(totalAmount)})
        </button>
      </div>
    </div>
  );
};
// -----------------------------------------------------------


const OrdersPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const tableId = localStorage.getItem('currentTableId');
  const rawUserData = localStorage.getItem('userData');
  const user = rawUserData ? JSON.parse(rawUserData) : {};
  const displayUserName = user.username || user.email || 'Khách hàng';


  console.log("🐛 DEBUG LOG 1:");
  console.log("   - tableId:", tableId);
  console.log("   - isLoggedIn:", isLoggedIn);


  let queryFn;
  let queryKey;
  let isQueryEnabled = false;
  let contextId = 'User';

  if (tableId) {
    queryFn = () => orderAPI.getOrdersForTableId(tableId);
    queryKey = ['tableOrderItems', tableId];
    isQueryEnabled = true;
    console.log("   - API Mode: TABLE");
    contextId = `Bàn số: ${tableId}`;
  } else if (isLoggedIn) {
    queryFn = () => orderAPI.getOrderItemsByCurrentUser();
    queryKey = ['userOrderItems'];
    isQueryEnabled = true;
    console.log("   - API Mode: USER");
    contextId = `Tài khoản: ${displayUserName}`;
  } else {
    queryFn = async () => ({ data: [] });
    queryKey = ['noOrders'];
    isQueryEnabled = false; // Tắt query nếu không có điều kiện
    console.log("   - API Mode: DISABLED/EMPTY");
    contextId = 'Chưa đăng nhập';
  }

  // 3. GỌI API BẰNG useQuery
  const {
    data: orders,
    isLoading,
    isError,
    error // Lấy đối tượng lỗi
  } = useQuery({
    queryKey: queryKey,
    queryFn: queryFn,
    enabled: isQueryEnabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // 🐛 LOG 2: Kiểm tra trạng thái tải và lỗi
  if (isError) {
    console.error("🐛 DEBUG LOG 2: LỖI KHI GỌI API!", error);
    console.error("   - Error Status:", error.response?.status);
    console.error("   - Error Data:", error.response?.data);
  } else if (isLoading) {
    console.log("🐛 DEBUG LOG 2: Đang tải...");
  } else {
    console.log("🐛 DEBUG LOG 2: Tải thành công. Dữ liệu:", orders);
  }

  if (isLoading) {
    return <div className="text-center mt-10 text-xl text-orange-500">Đang tải danh sách món ăn...</div>;
  }

  if (isError) {
    const errorMessage = error?.message || 'Lỗi không xác định.';
    const statusMessage = error.response?.status ? `(Status: ${error.response.status})` : '';

    return (
      <div className="text-center mt-10 text-red-600">
        Đã xảy ra lỗi khi lấy dữ liệu đơn hàng. Vui lòng kiểm tra lại.
        <div className="text-sm text-gray-500 mt-2">Chi tiết: **{errorMessage}** {statusMessage}</div>
      </div>
    );
  }

  // 4. TRÍCH XUẤT DỮ LIỆU THÔ (TẤT CẢ MÓN ĂN)
  let allItemsRaw = [];
  if (Array.isArray(orders?.result?.data)) {
    allItemsRaw = orders.result.data;
  } else if (Array.isArray(orders?.data?.data)) {
    allItemsRaw = orders.data.data;
  } else if (Array.isArray(orders?.data)) {
    allItemsRaw = orders.data;
  }

  // ✨ LOGIC GỘP TẤT CẢ MÓN ĂN & TÍNH TỔNG CỘNG ✨
  let finalItemsList = [];
  let grandTotal = 0;

  allItemsRaw.forEach(item => {
    // Chỉ gộp các món có trạng thái Pending/Processing (Chưa hoàn thành/hủy)
    const status = (item.status || 'unknown').toLowerCase();

    // Nếu bạn chỉ muốn gộp các món CHƯA thanh toán:
    // if (status !== 'completed' && status !== 'cancelled') {

    const subtotal = item.subtotal || (item.dish_id?.price * item.quantity) || 0;

    finalItemsList.push({
      id: item._id, // ID của Order Item
      name: item.dish_id?.dish_name || 'Món ăn không tên',
      status: item.status || 'Unknown',
      price: item.dish_id?.price || 0,
      quantity: item.quantity,
      subtotal: subtotal
    });

    grandTotal += subtotal;
    // }
  });

  console.log("🐛 DEBUG LOG 3: Tổng số món gộp:", finalItemsList.length, "Tổng tiền:", grandTotal);


  return (
    <div
      className="bg-white flex flex-col items-center"
      style={{ width: 744, minHeight: 1177, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="w-[672px] mx-auto pt-6 pb-4 border-b border-gray-200">
        <span
          className="text-orange-500 text-xl font-semibold cursor-pointer"
          onClick={() => navigate('/')}
        >
          &lt; Hóa đơn Tạm tính ({finalItemsList.length} món)
        </span>

        {/* HIỂN THỊ THÔNG TIN BÀN HOẶC NGƯỜI DÙNG */}
        <div className="text-base font-bold text-gray-700 mt-1">
          Tổng hợp cho: <span className="text-orange-600">{contextId}</span>
        </div>
      </div>

      {/* Order List - Sử dụng FinalOrderBill duy nhất */}
      <div className="w-[672px] flex flex-col mt-6">
        <FinalOrderBill
          itemsList={finalItemsList}
          totalAmount={grandTotal}
          contextId={contextId}
        />
      </div>
    </div>
  )
}

export default OrdersPage;