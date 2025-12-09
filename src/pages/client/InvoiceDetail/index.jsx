import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Spin, Alert, Button, Tag, Table } from 'antd'
import { Star, ArrowLeft } from 'lucide-react'
import ReviewModal from '@/layouts/DefaultLayout/components/ReviewModal'

const InvoiceDetailPage = () => {
  const { id: invoiceId } = useParams()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState(null)

  // 1. GỌI API
  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await http.get(`/invoices/${invoiceId}`)
      if (res?.data) return res.data
      if (res?._id) return res
      throw new Error('Không tìm thấy dữ liệu hóa đơn.')
    },
    enabled: !!invoiceId,
    staleTime: 0,
  })

  const handleOpenReviewModal = (dishId, orderId, dishName) => {
    setSelectedDish({ dishId, orderId, dishName })
    setIsModalOpen(true)
  }

  // --- XỬ LÝ DỮ LIỆU HIỂN THỊ ---
  const { tableName, allItems, customerName, paymentMethod } = useMemo(() => {
    if (!invoice)
      return { tableName: '...', allItems: [], customerName: '...', paymentMethod: '...' }

    // 1. Tên bàn
    let tName = 'Mang về / Khác'
    if (invoice.table) tName = invoice.table.name || invoice.table.table_name || invoice.table
    else if (invoice.table_id)
      tName = invoice.table_id.name || invoice.table_id.table_name || invoice.table_id

    // 2. Tên khách
    let cName = 'Khách vãng lai'
    const userObj = invoice.user_id || invoice.user
    if (userObj && typeof userObj === 'object') {
      cName = userObj.username || userObj.name || userObj.full_name || userObj.email || cName
    }
    if (cName === 'Khách vãng lai') {
      try {
        const localUser = JSON.parse(localStorage.getItem('user_info') || '{}')
        if (localUser.username || localUser.name) cName = localUser.username || localUser.name
      } catch (e) {}
    }

    // 3. Phương thức thanh toán (ĐÃ CẬP NHẬT LOGIC FALLBACK)
    let method = ''

    // Tìm dữ liệu thực tế
    if (invoice.payment && invoice.payment.method) method = invoice.payment.method
    else if (invoice.transaction && invoice.transaction.type) method = invoice.transaction.type
    else if (invoice.payment_method) method = invoice.payment_method

    // Chuẩn hóa
    const mUpper = String(method).toUpperCase()

    if (mUpper.includes('CASH') || mUpper.includes('TIEN')) method = 'Tiền mặt'
    else if (mUpper.includes('VNPAY') || mUpper.includes('QR')) method = 'VNPay / QR'
    else if (mUpper.includes('TRANSFER') || mUpper.includes('CK')) method = 'Chuyển khoản'

    // --- QUAN TRỌNG: NẾU VẪN CHƯA CÓ DỮ LIỆU ---
    // Nếu trạng thái là PAID (Đã thanh toán) mà không rõ phương thức -> Mặc định là Tiền mặt
    if (
      (!method || method === '') &&
      ['paid', 'completed'].includes(String(invoice.status).toLowerCase())
    ) {
      method = 'Tiền mặt'
    } else if (!method) {
      method = 'Chưa thanh toán'
    }

    // 4. Món ăn
    let items = []
    if (invoice.order_item && Array.isArray(invoice.order_item)) {
      items = invoice.order_item.map((item) => ({
        ...item,
        _id: item._id || Math.random().toString(36).substr(2, 9),
        order_id_ref: Array.isArray(invoice.order_id) ? invoice.order_id[0] : invoice.order_id,
      }))
    } else if (invoice.order_id) {
      // Fallback logic cũ
      const rawOrder = invoice.order_id
      const extractItems = (ord) => ord.items || ord.dishes || ord.products || ord.order_items || []
      if (Array.isArray(rawOrder)) items = rawOrder.flatMap((order) => extractItems(order))
      else if (typeof rawOrder === 'object') items = extractItems(rawOrder)
    }

    return { tableName: tName, allItems: items, customerName: cName, paymentMethod: method }
  }, [invoice])

  const columns = [
    {
      title: 'Tên món',
      key: 'name',
      render: (_, record) => {
        let name = record.name || record.dish_name
        if (!name && record.dish_id) name = record.dish_id.name || record.dish_id.dish_name
        return <span className="font-medium text-gray-800">{name || 'Món ăn'}</span>
      },
    },
    { title: 'SL', dataIndex: 'quantity', width: 50, align: 'center', render: (q) => <b>x{q}</b> },
    {
      title: 'Thành tiền',
      align: 'right',
      render: (_, r) => (
        <span className="text-orange-600 font-bold">
          {(r.price * r.quantity).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 80,
      render: (_, record) => {
        let dishId = record.dish_id?._id || record.dish_id
        let dishName = record.name || record.dish_name
        return (
          <Button
            type="text"
            size="small"
            icon={<Star size={14} />}
            className="text-yellow-600"
            onClick={() => handleOpenReviewModal(dishId, record.order_id_ref, dishName)}
          >
            Đánh giá
          </Button>
        )
      },
    },
  ]

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    )
  if (isError) return <Alert message="Lỗi tải hóa đơn" className="m-8" type="error" />

  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="bg-orange-600 p-4 text-white flex items-center gap-3">
          <Button type="text" icon={<ArrowLeft color="white" />} onClick={() => navigate(-1)} />
          <h1 className="text-lg font-bold flex-1 text-center pr-8">HÓA ĐƠN ĐIỆN TỬ</h1>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Mã hóa đơn</p>
            <p className="text-xl font-mono font-bold text-gray-800">
              #{invoice._id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-y-3 text-sm border-b pb-6 mb-6">
            <span className="text-gray-500">Ngày tạo:</span>
            <span className="text-right font-medium">
              {new Date(invoice.createdAt).toLocaleString('vi-VN')}
            </span>

            <span className="text-gray-500">Khách hàng:</span>
            <span className="text-right font-bold text-blue-600 uppercase">{customerName}</span>

            <span className="text-gray-500">Vị trí:</span>
            <span className="text-right font-medium">{tableName}</span>

            <span className="text-gray-500">Thanh toán:</span>
            <span className="text-right font-bold text-gray-800">
              <Tag color={paymentMethod === 'Tiền mặt' ? 'green' : 'blue'}>{paymentMethod}</Tag>
            </span>
          </div>

          <Table
            dataSource={allItems}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="_id"
            bordered
          />

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <span className="text-lg font-bold text-gray-700">Tổng cộng</span>
            <span className="text-2xl font-extrabold text-red-600">
              {invoice.total_amount?.toLocaleString()}đ
            </span>
          </div>
        </div>
      </div>
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDish={selectedDish}
      />
    </div>
  )
}

export default InvoiceDetailPage
