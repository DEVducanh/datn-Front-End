import React, { useState, useMemo } from 'react'
import { Modal, Button, Typography, message, Spin } from 'antd'
import { Wallet, QrCode, Store, Check } from 'lucide-react'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

// Helper format tiền
const formatVnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'

const PaymentModal = ({ visible, onClose, items = [] }) => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [isProcessing, setIsProcessing] = useState(false)

  // --- LOGIC TÍNH TOÁN & GỘP MÓN ---
  const { totalAmount, singleOrderId, orderIdsToPay, groupedItems } = useMemo(() => {
    // 1. Lọc món chưa thanh toán & chưa hủy
    const validItems = items.filter(
      (item) => item.orderStatus !== 'Paid' && item.status !== 'Cancelled'
    )

    // 2. Tính tổng tiền & Lấy ID đơn
    const total = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const uniqueOrderIds = [...new Set(validItems.map((item) => item.orderId))]
    const id = uniqueOrderIds.length > 0 ? uniqueOrderIds[0] : null

    // 3. LOGIC GỘP MÓN
    const groupMap = {}

    validItems.forEach((item) => {
      // A. Xác định Tên hiển thị
      let dishName = item.name || item.dish_name || item.product_name
      // Nếu tên nằm sâu trong object dish_id
      if (!dishName && item.dish_id && typeof item.dish_id === 'object') {
        dishName = item.dish_id.dish_name || item.dish_id.name
      }
      if (!dishName) dishName = 'Món ăn'

      // B. Xác định Key duy nhất để gộp
      let uniqueKey = item.dish_id
      if (typeof uniqueKey === 'object' && uniqueKey !== null) {
        uniqueKey = uniqueKey._id || uniqueKey.id
      }
      if (!uniqueKey) uniqueKey = dishName

      // C. Tiến hành gộp
      if (groupMap[uniqueKey]) {
        groupMap[uniqueKey].quantity += item.quantity
      } else {
        groupMap[uniqueKey] = {
          ...item,
          displayName: dishName,
          quantity: item.quantity,
        }
      }
    })

    return {
      totalAmount: total,
      singleOrderId: id,
      orderIdsToPay: uniqueOrderIds,
      groupedItems: Object.values(groupMap),
    }
  }, [items])

  // --- XỬ LÝ THANH TOÁN ---
  const handlePayment = async () => {
    if (!singleOrderId) {
      message.warning('Không tìm thấy đơn hàng hợp lệ.')
      return
    }

    if (totalAmount === 0) {
      message.warning('Đơn hàng 0đ không cần thanh toán.')
      return
    }

    setIsProcessing(true)

    try {
      // ======= TRƯỜNG HỢP 1: TIỀN MẶT (CASH) =======
      if (paymentMethod === 'Cash') {
        // Chỉ cập nhật trạng thái đơn hàng là Pending Payment để nhân viên biết
        await http.patch(`/orders/${singleOrderId}/status`, { status: 'Pending Payment' })

        setIsProcessing(false)
        onClose()

        Modal.success({
          title: null,
          width: 450,
          centered: true,
          content: (
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Đã gửi yêu cầu!</h3>
              <p className="text-center text-gray-500 mb-6 px-4">
                Vui lòng đợi nhân viên đến xác nhận và thu tiền tại bàn.
              </p>
            </div>
          ),
          okText: 'Đã hiểu',
          onOk: () => navigate(0),
        })
        return
      }

      // ======= TRƯỜNG HỢP 2: VNPAY =======
      if (paymentMethod === 'VnPay') {
        try {
          // Cập nhật trạng thái các đơn con thành Completed (nếu cần)
          const updatePromises = orderIdsToPay.map((id) =>
            http.patch(`/orders/${id}/status`, { status: 'Completed' })
          )
          await Promise.all(updatePromises)
        } catch (err) {
          console.warn('Lỗi update status:', err)
        }

        // --- TẠO HÓA ĐƠN (QUAN TRỌNG: Gửi kèm method 'VnPay') ---
        const invoicePayload = {
          order_id: singleOrderId,
          amount: totalAmount,
          method: 'VnPay', // <--- Đã thêm trường này để Dashboard nhận biết
        }

        const invoiceRes = await http.post('/invoices', invoicePayload)

        // Lấy ID hóa đơn từ response (xử lý nhiều trường hợp trả về)
        const invoiceId =
          invoiceRes.data?.invoice?._id ||
          invoiceRes.data?._id ||
          invoiceRes.invoice?._id ||
          invoiceRes._id

        if (!invoiceId) throw new Error('Không lấy được ID hóa đơn từ Server')

        // Gọi API lấy link thanh toán VNPay
        const paymentRes = await http.post('/payment/create-payment', {
          amount: totalAmount,
          invoicesId: invoiceId,
          language: 'vn',
          bankCode: '',
        })

        const vnpUrl = paymentRes.vnpUrl || paymentRes.data?.vnpUrl || paymentRes.data?.url

        if (vnpUrl) {
          // Lưu tạm ID đơn đang thanh toán để xử lý sau khi redirect về
          localStorage.setItem('paying_order_id', singleOrderId)
          window.location.href = vnpUrl
        } else {
          throw new Error('Server không trả về link thanh toán')
        }
      }
    } catch (error) {
      setIsProcessing(false)
      console.error('Lỗi quy trình thanh toán:', error)
      const msg = error.response?.data?.message || error.message || 'Có lỗi xảy ra.'
      message.error(msg)
    }
  }

  const paymentOptions = [
    {
      key: 'Cash',
      title: 'Tiền mặt',
      description: 'Thanh toán tại quầy thu ngân',
      icon: <Wallet className="w-6 h-6 text-orange-600" />,
      activeColor: 'border-orange-500 bg-orange-50',
    },
    {
      key: 'VnPay',
      title: 'VNPay / QR Code',
      description: 'Quét mã QR để thanh toán online',
      icon: <QrCode className="w-6 h-6 text-blue-600" />,
      activeColor: 'border-blue-500 bg-blue-50',
    },
  ]

  return (
    <Modal
      title={<span className="text-lg font-bold">Thanh toán</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      className="rounded-2xl"
      maskClosable={!isProcessing}
    >
      <div className="px-2 pb-4">
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-2xl">
            <Spin size="large" />
            <p className="mt-4 text-orange-600 font-semibold animate-pulse">
              {paymentMethod === 'Cash' ? 'Đang gửi yêu cầu...' : 'Đang kết nối cổng thanh toán...'}
            </p>
          </div>
        )}

        {/* --- DANH SÁCH MÓN ĂN --- */}
        <div className="bg-gray-50 p-4 rounded-lg mb-5 border border-gray-100">
          <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide border-b pb-2">
            Chi tiết đơn hàng
          </h4>

          <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {groupedItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start mb-2 text-sm border-b border-dashed border-gray-200 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex gap-2 items-start">
                  <span className="bg-orange-100 text-orange-600 font-bold px-1.5 rounded text-xs mt-0.5 min-w-[24px] text-center">
                    {item.quantity}x
                  </span>
                  <span className="text-gray-800 font-medium">{item.displayName}</span>
                </div>
                <span className="text-gray-600 font-medium whitespace-nowrap ml-2">
                  {formatVnd(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- TỔNG TIỀN --- */}
        <div className="bg-orange-50 rounded-xl p-6 text-center mb-6 border border-orange-200">
          <Text type="secondary" className="text-sm uppercase tracking-wide font-medium">
            Tổng tiền
          </Text>
          <div className="text-4xl font-extrabold text-orange-700 mt-2 tracking-tight">
            {formatVnd(totalAmount)}
          </div>
        </div>

        {/* --- CHỌN PHƯƠNG THỨC --- */}
        <div className="flex flex-col gap-3">
          {paymentOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => !isProcessing && setPaymentMethod(option.key)}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                ${
                  paymentMethod === option.key
                    ? option.activeColor
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
            >
              <div className="mr-4">{option.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold">{option.title}</h4>
                <p className="text-sm text-gray-500 m-0">{option.description}</p>
              </div>
              {paymentMethod === option.key && <Check className="w-5 h-5 text-orange-500" />}
            </div>
          ))}
        </div>

        {/* --- NÚT HÀNH ĐỘNG --- */}
        <Button
          type="primary"
          size="large"
          className="mt-8 w-full h-12 text-lg font-bold rounded-xl bg-orange-600 hover:!bg-orange-700 border-none"
          onClick={handlePayment}
          loading={isProcessing}
          disabled={totalAmount === 0}
        >
          {paymentMethod === 'Cash' ? 'Gửi yêu cầu thanh toán' : 'Xác nhận & Chuyển hướng'}
        </Button>
      </div>
    </Modal>
  )
}

export default PaymentModal
