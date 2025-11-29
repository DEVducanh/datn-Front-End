import React, { useState, useMemo } from 'react'
import { Modal, Button, Typography, message, Spin } from 'antd'
import { Wallet, QrCode, Store, Check } from 'lucide-react'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const PaymentModal = ({ visible, onClose, items = [] }) => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [isProcessing, setIsProcessing] = useState(false)

  // TÍNH GIÁ & LẤY ID ĐƠN
  const { totalAmount, singleOrderId, orderIdsToPay } = useMemo(() => {
    const payableItems = items.filter(
      (item) => item.orderStatus !== 'Paid' && item.status !== 'Cancelled'
    )

    const total = payableItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const uniqueOrderIds = [...new Set(payableItems.map((item) => item.orderId))]
    const id = uniqueOrderIds.length > 0 ? uniqueOrderIds[0] : null

    return { totalAmount: total, singleOrderId: id, orderIdsToPay: uniqueOrderIds }
  }, [items])

  // XỬ LÝ THANH TOÁN
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
      // ======= TIỀN MẶT =======
      if (paymentMethod === 'Cash') {
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

      // ======= VNPAY =======
      if (paymentMethod === 'VnPay') {
        // Cập nhật Completed
        try {
          const updatePromises = orderIdsToPay.map((id) =>
            http.patch(`/orders/${id}/status`, { status: 'Completed' })
          )
          await Promise.all(updatePromises)
        } catch (err) {
          console.warn('Lỗi update status:', err)
        }

        // Tạo hóa đơn
        const invoicePayload = {
          order_id: singleOrderId,
          method: 'VnPay',
          amount: totalAmount,
        }

        const invoiceRes = await http.post('/invoices', invoicePayload)

        const invoiceId =
          invoiceRes.data?.invoice?._id ||
          invoiceRes.data?._id ||
          invoiceRes.invoice?._id ||
          invoiceRes._id

        if (!invoiceId) throw new Error('Không lấy được ID hóa đơn từ Server')

        // Lấy link VNPay
        const paymentRes = await http.post('/payment/create-payment', {
          amount: totalAmount,
          invoicesId: invoiceId,
          language: 'vn',
          bankCode: '',
        })

        const vnpUrl = paymentRes.vnpUrl || paymentRes.data?.vnpUrl || paymentRes.data?.url

        if (vnpUrl) {
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
              {paymentMethod === 'Cash'
                ? 'Đang gửi yêu cầu...'
                : 'Đang kết nối cổng thanh toán...'}
            </p>
          </div>
        )}

        <div className="bg-orange-50 rounded-xl p-6 text-center my-6 border border-orange-200">
          <Text type="secondary" className="text-sm uppercase tracking-wide font-medium">
            Tổng tiền
          </Text>
          <div className="text-4xl font-extrabold text-orange-700 mt-2 tracking-tight">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-2xl">đ</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {paymentOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => !isProcessing && setPaymentMethod(option.key)}
              className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                ${paymentMethod === option.key
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
