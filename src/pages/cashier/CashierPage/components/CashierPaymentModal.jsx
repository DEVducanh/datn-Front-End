import React, { useMemo, useRef, useState } from 'react'
import { Modal, Button, Descriptions, message, Tag, Table, Divider, Popconfirm } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import {
  CheckCircleOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  PrinterOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const CashierPaymentModal = ({ isOpen, onClose, order }) => {
  const printRef = useRef(null)
  const queryClient = useQueryClient()
  const [loadingPdf, setLoadingPdf] = useState(false)

  // --- 1. LẤY CHI TIẾT MÓN ĂN ---
  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ['cashier-order-items', order?._id],
    queryFn: async () => {
      if (!order?._id) return []
      const res = await http.get(`/order-item/order/${order._id}`)
      let items = []
      if (Array.isArray(res)) items = res
      else if (res.data && Array.isArray(res.data)) items = res.data
      else if (res.Orderitems) items = res.Orderitems
      return items.filter((item) => item.status !== 'Cancelled')
    },
    enabled: !!order?._id && isOpen,
  })

  // --- 2. LOGIC GỘP MÓN ---
  const groupedItems = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return []
    const groupMap = {}
    orderItems.forEach((item) => {
      let dishName = item.dish_name
      if (item.dish_id && typeof item.dish_id === 'object') {
        dishName = item.dish_id.dish_name || item.dish_id.name
      }
      if (!dishName) dishName = 'Món ăn'

      let uniqueKey = item.dish_id
      if (typeof uniqueKey === 'object' && uniqueKey !== null) uniqueKey = uniqueKey._id
      if (!uniqueKey) uniqueKey = dishName

      if (groupMap[uniqueKey]) {
        groupMap[uniqueKey].quantity += item.quantity
      } else {
        groupMap[uniqueKey] = { ...item, display_name: dishName, quantity: item.quantity }
      }
    })
    return Object.values(groupMap)
  }, [orderItems])

  const realTotal =
    groupedItems.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    order?.total_price ||
    0
  const isPaid = order?.status === 'Paid'

  // --- 3. HÀM IN ẤN THÔNG MINH (ĐÃ SỬA LỖI ĐƠN CŨ) ---
  const handleSmartPrint = async () => {
    // A. Nếu ĐÃ THANH TOÁN -> Cố gắng lấy PDF
    if (isPaid) {
      setLoadingPdf(true)
      try {
        let invoiceId = null

        // CÁCH 1: Kiểm tra xem order đã có invoice_id chưa (nếu backend có populate)
        if (order.invoice_id) {
          invoiceId = typeof order.invoice_id === 'object' ? order.invoice_id._id : order.invoice_id
        }

        // CÁCH 2: Tìm kiếm hóa đơn theo order_id (có filter để tránh phân trang)
        if (!invoiceId) {
          try {
            // Thử gọi API có params để lọc đúng đơn này
            const res = await http.get('/invoices', { params: { order_id: order._id } })
            const list = res.data?.data || res.data || []

            const target = list.find((inv) => {
              const oId = typeof inv.order_id === 'object' ? inv.order_id._id : inv.order_id
              return oId === order._id
            })
            if (target) invoiceId = target._id
          } catch (e) {
            console.log('Lỗi tìm invoice theo params, thử fallback...')
          }
        }

        // CÁCH 3: Fallback (Lấy tất cả - cách cũ, chỉ chạy nếu cách 2 thất bại)
        if (!invoiceId) {
          const resInvoices = await http.get('/invoices')
          const allInvoices = resInvoices.data?.data || resInvoices.data || []
          const target = allInvoices.find((inv) => {
            const invOrderId = typeof inv.order_id === 'object' ? inv.order_id._id : inv.order_id
            return invOrderId === order._id
          })
          if (target) invoiceId = target._id
        }

        if (invoiceId) {
          const resPdf = await http.get(`/invoice/${invoiceId}/pdf`)
          const pdfUrl = resPdf.data?.pdfUrl || resPdf.pdfUrl

          if (pdfUrl) {
            window.open(pdfUrl, '_blank')
            return // Thành công -> Thoát luôn
          }
        }

        // Nếu chạy hết các cách mà vẫn không có PDF -> Chuyển sang in HTML
        message.warning('Không tìm thấy bản PDF (có thể do đơn quá cũ). Đang in phiếu tạm...')
        handlePrintHTML()
      } catch (error) {
        console.error('Lỗi lấy PDF:', error)
        // Gặp lỗi API -> Cũng cho in HTML luôn để không bị tắc
        handlePrintHTML()
      } finally {
        setLoadingPdf(false)
      }
    }
    // B. Nếu CHƯA THANH TOÁN -> In HTML
    else {
      handlePrintHTML()
    }
  }

  // Hàm in HTML cũ (Dùng cho phiếu tạm tính hoặc fallback)
  const handlePrintHTML = () => {
    if (!printRef.current) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Phiếu Tạm Tính</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; border-bottom: 1px solid #000; }
        td { padding: 5px 0; border-bottom: 1px dashed #ccc; }
        .text-right { text-align: right; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px;}
      </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `)
    w.document.close()
    setTimeout(() => {
      w.print()
      w.close()
    }, 500)
  }

  // --- 4. LOGIC THANH TOÁN ---
  const updateToPaidMutation = useMutation({
    mutationFn: async () => {
      await http.patch(`/orders/${order._id}`, { status: 'Paid' })
      const tableId = order.table_id?._id || order.table_id
      if (tableId && String(tableId).length === 24) {
        try {
          await http.patch(`/tables/${tableId}`, { status: 'empty' })
        } catch (e) {}
      }
    },
    onSuccess: () => {
      message.success('Thanh toán thành công!')
      queryClient.invalidateQueries(['cashier-orders'])
      queryClient.invalidateQueries(['tables'])
      onClose()
    },
    onError: () => message.warning('Lỗi cập nhật trạng thái Paid'),
  })

  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: () => updateToPaidMutation.mutate(),
    onError: (err) => message.error('Lỗi tạo hóa đơn'),
  })

  const handleConfirmPayment = async () => {
    if (!order) return
    try {
      if (order.status !== 'Completed') {
        try {
          await http.patch(`/orders/${order._id}`, { status: 'Completed' })
        } catch (e) {}
      }
      // Lưu ý: Thêm method 'Cash' để thống kê đúng
      const payload = { order_id: order._id, method: 'Cash', amount: realTotal }
      createInvoiceMutation.mutate(payload)
    } catch (error) {
      message.error('Lỗi hệ thống')
    }
  }

  const columns = [
    { title: 'Tên món', dataIndex: 'display_name', render: (t, r) => t || r.dish_name || '---' },
    { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60 },
    { title: 'Đơn giá', dataIndex: 'price', align: 'right', render: (v) => formatVnd(v) },
    {
      title: 'Thành tiền',
      align: 'right',
      render: (_, r) => formatVnd((r.price || 0) * (r.quantity || 0)),
    },
  ]

  if (!order) return null

  return (
    <Modal
      title={
        <div className="text-xl font-bold flex items-center gap-2">
          <SolutionOutlined /> Chi tiết thanh toán
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      {/* HTML FORM ĐỂ IN TẠM TÍNH (Ẩn đi) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="header">
            <h2>NHÀ HÀNG FLAREON</h2>
            <h3>PHIẾU TẠM TÍNH</h3>
            <p>
              Bàn: {order.table_id?.name} - Mã: #{order._id.slice(-6).toUpperCase()}
            </p>
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
                  <td>{item.quantity}</td>
                  <td className="text-right">{item.price?.toLocaleString()}</td>
                  <td className="text-right">{(item.price * item.quantity)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total">TỔNG CỘNG: {realTotal.toLocaleString()} đ</div>
          <p style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
            (Phiếu này không có giá trị thanh toán)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* INFO */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Mã đơn">
              <span className="font-mono">#{order._id.slice(-6).toUpperCase()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Bàn">
              <strong>{order.table_id?.name || 'Mang về'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <span className="text-xl font-bold text-red-600">{formatVnd(order.total_price)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {isPaid ? (
                <Tag color="green">Đã thanh toán</Tag>
              ) : (
                <Tag color="orange">Chờ thanh toán</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider orientation="left" style={{ margin: '0' }}>
          Danh sách món ăn
        </Divider>
        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          <Table
            dataSource={groupedItems}
            columns={columns}
            rowKey={(r) => r.dish_id?._id || Math.random()}
            pagination={false}
            loading={isLoading}
            size="small"
            summary={() => (
              <Table.Summary.Row className="bg-gray-50">
                <Table.Summary.Cell index={0} colSpan={3} className="text-right font-bold">
                  Tổng cộng:
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} className="text-right font-bold text-red-600">
                  {formatVnd(realTotal)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
          <Button size="large" onClick={onClose}>
            Đóng
          </Button>

          <Popconfirm
            title="Xác nhận thanh toán"
            description="Bạn có chắc chắn muốn xác nhận đã thu tiền?"
            onConfirm={handleConfirmPayment}
            okText="Đồng ý"
            cancelText="Hủy"
            icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
            disabled={isPaid}
          >
            {/* NÚT IN THÔNG MINH */}
            <Button
              icon={isPaid ? <FilePdfOutlined /> : <PrinterOutlined />}
              onClick={handleSmartPrint}
              size="large"
              loading={loadingPdf}
              type={isPaid ? 'default' : 'dashed'}
              className={isPaid ? 'border-blue-500 text-blue-500' : ''}
            >
              {isPaid ? 'Tải Hóa Đơn PDF' : 'In Phiếu Tạm'}
            </Button>

            <Button
              type="primary"
              size="large"
              className={`${!isPaid ? 'bg-green-600 hover:!bg-green-500' : 'bg-gray-400'} border-none h-12 text-lg font-bold min-w-[150px]`}
              icon={<CheckCircleOutlined />}
              loading={createInvoiceMutation.isPending || updateToPaidMutation.isPending}
              disabled={isPaid}
            >
              {isPaid ? 'Đã thu tiền' : 'Thu tiền'}
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Modal>
  )
}

export default CashierPaymentModal
