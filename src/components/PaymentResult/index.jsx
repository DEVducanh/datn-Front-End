import { useLocation } from 'react-router-dom'

const PaymentResult = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const txnRef = params.get('vnp_TxnRef')
  const secureHash = params.get('vnp_SecureHash')
  const responseCode = params.get('vnp_ResponseCode')
  const amount = params.get('vnp_Amount')

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
