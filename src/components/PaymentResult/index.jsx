import axios from 'axios'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PaymentResult = () => {
  const location = useLocation()
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

  useEffect(() => {
    const handleVNPayReturn = async () => {
      const invoices = await axios.get(`http://localhost:8080/invoices/${txnRef}`)
      // console.log('invoi', invoices.data.data.status)

      if (invoices?.data?.data?.status == 'unpaid') {
        // console.log('respone code', responseCode)

        if (responseCode === '00') {
          try {
            const result = await axios.get('http://localhost:8080/payment/vnpay-return', {
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

  return (
    <div>
      <h2>Kết quả thanh toán</h2>
      <p>TxnRef: {txnRef}</p>
      <p>Amount: {amount}</p>
      <p>ResponseCode: {responseCode}</p>
      <p>SecureHash: {secureHash}</p>
    </div>
  )
}

export default PaymentResult
