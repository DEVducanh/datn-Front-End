import { Table, Modal, Tag, message } from 'antd'
import http from '@/apis/http'
import { useState } from 'react'
import SelectPayment from '../selectPayment'
import axios from 'axios'

async function pay({ amount, invoicesId, language = 'vn', bankCode = '' }) {
  try {
    const res = await axios.post(
      'https://api-datn-orderfood-backend-2.onrender.com/payment/create-payment',
      {
        amount: amount,
        invoicesId: invoicesId,
        language: 'vn',
        bankCode: '',
      }
    )

    if (res.data.success && res.data.vnpUrl) {
      window.location.href = res.data.vnpUrl
    } else {
      message.error('Không nhận được URL thanh toán từ server')
    }
  } catch (err) {
    console.error(err)
    message.error('Có lỗi xảy ra khi tạo thanh toán')
  }
}

const PaymentModal = ({ orders, setOrders, visible, onClose }) => {
  const [selectPaymentOpen, setSelectPaymentOpen] = useState(false)
  const [invoiceId, setInvoiceId] = useState(null)
  const [amount, setamount] = useState(null)
  const completedOrders = orders.filter((order) => order.status === 'Completed')
  const totalPrice = completedOrders.reduce((sum, o) => sum + o.total_price, 0)

  const columns = [
    { title: 'Mã đơn hàng', dataIndex: '_id', key: '_id', render: (text) => text.slice(0, 8) },
    {
      title: 'Giá',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="green">{status}</Tag>,
    },
  ]

  const handleConfirmPayment = async () => {
    setSelectPaymentOpen(true)
  }

  const handleSelectPayment = async (method) => {
    if (method == 'VnPay') {
      try {
        const newInvoice = await http.post(
          'https://api-datn-orderfood-backend-2.onrender.com/invoices',
          {
            order_ids: completedOrders.map((o) => o._id),
            method: method,
          }
        )
        console.log(method)
        console.log(newInvoice?.data?.invoice?._id)
        console.log(newInvoice?.data?.invoice?.total_amount)
        pay({
          amount: newInvoice?.data?.invoice?.total_amount,
          invoicesId: newInvoice?.data?.invoice?._id,
        })

        setInvoiceId(newInvoice?.data?.invoice?._id)
        setamount(newInvoice?.data?.invoice?.total_amount)
      } catch (error) {
        console.error(error)
        message.error('Tạo hóa đơn thất bại')
      }
    }
  }

  return (
    <Modal
      title="Xác nhận thanh toán"
      visible={visible}
      onCancel={onClose}
      onOk={handleConfirmPayment}
      okText={`Thanh toán (${totalPrice} VNĐ)`}
    >
      <Table dataSource={completedOrders} columns={columns} rowKey="_id" pagination={false} />
      {selectPaymentOpen && (
        <div style={{ marginTop: 20 }}>
          <SelectPayment
            visible={selectPaymentOpen}
            onClose={() => setSelectPaymentOpen(false)}
            onSelect={handleSelectPayment}
          />
        </div>
      )}
    </Modal>
  )
}

export default PaymentModal
