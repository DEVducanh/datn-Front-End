import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import http from '@/apis/http'
import { Spin, Alert, Button, Tag, Table } from 'antd'
import { Star, ImageOff } from 'lucide-react' // Thêm icon ảnh lỗi
import ReviewModal from '@/layouts/DefaultLayout/components/ReviewModal'

const InvoiceDetailPage = () => {
  const { id: invoiceId } = useParams()
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
    staleTime: 1000 * 60 * 5,
  })

  const handleOpenReviewModal = (dishId, orderId, dishName) => {
    setSelectedDish({ dishId, orderId, dishName })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDish(null)
  }

  // --- KHU VỰC SỬA LOGIC LẤY DỮ LIỆU ---
  const { tableName, allItems } = useMemo(() => {
    if (!invoice) return { tableName: '...', allItems: [] }

    let items = []
    let tName = 'Mang về / Khác'

    // 1. Lấy tên bàn
    if (invoice.table) {
      tName = invoice.table.name || invoice.table
    } else if (invoice.table_id) {
      tName = invoice.table_id.name || invoice.table_id
    }

    // 2. LOGIC LẤY MÓN ĂN
    if (invoice.order_item && Array.isArray(invoice.order_item) && invoice.order_item.length > 0) {
      items = invoice.order_item.map((item) => ({
        ...item,
        // Fake ID nếu thiếu để tránh lỗi key của React
        _id: item._id || Math.random().toString(36).substr(2, 9),
        order_id_ref: Array.isArray(invoice.order_id) ? invoice.order_id[0] : invoice.order_id,
      }))
    } else if (invoice.order_id) {
      const rawOrder = invoice.order_id
      const extractItems = (ord) => ord.items || ord.dishes || ord.products || ord.order_items || []

      if (Array.isArray(rawOrder)) {
        if (rawOrder[0]?.table_id?.name) tName = rawOrder[0].table_id.name
        items = rawOrder.flatMap((order) => extractItems(order))
      } else if (typeof rawOrder === 'object') {
        if (rawOrder.table_id?.name) tName = rawOrder.table_id.name
        items = extractItems(rawOrder)
      }
    }

    return { tableName: tName, allItems: items }
  }, [invoice])

  // --- CẤU HÌNH CỘT (ĐÃ SỬA ĐỂ HIỆN TÊN BẰNG MỌI GIÁ) ---
  const columns = [
    {
      title: 'Tên món',
      key: 'name', // Bỏ dataIndex để lấy toàn bộ record
      render: (_, record) => {
        // 1. Tìm tên món ở mọi ngóc ngách
        let name = record.name || record.dish_name || record.title // Tìm trực tiếp
        if (!name && record.dish_id && typeof record.dish_id === 'object') {
          name = record.dish_id.name || record.dish_id.dish_name // Tìm trong dish_id object
        }

        // 2. Tìm ảnh tương tự
        let image = record.image || record.dish_image
        if (!image && record.dish_id && typeof record.dish_id === 'object') {
          image = record.dish_id.image || record.dish_id.imageUrl
        }
        // Fallback nếu vẫn không thấy tên
        const displayName = name || 'Món ăn (Không tên)'

        return (
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800">{name}</span>
          </div>
        )
      },
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 60,
      render: (q) => <span className="font-bold text-gray-600">x{q || 1}</span>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => <span className="text-gray-600">{(price || 0).toLocaleString()}đ</span>,
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right',
      render: (_, record) => (
        <span className="font-bold text-orange-600">
          {((record.price || 0) * (record.quantity || 0)).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 100,
      render: (_, record) => {
        // Logic tìm tên để truyền vào modal đánh giá
        let dishName = record.name || record.dish_name
        let dishId = record.dish_id

        // Xử lý nếu dish_id là object
        if (typeof dishId === 'object' && dishId !== null) {
          dishName = dishName || dishId.name
          dishId = dishId._id
        }

        return (
          <Button
            type="text"
            icon={<Star size={16} className="text-yellow-500" />}
            className="text-yellow-600 hover:bg-yellow-50"
            onClick={() => handleOpenReviewModal(dishId, record.order_id_ref, dishName || 'Món ăn')}
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
  if (isError) return <Alert message="Lỗi tải hóa đơn" type="error" className="m-8" />
  if (!invoice) return <Alert message="Không tìm thấy hóa đơn" type="warning" className="m-8" />

  const createdDate = new Date(invoice.createdAt || Date.now()).toLocaleString('vi-VN')
  const paymentMethod = invoice.payment?.method || 'Chưa rõ'
  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Chi tiết Hóa đơn</h1>
          <p className="text-gray-400 text-xs mt-1">ID: {invoice._id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <p className="text-gray-500">Ngày tạo:</p>
            <p className="font-semibold text-gray-800">{createdDate}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Vị trí:</p>
            <p className="font-semibold text-gray-800">{tableName}</p>
          </div>
          <div>
            <p className="text-gray-500">Thanh toán:</p>
            <p className="font-semibold text-gray-800">{paymentMethod}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Trạng thái:</p>
            <Tag
              color={
                invoice.status === 'paid' || invoice.status === 'completed' ? 'success' : 'warning'
              }
            >
              {(invoice.status || 'UNPAID').toUpperCase()}
            </Tag>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 text-orange-600 border-l-4 border-orange-500 pl-3">
          Danh sách món ăn ({allItems.length})
        </h2>

        <Table
          dataSource={allItems}
          columns={columns}
          rowKey={(record) => record._id || Math.random()}
          pagination={false}
          size="small"
          bordered
          className="mb-6"
          locale={{ emptyText: 'Không có dữ liệu món ăn' }}
        />

        <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300">
          <span className="text-gray-600 font-medium text-lg">Tổng cộng thanh toán:</span>
          <span className="text-3xl font-bold text-red-600">
            {invoice.total_amount?.toLocaleString()}đ
          </span>
        </div>
      </div>
      <ReviewModal isOpen={isModalOpen} onClose={handleCloseModal} selectedDish={selectedDish} />
    </div>
  )
}

export default InvoiceDetailPage
