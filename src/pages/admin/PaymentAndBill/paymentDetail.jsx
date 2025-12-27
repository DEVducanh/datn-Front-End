import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Button, Divider, Table, Spin, message, Tag } from 'antd'
import http from '@/apis/http'
import { PrinterOutlined, FilePdfOutlined } from '@ant-design/icons'

const PaymentDetail = ({ order, onClose, onMarkPaid }) => {
  const printRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  // --- 1. LOGIC LẤY DANH SÁCH MÓN ---
  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!order) return

      // A. Nếu có sẵn trong props -> dùng luôn
      const existingItems = order.order_item || order.items || []
      if (existingItems.length > 0) {
        setItems(existingItems)
        return
      }

      // B. Nếu chưa có -> Gọi API
      const realOrderId = order.order_id?._id || order.order_id || order._id
      if (!realOrderId) return

      setLoading(true)
      try {
        const res = await http.get(`/order-item/order/${realOrderId}`)
        let fetchedData = []
        if (Array.isArray(res)) fetchedData = res
        else if (res.Orderitems) fetchedData = res.Orderitems
        else if (res.data) fetchedData = res.data

        // Lọc món hủy nếu cần
        setItems(fetchedData.filter((i) => i.status !== 'Cancelled'))
      } catch (error) {
        console.error('Lỗi tải chi tiết món:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderItems()
  }, [order])

  // --- 2. LOGIC GỘP MÓN ---
  const groupedItems = useMemo(() => {
    if (!items || items.length === 0) return []
    const groupMap = {}

    items.forEach((item) => {
      let dishName = item.dish_name || item.name
      if (item.dish_id && typeof item.dish_id === 'object') {
        dishName = item.dish_id.dish_name || item.dish_id.name
      }
      if (!dishName) dishName = 'Món ăn'

      let uniqueKey = item.dish_id
      if (typeof uniqueKey === 'object' && uniqueKey !== null) uniqueKey = uniqueKey._id
      if (!uniqueKey) uniqueKey = dishName

      if (groupMap[uniqueKey]) {
        groupMap[uniqueKey].quantity += item.quantity || 0
      } else {
        groupMap[uniqueKey] = {
          ...item,
          display_name: dishName,
          quantity: item.quantity || 0,
        }
      }
    })
    return Object.values(groupMap)
  }, [items])

  if (!order) return <div>Đang tải chi tiết...</div>

  // Tính toán tổng tiền
  const subtotal = groupedItems.reduce((s, it) => s + (it.quantity || 0) * (it.price || 0), 0)
  const finalTotal = order.total_amount || order.total || subtotal

  const isPaidStatus = (s) => {
    if (!s) return false
    return ['paid', 'completed', 'done'].includes(String(s).toLowerCase())
  }
  const isPaid = isPaidStatus(order.status)

  // --- 3. [MỚI THÊM] LOGIC TÌM PHƯƠNG THỨC THANH TOÁN ---
  const getPaymentMethod = () => {
    // Ưu tiên 1: Lấy trực tiếp từ Invoice (nếu có)
    let m = order.method

    // Ưu tiên 2: Lấy từ Order liên kết (nếu Invoice có populate order_id)
    if (!m && order.order_id && typeof order.order_id === 'object') {
      m = order.order_id.payment?.method || order.order_id.method
    }

    // Ưu tiên 3: Lấy từ object payment
    if (!m && order.payment) m = order.payment.method

    // Chuẩn hóa hiển thị
    const lowerM = (m || '').toLowerCase()
    if (lowerM.includes('vn') || lowerM.includes('qr')) return <Tag color="blue">VNPay / QR</Tag>
    if (lowerM.includes('cash') || lowerM.includes('tiền'))
      return <Tag color="orange">Tiền mặt</Tag>

    // Nếu không tìm thấy nhưng đã thanh toán -> Mặc định là Tiền mặt (Fallback)
    if (isPaid && !m) return <Tag color="default">Tiền mặt (Mặc định)</Tag>

    return m ? <Tag>{m}</Tag> : <Tag color="default">Chưa xác định</Tag>
  }

  // --- 4. LOGIC IN ẤN THÔNG MINH ---
  const handleSmartPrint = async () => {
    if (isPaid) {
      setLoadingPdf(true)
      try {
        let invoiceId = null
        if (order.order_id) {
          invoiceId = order._id
        } else {
          const res = await http.get('/invoices')
          const all = res.data?.data || res.data || []
          const found = all.find((inv) => {
            const oId = inv.order_id?._id || inv.order_id
            return oId === order._id
          })
          if (found) invoiceId = found._id
        }

        if (invoiceId) {
          const resPdf = await http.get(`/invoice/${invoiceId}/pdf`)
          const url = resPdf.data?.pdfUrl || resPdf.pdfUrl
          if (url) {
            window.open(url, '_blank')
            return
          }
        }
        message.warning('Chưa có bản PDF, chuyển sang in phiếu tạm.')
        handlePrintHTML()
      } catch (e) {
        console.error('Lỗi PDF:', e)
        handlePrintHTML()
      } finally {
        setLoadingPdf(false)
      }
    } else {
      handlePrintHTML()
    }
  }

  const handlePrintHTML = () => {
    if (!printRef.current) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Phiếu Tạm Tính</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
        .info { margin-bottom: 15px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
        td { padding: 5px 0; border-bottom: 1px dashed #ccc; }
        .text-right { text-align: right; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px;}
        .footer { text-align: center; margin-top: 30px; font-size: 12px; font-style: italic; }
      </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `)
    w.document.close()
    setTimeout(() => {
      w.print()
      w.close()
    }, 500)
  }

  // Helper hiển thị
  const formatDate = (v) => {
    try {
      return v ? new Date(v).toLocaleString('vi-VN') : '-'
    } catch {
      return '-'
    }
  }
  const tableName = order.table?.name || order.table_id?.table_name || order.tableName || '-'
  const customerName = order.user?.name || order.user_id?.username || order.guest_info?.name || '-'
  const invoiceIdDisplay = (order._id && `#${String(order._id).slice(-8)}`) || '-'

  const columns = [
    { title: 'Tên món', dataIndex: 'display_name', render: (t, r) => t || r.dish_name || '---' },
    { title: 'SL', dataIndex: 'quantity', align: 'center', render: (v) => v || 0 },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      align: 'right',
      render: (v) => (v || 0).toLocaleString('vi-VN') + '₫',
    },
    {
      title: 'Thành tiền',
      align: 'right',
      render: (_, r) => ((r.quantity || 0) * (r.price || 0)).toLocaleString('vi-VN') + '₫',
    },
  ]

  return (
    <div>
      {/* VÙNG IN ẨN */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="header">
            <h2>PHIẾU TẠM TÍNH</h2>
            <p>
              Mã: {invoiceIdDisplay} - Bàn: {tableName}
            </p>
          </div>
          <div className="info">
            <p>Khách hàng: {customerName}</p>
            <p>Ngày: {formatDate(order.created_at || order.createdAt)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Món</th>
                <th>SL</th>
                <th className="text-right">Giá</th>
                <th className="text-right">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.display_name}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td className="text-right">{item.price?.toLocaleString()}</td>
                  <td className="text-right">{(item.price * item.quantity)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total">TỔNG CỘNG: {finalTotal.toLocaleString()} ₫</div>
          <div className="footer">
            <p>(Phiếu này không có giá trị thanh toán)</p>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN HIỂN THỊ */}
      <div>
        <h3 style={{ marginBottom: 0 }}>Chi tiết hóa đơn</h3>
        <Divider />
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          <div>
            <strong>Mã:</strong> {invoiceIdDisplay}
          </div>
          <div>
            <strong>Bàn:</strong> {tableName}
          </div>
          <div>
            <strong>Ngày:</strong> {formatDate(order.created_at || order.createdAt)}
          </div>
          <div>
            <strong>Trạng thái:</strong> {order.status || '-'}
          </div>
        </div>

        <Spin spinning={loading}>
          <Table
            size="small"
            pagination={false}
            dataSource={groupedItems}
            columns={columns}
            rowKey={(r) => r.dish_id?._id || Math.random()}
            locale={{ emptyText: 'Không tìm thấy chi tiết món ăn' }}
            footer={() => (
              <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '16px' }}>
                Tổng cộng:{' '}
                <span style={{ color: 'red' }}>{finalTotal.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
          />
        </Spin>

        {/* --- [MỚI THÊM] HIỂN THỊ PHƯƠNG THỨC THANH TOÁN --- */}
        <div
          style={{
            marginTop: 15,
            borderTop: '1px dashed #ccc',
            paddingTop: 10,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* <span style={{ color: '#666' }}>Phương thức thanh toán:</span>
          {getPaymentMethod()} */}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <Button onClick={onClose}>Đóng</Button>

        <Button
          onClick={handleSmartPrint}
          loading={loadingPdf}
          icon={isPaid ? <FilePdfOutlined /> : <PrinterOutlined />}
          type={isPaid ? 'default' : 'dashed'}
          className={isPaid ? 'border-blue-500 text-blue-500' : ''}
        >
          {isPaid ? 'Tải Hóa Đơn PDF' : 'In Tạm Tính'}
        </Button>

        <Button
          type="primary"
          onClick={() => onMarkPaid && onMarkPaid(order._id)}
          disabled={isPaid}
        >
          {isPaid ? 'Đã Thanh Toán' : 'Đánh dấu đã thanh toán'}
        </Button>
      </div>
    </div>
  )
}

export default PaymentDetail
