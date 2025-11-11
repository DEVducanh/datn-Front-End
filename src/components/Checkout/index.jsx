import React, { useState } from 'react'
import { Row, Col, Card, Table, Radio, Button, message } from 'antd'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const data = [
  { key: '1', name: 'Sản phẩm A', price: 30000, quantity: 1 },
  { key: '2', name: 'Sản phẩm B', price: 200000, quantity: 1 },
]

const columns = [
  { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
  { title: 'Giá', dataIndex: 'price', key: 'price' },
  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
]

const VNPayTest = () => {
  const [paymentMethod, setPaymentMethod] = useState('VNPAY')

  const totalAmount = data.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const handlePayment = async () => {
    if (paymentMethod !== 'VNPAY') {
      message.info('Hiện tại chỉ  thanh toán VNPay')
      return
    }
    console.log('VnPay', paymentMethod)

    try {
      const res = await axios.post('http://localhost:8080/payment/create-payment', {
        amount: 172800,
        invoicesId: '6912b1c242a13bcd9fced9e5',
        language: 'vn',
        bankCode: '',
      })
      console.log(res.data)

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      } else {
        message.error('Không nhận được URL thanh toán từ server')
      }
    } catch (err) {
      console.error(err)
      message.error('Có lỗi xảy ra khi tạo thanh toán')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Thanh toán</h1>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Thông tin sản phẩm">
            <Table pagination={false} dataSource={data} columns={columns} />
            <h3>Tổng tiền: {totalAmount}</h3>

            <Radio.Group
              defaultValue={'VNPAY'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <Radio value={'VNPAY'}>VNPAY</Radio>
              <Radio value={'ZALOPAY'}>ZALOPAY</Radio>
              <Radio value={'COD'}>Ship COD</Radio>
            </Radio.Group>

            <Button onClick={handlePayment} style={{ marginTop: 20 }} type="primary">
              Thanh toán
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default VNPayTest
