import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons'
import { Button, Descriptions, Result } from 'antd'
import axios from 'axios'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

const PaymentResult = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)

  const txnRef = params.get('vnp_TxnRef')
  const secureHash = params.get('vnp_SecureHash')
  const responseCode = params.get('vnp_ResponseCode')
  const amount = params.get('vnp_Amount')
  const bankCode = params.get('vnp_BankCode')
  const CardType = params.get('vnp_CardType')
  const OrderInfo = params.get('vnp_OrderInfo')
  const PayDate = params.get('vnp_PayDate')
  const BankTranNo = params.get('vnp_BankTranNo')
  const TransactionNo = params.get('vnp_TransactionNo')
  const TmnCode = params.get('vnp_TmnCode')
  const TransactionStatus = params.get('vnp_TransactionStatus')
  const isSuccess = responseCode === '00'

  useEffect(() => {
    const handleVNPayReturn = async () => {
      const invoices = await axios.get(
        `https://api-datn-orderfood-backend-2.onrender.com/invoices/${txnRef}`
      )
      if (invoices?.data?.data?.status == 'unpaid') {
        if (responseCode === '00') {
          try {
            const result = await axios.get(
              'https://api-datn-orderfood-backend-2.onrender.com/payment/vnpay-return',
              {
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
              }
            )
            console.log('Kết quả:', result.data)
          } catch (error) {
            console.error('Lỗi gọi API:', error)
          }
        } else {
          console.log('Thanh toán thất bại hoặc bị hủy.')
        }
      }
    }
    handleVNPayReturn()
  }, [responseCode, txnRef])

  const handleGoHome = () => {
    navigate('/flareon')
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
        icon={
          isSuccess ? (
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 72 }} />
          ) : (
            <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 72 }} />
          )
        }
        title={isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        subTitle={isSuccess ? 'Giao dịch của bạn đã hoàn tất.' : 'Đã xảy ra lỗi khi thanh toán.'}
        extra={[
          <Button type="primary" key="home" onClick={handleGoHome}>
            Quay về trang chủ
          </Button>,
        ]}
        style={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 16,
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          background: '#fff',
        }}
      >
        <Descriptions
          title="Chi tiết giao dịch"
          bordered
          column={1}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Descriptions.Item label="Hóa đơn">{txnRef}</Descriptions.Item>
          <Descriptions.Item label="Số tiền">
            <span style={{ fontWeight: 'bold' }}>
              {(Number(amount) / 100).toLocaleString('vi-VN')} ₫
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {responseCode === '00' ? (
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Thành công</span>
            ) : (
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Thất bại</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Result>
    </div>
  )
}

export default PaymentResult
