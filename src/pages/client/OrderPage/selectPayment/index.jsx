import { useState } from 'react'
import { Modal, Radio, Button } from 'antd'

const SelectPayment = ({ visible, onClose, onSelect }) => {
  const [paymentMethod, setPaymentMethod] = useState('')

  const handleOk = () => {
    onSelect(paymentMethod)
    onClose()
  }

  return (
    <Modal
      title="Chọn phương thức thanh toán"
      visible={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod}>
        <Radio value="VnPay">VNPay</Radio>
        <Radio value="Cash">Tiền mặt</Radio>
      </Radio.Group>
    </Modal>
  )
}

export default SelectPayment
