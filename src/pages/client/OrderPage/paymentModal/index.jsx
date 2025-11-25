import React, { useState, useMemo } from 'react'
import { Modal, Button, Typography, Divider, message } from 'antd'
import { Wallet, QrCode, Store, Check, ChevronRight, Receipt } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const PaymentModal = ({ visible, onClose, orders = [] }) => {
  // Thêm default value cho orders
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  // --- SỬA: Dùng useMemo để tính toán chính xác ---
  const { totalAmount, orderIds } = useMemo(() => {
    // Lọc các đơn HỢP LỆ để thanh toán
    // (Bao gồm cả đơn 'Completed' chưa trả tiền và đơn 'Pending Payment' đang chờ)
    const validOrders = orders.filter(
      (order) => order.status === 'Completed' || order.status === 'Pending Payment'
    )

    const total = validOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    const ids = validOrders.map((o) => o._id)

    return { totalAmount: total, orderIds: ids }
  }, [orders])

  // --- API VNPAY ---
  const createVnPayMutation = useMutation({
    mutationFn: (data) => http.post('/invoices', data),
    onSuccess: (res) => {
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
      } else {
        message.error('Không lấy được link thanh toán VNPay (Backend không trả về URL)')
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Lỗi tạo thanh toán VNPay.'
      message.error(msg)
    },
  })

  // --- API TIỀN MẶT ---
  const requestCashPaymentMutation = useMutation({
    mutationFn: async () => {
      const promises = orderIds.map((id) =>
        http.patch(`/orders/${id}/status`, { status: 'Pending Payment' })
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      onClose()
      Modal.success({
        title: null,
        icon: null,
        width: 450,
        centered: true,
        content: (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đã được gửi!</h3>
            <p className="text-center text-gray-500 mb-6 px-4">
              Vui lòng di chuyển đến <strong>Quầy thu ngân</strong> để hoàn tất thanh toán.
            </p>
          </div>
        ),
        okText: 'Hoàn tất',
        onOk: () => navigate(0),
      })
    },
    onError: () => {
      message.error('Không thể gửi yêu cầu thanh toán.')
    },
  })

  const handlePayment = () => {
    console.log('Bấm thanh toán. Order IDs:', orderIds) // Debug log

    if (orderIds.length === 0) {
      message.warning(
        'Không có đơn hàng nào hợp lệ để thanh toán (Đơn phải là Completed hoặc Pending Payment)'
      )
      return
    }

    if (paymentMethod === 'VnPay') {
      const payload = {
        order_id: orderIds, // Gửi mảng ID
        payment_method: 'VnPay',
        amount: totalAmount,
        language: 'vn',
        bankCode: '',
      }
      console.log('Gửi payload VNPay:', payload) // Debug log
      createVnPayMutation.mutate(payload)
    } else {
      requestCashPaymentMutation.mutate()
    }
  }

  // Danh sách phương thức (Giữ nguyên UI đẹp của bạn)
  const paymentOptions = [
    {
      key: 'Cash',
      title: 'Tiền mặt',
      description: 'Thanh toán trực tiếp tại quầy',
      icon: <Wallet className="w-6 h-6 text-orange-600" />,
      activeColor: 'border-orange-500 bg-orange-50',
    },
    {
      key: 'VnPay',
      title: 'VNPay / QR Code',
      description: 'Quét mã - Thanh toán ngay',
      icon: <QrCode className="w-6 h-6 text-blue-600" />,
      activeColor: 'border-blue-500 bg-blue-50',
    },
  ]

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pt-2 px-2">
          <Receipt className="w-5 h-5 text-gray-700" />
          <span className="text-lg font-bold text-gray-800">Thanh toán đơn hàng</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      className="rounded-2xl overflow-hidden pb-0"
    >
      <div className="px-2 pb-4">
        {/* Tổng tiền */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center my-6 border border-gray-200">
          <Text type="secondary" className="text-sm uppercase tracking-wide font-medium">
            Tổng thanh toán
          </Text>
          <div className="text-4xl font-extrabold text-orange-600 mt-2 tracking-tight">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-2xl align-top">đ</span>
          </div>
        </div>

        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">
            Chọn phương thức
          </span>
        </div>

        {/* Danh sách phương thức */}
        <div className="flex flex-col gap-3">
          {paymentOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => setPaymentMethod(option.key)}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ease-in-out group
                ${
                  paymentMethod === option.key
                    ? option.activeColor
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm mr-4 
                  ${paymentMethod === option.key ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
              >
                {option.icon}
              </div>

              <div className="flex-1">
                <h4
                  className={`font-bold text-base ${paymentMethod === option.key ? 'text-gray-900' : 'text-gray-700'}`}
                >
                  {option.title}
                </h4>
                <p className="text-sm text-gray-500 m-0">{option.description}</p>
              </div>

              {paymentMethod === option.key && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                  <div className="bg-orange-500 rounded-full p-1 shadow-sm">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nút thanh toán */}
        <Button
          type="primary"
          size="large"
          className="mt-8 w-full h-12 text-lg font-bold rounded-xl bg-orange-600 hover:!bg-orange-700 shadow-lg shadow-orange-200 border-none flex items-center justify-center gap-2"
          onClick={handlePayment}
          loading={createVnPayMutation.isPending || requestCashPaymentMutation.isPending}
          // Đừng bao giờ disable nút này nếu totalAmount > 0, hãy để handlePayment báo lỗi nếu cần
        >
          {paymentMethod === 'VnPay' ? 'Thanh toán ngay' : 'Gửi yêu cầu'}
          {!createVnPayMutation.isPending && !requestCashPaymentMutation.isPending && (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>
    </Modal>
  )
}

export default PaymentModal
