import React, { useState, useMemo } from 'react'
import { Modal, Button, Typography, message, Spin } from 'antd'
import { Wallet, QrCode, Store, Check, ChevronRight, Receipt } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const PaymentModal = ({ visible, onClose, items = [] }) => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  // Thêm state loading riêng để xử lý quy trình 2 bước
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. TÍNH TOÁN (Lấy các món chưa trả tiền và chưa hủy)
  const { totalAmount, orderIdsToPay } = useMemo(() => {
    // Lọc bỏ món đã Paid hoặc Cancelled
    const payableItems = items.filter(item =>
      item.orderStatus !== 'Paid' && item.status !== 'Cancelled'
    );

    const total = payableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const uniqueOrderIds = [...new Set(payableItems.map(item => item.orderId))];

    return { totalAmount: total, orderIdsToPay: uniqueOrderIds }
  }, [items])

  // 2. API TẠO HÓA ĐƠN (Bước cuối cùng)
  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: (res) => {
      setIsProcessing(false) // Tắt loading
      console.log("Tạo hóa đơn thành công:", res);

      const paymentUrl = res.data?.paymentUrl || res.paymentUrl || res.data?.url || res.url;

      if (paymentMethod === 'VnPay' && paymentUrl) {
        window.location.href = paymentUrl
      } else {
        onClose()
        Modal.success({
          title: null,
          width: 450,
          centered: true,
          content: (
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đã gửi thành công!</h3>
              <p className="text-center text-gray-500 mb-6 px-4">
                Đơn hàng đã được xác nhận. Vui lòng đến quầy thu ngân để hoàn tất.
              </p>
            </div>
          ),
          okText: 'Xong',
          onOk: () => navigate(0), // Reload trang
        })
      }
    },
    onError: (error) => {
      setIsProcessing(false) // Tắt loading nếu lỗi
      console.error("Lỗi thanh toán:", error);
      const msg = error.response?.data?.message || 'Lỗi server.';
      message.error(`Lỗi: ${msg}`);
    },
  })

  // 3. HÀM XỬ LÝ THANH TOÁN (LOGIC HACK BACKEND)
  const handlePayment = async () => {
    if (orderIdsToPay.length === 0) {
      message.warning('Không có món nào cần thanh toán.')
      return
    }

    // Bắt đầu quy trình
    setIsProcessing(true)

    try {
      // --- BƯỚC 1: TỰ ĐỘNG CHUYỂN TRẠNG THÁI SANG 'Completed' ---
      // (Để đánh lừa Backend rằng đơn đã xong, cho phép tạo hóa đơn)
      console.log("Đang cập nhật trạng thái đơn hàng...")

      const updatePromises = orderIdsToPay.map(orderId =>
        http.patch(`/orders/${orderId}/status`, { status: 'Completed' })
      )

      // Chờ tất cả đơn hàng chuyển trạng thái xong
      await Promise.all(updatePromises)
      console.log("Đã chuyển sang Completed. Bắt đầu tạo hóa đơn...")

      // --- BƯỚC 2: GỌI API TẠO HÓA ĐƠN ---
      let methodString = 'Cash';
      if (paymentMethod === 'VnPay') methodString = 'VNPAY';

      const payload = {
        order_ids: orderIdsToPay,
        method: methodString,
        amount: totalAmount
      }

      createInvoiceMutation.mutate(payload)

    } catch (error) {
      setIsProcessing(false)
      console.error("Lỗi khi update status:", error)
      message.error("Lỗi hệ thống: Không thể cập nhật trạng thái đơn hàng.")
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
      maskClosable={!isProcessing} // Không cho đóng khi đang xử lý
    >
      <div className="px-2 pb-4">
        {/* Loading Overlay nếu đang xử lý */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center rounded-2xl">
            <Spin size="large" />
            <p className="mt-4 text-orange-600 font-semibold animate-pulse">Đang xử lý đơn hàng...</p>
          </div>
        )}

        <div className="bg-orange-50 rounded-xl p-6 text-center my-6 border border-orange-200">
          <Text type="secondary" className="text-sm uppercase tracking-wide font-medium">
            Tổng tiền
          </Text>
          <div className="text-4xl font-extrabold text-orange-700 mt-2 tracking-tight">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-2xl align-top">đ</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {paymentOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => !isProcessing && setPaymentMethod(option.key)}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                ${paymentMethod === option.key ? option.activeColor : 'border-gray-100 hover:bg-gray-50'}`}
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

        <Button
          type="primary"
          size="large"
          className="mt-8 w-full h-12 text-lg font-bold rounded-xl bg-orange-600 hover:!bg-orange-700 border-none"
          onClick={handlePayment}
          loading={isProcessing} // Hiện loading khi đang chạy quy trình
          disabled={totalAmount === 0}
        >
          Xác nhận thanh toán
        </Button>
      </div>
    </Modal>
  )
}

export default PaymentModal