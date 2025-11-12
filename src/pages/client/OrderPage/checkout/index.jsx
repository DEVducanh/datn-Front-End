import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Statistic, Button, Divider, Space, message, notification } from 'antd'

import http from '@/apis/http'
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
    console.log(res.data)

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

const Checkout = ({ itemsList }) => {
  const tableId = localStorage.getItem('currentTableId')
  const [orderid, setOrderId] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [selectModal, setSelectModal] = useState(false)

  useEffect(() => {
    if (tableId) {
      handleFetch()
    }
  }, [tableId])

  const handleFetch = async () => {
    try {
      const response = await http.get(
        `https://api-datn-orderfood-backend-2.onrender.com/order-item/by-user-or-table?table_id=${tableId}`
      )
      const data = response.result.data
      setOrderItems(data)
      if (!Array.isArray(data) || data.length === 0) {
        console.log(' Không tìm thấy order nào!')
        return null
      }
      const orderId = data[0]?.order_id?._id

      return orderId
    } catch (error) {
      console.log('error', error)
    }
  }

  const fetchInvoiceByOrder = async (order_id) => {
    try {
      const res = await http.get(
        `https://api-datn-orderfood-backend-2.onrender.com/invoices/by-order/${order_id}`
      )
      return res.data || null
    } catch (err) {
      console.log(err)
      return null
    }
  }

  const handlePayment = async () => {
    setSelectModal(true)
  }

  const handleSelectPayment = async (method) => {
    if (method == 'VnPay') {
      const order_id = await handleFetch()
      const invoice = await fetchInvoiceByOrder(order_id)

      if (!invoice) {
        try {
          const response = await http.post(
            `https://api-datn-orderfood-backend-2.onrender.com/invoices`,
            { order_id, method }
          )

          if (response.success) {
            const invoice = response.data.invoice
            const invoiceId = invoice._id
            const totalamount = invoice.total_amount

            pay({ amount: totalAmount, invoicesId: invoiceId })
          } else {
            notification.error({
              message: 'Tạo hóa đơn thất bại',
              description: response.message || 'Không thể tạo hóa đơn vì đơn hàng chưa completed',
              placement: 'topRight',
            })
          }
        } catch (error) {
          notification.error({
            message: 'Tạo hóa đơn thất bại',
            description: response.message || 'Không thể tạo hóa đơn vì đơn hàng chưa completed',
            placement: 'topRight',
          })
        }
      } else {
        const invoiceId = invoice._id
        const totalamount = invoice.total_amount
        pay({ amount: totalamount, invoicesId: invoiceId })
      }
    }
  }

  const columns = [
    {
      title: 'Món ăn',
      dataIndex: ['dish_id', 'dish_name'],
      key: 'dish_name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Giá (Đơn)',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `${price.toLocaleString()}đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => <Tag color={status === 'Pending' ? 'gold' : 'green'}>{status}</Tag>,
    },
    {
      title: 'Tổng món',
      dataIndex: 'subtotal',
      key: 'subtotal',
      align: 'right',
      render: (total) => (
        <span style={{ color: '#fa541c', fontWeight: 500 }}>{total.toLocaleString()}đ</span>
      ),
    },
  ]
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  return (
    <Card
      title={<div className="text-xl font-bold text-gray-800">Hóa đơn Tạm tính</div>}
      bordered={false}
      style={{
        width: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
        margin: 'auto',
      }}
    >
      <div className="text-gray-500 mb-3">
        Tổng số món đang chờ xử lý: <b>{itemsList?.length || 0}</b>
      </div>

      <Table
        dataSource={orderItems}
        columns={columns}
        pagination={false}
        rowKey={(record) => record.id || record.name}
        bordered
        size="middle"
      />

      <Divider />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Statistic
          title={<span style={{ fontSize: 18, fontWeight: 600 }}>TỔNG CỘNG HÓA ĐƠN</span>}
          value={totalAmount}
          valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
          precision={0}
          suffix="đ"
        />

        <Space>
          <Button
            type="primary"
            size="large"
            style={{
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              fontWeight: 'bold',
            }}
            onClick={handlePayment}
          >
            THANH TOÁN
          </Button>
        </Space>
      </div>
      <SelectPayment
        visible={selectModal}
        onClose={() => setSelectModal(false)}
        onSelect={handleSelectPayment}
      />
    </Card>
  )
}

export default Checkout
