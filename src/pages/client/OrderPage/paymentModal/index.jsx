import React, { useState, useMemo } from 'react'
import { Modal, Button, Typography, message } from 'antd'
import { Wallet, QrCode, Store, Check, ChevronRight, Receipt } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const PaymentModal = ({ visible, onClose, items = [] }) => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  const { totalAmount, orderIdsToPay } = useMemo(() => {
    // Lọc món 'Shipped' hoặc 'Served' (Cả 2 đều hiểu là Đã phục vụ)
    const servedItems = items.filter(item =>
      (item.status === 'Shipped' || item.status === 'Served') && item.orderStatus !== 'Paid'
    );

    const total = servedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const uniqueOrderIds = [...new Set(servedItems.map(item => item.orderId))];

    return { totalAmount: total, orderIdsToPay: uniqueOrderIds }
  }, [items])

  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: (res) => {
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
              <h3 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu thành công!</h3>
              <p className="text-center text-gray-500 mb-6 px-4">
                Vui lòng đến <strong>Quầy thu ngân</strong> để thanh toán tiền mặt.
              </p>
            </div>
          ),
          okText: 'Xong',
          onOk: () => navigate(0),
        })
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Lỗi tạo hóa đơn.';
      message.error(`Lỗi: ${msg}`);
    },
  })

  const handlePayment = () => {
    if (orderIdsToPay.length === 0) {
      message.warning('Không có món nào ĐÃ PHỤC VỤ để thanh toán.')
      return
    }

    let methodString = 'Cash';
    if (paymentMethod === 'VnPay') methodString = 'VNPAY';

    const payload = {
      order_ids: orderIdsToPay,
      method: methodString,
      amount: totalAmount
    }

    createInvoiceMutation.mutate(payload)
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
      title={<span className="text-lg font-bold">Thanh toán (Món đã phục vụ)</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      className="rounded-2xl"
    >
      <div className="px-2 pb-4">
        <div className="bg-green-50 rounded-xl p-6 text-center my-6 border border-green-200">
          <Text type="secondary" className="text-sm uppercase tracking-wide font-medium">
            Tổng tiền cần trả
          </Text>
          <div className="text-4xl font-extrabold text-green-700 mt-2 tracking-tight">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-2xl align-top">đ</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            (Chỉ tính các món đã mang ra bàn)
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {paymentOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => setPaymentMethod(option.key)}
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
          className="mt-8 w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:!bg-blue-700 border-none"
          onClick={handlePayment}
          loading={createInvoiceMutation.isPending}
          disabled={totalAmount === 0}
        >
          Xác nhận thanh toán
        </Button>
      </div>
    </Modal>
  )
}

export default PaymentModal 