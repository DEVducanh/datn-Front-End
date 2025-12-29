import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons'
import { Button, Descriptions, Result, message } from 'antd'
import http from '@/apis/http' // Dùng chung instance axios để có base URL chuẩn
import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PaymentResult = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const hasProcessed = useRef(false) // Tránh gọi API 2 lần do React Strict Mode

  const txnRef = params.get('vnp_TxnRef')
  const secureHash = params.get('vnp_SecureHash')
  const responseCode = params.get('vnp_ResponseCode')
  const amount = params.get('vnp_Amount')
  const bankCode = params.get('vnp_BankCode')

  // Các param phụ khác
  const CardType = params.get('vnp_CardType')
  const OrderInfo = params.get('vnp_OrderInfo')
  const PayDate = params.get('vnp_PayDate')
  const BankTranNo = params.get('vnp_BankTranNo')
  const TransactionNo = params.get('vnp_TransactionNo')
  const TmnCode = params.get('vnp_TmnCode')
  const TransactionStatus = params.get('vnp_TransactionStatus')

  const isSuccess = responseCode === '00'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleVNPayReturn = async () => {
      // Chặn gọi 2 lần
      if (hasProcessed.current) return
      hasProcessed.current = true

      if (!txnRef || !secureHash || !responseCode) {
        console.log('Thiếu param VNPay')
        setLoading(false)
        return
      }

      // --- TRƯỜNG HỢP THẤT BẠI ---
      if (responseCode !== '00') {
        console.log('Thanh toán thất bại/hủy')
        setLoading(false)
        return
      }

      // --- TRƯỜNG HỢP THÀNH CÔNG ---
      try {
        // 1. Kiểm tra hóa đơn (Optional, tùy logic backend bạn)
        // const invoiceRes = await http.get(`/invoices/${txnRef}`)
        // if (invoiceRes?.data?.status === 'paid') { ... return ... }

        // 2. Gọi API xác nhận VNPay (Backend verify hash)
        await http.get('/payment/vnpay-return', {
          params: {
            vnp_TxnRef: txnRef,
            vnp_SecureHash: secureHash,
            vnp_ResponseCode: responseCode,
            vnp_Amount: amount,
            vnp_BankCode: bankCode,
            vnp_CardType: CardType,
            vnp_OrderInfo: OrderInfo,
            vnp_PayDate: PayDate,
            vnp_TmnCode: TmnCode,
            vnp_TransactionStatus: TransactionStatus,
            vnp_TransactionNo: TransactionNo,
            vnp_BankTranNo: BankTranNo,
          },
        })
        console.log('Xác thực VNPay thành công')

        // 3. QUAN TRỌNG: Cập nhật trạng thái đơn hàng thành PAID
        // Lấy ID đơn hàng từ localStorage (đã lưu ở PaymentModal trước khi đi)
        const orderId = localStorage.getItem('paying_order_id')
        if (orderId) {
          console.log('Cập nhật đơn hàng sang Paid:', orderId)
          await http.patch(`/orders/${orderId}/status`, { status: 'Paid' })
          localStorage.removeItem('paying_order_id') // Xóa cache
        }
      } catch (error) {
        console.error('Lỗi xử lý thanh toán:', error)
        message.error('Có lỗi xảy ra khi xác nhận thanh toán.')
      } finally {
        setLoading(false)
      }
    }

    handleVNPayReturn()
  }, [])

  const handleGoHome = () => {
    navigate('/flareon/orders')
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
        padding: '20px',
      }}
    >
      <Result
        status={isSuccess ? 'success' : 'error'}
        icon={
          isSuccess ? (
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 72 }} />
          ) : (
            <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 72 }} />
          )
        }
        title={isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        subTitle={
          loading
            ? 'Đang xử lý kết quả giao dịch...'
            : isSuccess
              ? 'Đơn hàng của bạn đã được thanh toán và xác nhận.'
              : 'Giao dịch bị hủy hoặc xảy ra lỗi.'
        }
        extra={[
          <Button type="primary" key="home" onClick={handleGoHome} size="large">
            Quay về đơn hàng
          </Button>,
        ]}
        style={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 16,
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          background: '#fff',
          padding: '40px 20px',
        }}
      >
        {/* Chỉ hiện chi tiết nếu có thông tin và không đang loading */}
        {!loading && amount && (
          <Descriptions
            title="Chi tiết giao dịch"
            bordered
            column={1}
            style={{ marginTop: 20 }}
            size="small"
          >
            <Descriptions.Item label="Mã giao dịch">{TransactionNo || '---'}</Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <span style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: 16 }}>
                {(Number(amount) / 100).toLocaleString('vi-VN')} ₫
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Ngân hàng">{bankCode}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {PayDate || new Date().toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Result>
    </div>
  )
}

export default PaymentResult
