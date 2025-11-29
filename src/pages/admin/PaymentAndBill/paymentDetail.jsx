import React, { useRef, useState, useEffect } from 'react'
import { Button, Divider, Table, Spin } from 'antd'
import http from '@/apis/http' // Import axios instance của bạn

const PaymentDetail = ({ order, onClose, onMarkPaid }) => {
  const printRef = useRef(null)
  const [items, setItems] = useState([]) // State lưu danh sách món
  const [loading, setLoading] = useState(false)

  // --- LOGIC MỚI: TỰ ĐỘNG LẤY DANH SÁCH MÓN ---
  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!order) return

      // 1. Nếu dữ liệu đã có sẵn trong props thì dùng luôn
      const existingItems = order.order_item || order.items || []
      if (existingItems.length > 0) {
        setItems(existingItems)
        return
      }

      // 2. Nếu chưa có, gọi API lấy từ Backend
      // Tìm Order ID gốc (Vì 'order' ở đây là Invoice, nên cần lấy order_id bên trong nó)
      // order.order_id có thể là string hoặc object
      const realOrderId = order.order_id?._id || order.order_id || order._id

      if (!realOrderId) return

      setLoading(true)
      try {
        console.log('Đang lấy chi tiết món cho Order ID:', realOrderId)
        // Gọi lại API mà bạn đã dùng bên Client OrderPage
        const res = await http.get(`/order-item/order/${realOrderId}`)

        // Xử lý các trường hợp dữ liệu trả về khác nhau
        let fetchedData = []
        if (Array.isArray(res)) fetchedData = res
        else if (res.Orderitems) fetchedData = res.Orderitems
        else if (res.data) fetchedData = res.data

        setItems(fetchedData)
      } catch (error) {
        console.error('Lỗi tải chi tiết món:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderItems()
  }, [order])

  if (!order) return <div>Không có hoá đơn hoặc đang tải chi tiết...</div>

  // Tính subtotal từ danh sách món vừa lấy được
  const subtotal = items.reduce((s, it) => s + (it.quantity || 0) * (it.price || 0), 0)

  const handlePrint = () => {
    if (!printRef.current) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(
      '<!doctype html><html><head><meta charset="utf-8"><title>Hoá đơn</title></head><body>'
    )
    w.document.write(printRef.current.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    setTimeout(() => {
      w.print()
      w.close()
    }, 300)
  }

  const formatDate = (v) => {
    try {
      const d = v ? new Date(v) : null
      return d ? d.toLocaleString('vi-VN') : '-'
    } catch {
      return v || '-'
    }
  }

  const getOrderIdForAction = () => order._id || order.id || order.order_id || order.key

  const isPaidStatus = (s) => {
    if (!s) return false
    return ['paid', 'Paid', 'completed', 'Completed', 'done', 'Done'].includes(
      String(s).toLowerCase()
    )
  }

  const tableName =
    order.table?.name || order.table_id?.table_name || order.tableName || order.table_id?._id || '-'
  const customerName = order.user?.name || order.user_id?.username || order.customer || '-'
  const invoiceIdDisplay =
    (order._id && `#${String(order._id).slice(-8)}`) || order.orderId || order.code || '-'

  // Tổng số tiền (Ưu tiên lấy từ Invoice, nếu ko có thì tính tổng món)
  const finalTotal = order.total_amount || order.total || subtotal

  const handleActionClick = () => {
    const idToLog = getOrderIdForAction()
    onMarkPaid && onMarkPaid(idToLog)
  }

  const columns = [
    {
      title: 'Tên món',
      dataIndex: 'dish_id',
      key: 'name',
      render: (dishId, r) => {
        // Xử lý hiển thị tên món an toàn (cho cả trường hợp populate và chưa populate)
        if (typeof dishId === 'object' && dishId?.dish_name) return dishId.dish_name
        return r.dish_name || r.name || '---'
      },
    },
    { title: 'SL', dataIndex: 'quantity', key: 'qty', align: 'center', render: (v) => v || 0 },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (v) => (v || 0).toLocaleString('vi-VN') + '₫',
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right',
      render: (_, r) => ((r.quantity || 0) * (r.price || 0)).toLocaleString('vi-VN') + '₫',
    },
  ]

  return (
    <div>
      <div ref={printRef}>
        <h3 style={{ marginBottom: 0 }}>Tên cửa hàng</h3>
        <div>Địa chỉ • SĐT</div>
        <Divider />
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <div>
            <strong>Mã hoá đơn:</strong> {invoiceIdDisplay}
          </div>
          <div>
            <strong>Bàn:</strong> {tableName}
          </div>
          <div>
            <strong>Khách hàng:</strong> {customerName}
          </div>
          <div>
            <strong>Nhân viên:</strong>{' '}
            {order.servedByName || order.servedBy || order.staffName || '-'}
          </div>
          <div>
            <strong>Ngày:</strong> {formatDate(order.created_at || order.createdAt)}
          </div>
          <div>
            <strong>Trạng thái:</strong> {order.status || '-'}
          </div>
        </div>

        {/* Bảng món ăn (Có loading) */}
        <Spin spinning={loading}>
          <Table
            size="small"
            pagination={false}
            dataSource={items.map((it, i) => ({ key: it._id || i, ...it }))}
            columns={columns}
            locale={{ emptyText: 'Không tìm thấy chi tiết món ăn' }}
            footer={() => (
              <div style={{ textAlign: 'right', fontWeight: 600 }}>
                Tạm tính: {subtotal.toLocaleString('vi-VN')}₫ — Tổng:{' '}
                {finalTotal.toLocaleString('vi-VN')}₫
              </div>
            )}
          />
        </Spin>

        {(order.payment || order.transaction) && (
          <div
            style={{
              marginTop: 10,
              borderTop: '1px dashed #ccc',
              paddingTop: 10,
              textAlign: 'right',
            }}
          >
            {order.payment && (
              <>
                <div> Phương thức TT: {order.payment.method || '-'}</div>
                <div> Trạng thái TT: {order.payment.status || '-'}</div>
                <div>
                  Số tiền đã trả (Payment):{' '}
                  {order.payment.amount_paid?.toLocaleString('vi-VN') || 0}₫
                </div>
              </>
            )}
            {order.transaction && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div> Trạng thái Giao dịch: {order.transaction.status || '-'}</div>
                <div> Loại Giao dịch: {order.transaction.type || '-'}</div>
                <div>
                  Số tiền GD: {order.transaction.amount_paid?.toLocaleString('vi-VN') || 0}₫
                </div>
                <div> Ngày GD: {formatDate(order.transaction.created_at)}</div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button danger onClick={onClose}>
          Đóng
        </Button>
        <Button onClick={handlePrint}>In / Tải</Button>
        <Button type="primary" onClick={handleActionClick} disabled={isPaidStatus(order.status)}>
          {isPaidStatus(order.status) ? 'Đã Thanh Toán' : 'Đánh dấu đã thanh toán'}
        </Button>
      </div>
    </div>
  )
}

export default PaymentDetail
