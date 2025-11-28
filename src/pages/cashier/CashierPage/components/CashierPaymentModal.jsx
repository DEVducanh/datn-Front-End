import React from 'react'
import { Modal, Button, Descriptions, message, Tag } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { DollarOutlined, CheckCircleOutlined } from '@ant-design/icons'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const CashierPaymentModal = ({ isOpen, onClose, order }) => {
  const queryClient = useQueryClient()

  // --- 3. BƯỚC CUỐI: Cập nhật đơn hàng thành PAID ---
  const updateToPaidMutation = useMutation({
    mutationFn: async () => {
      // Gọi API cập nhật trạng thái đơn hàng thành 'Paid'
      console.log('Đang cập nhật trạng thái sang Paid...')
      await http.patch(`/orders/${order._id}/status`, { status: 'Paid' })
    },
    onSuccess: () => {
      message.success('Thanh toán thành công! Đơn hàng đã hoàn tất.')
      queryClient.invalidateQueries(['cashier-orders']) // Làm mới danh sách ngay lập tức
      queryClient.invalidateQueries(['orders']) // Refresh thêm key này cho chắc
      onClose()
    },
    onError: (error) => {
      console.error('Lỗi update Paid:', error)
      message.warning('Đã thu tiền nhưng chưa cập nhật được trạng thái. Vui lòng thử lại.')
    },
  })

  // --- 2. BƯỚC GIỮA: Tạo hóa đơn ---
  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: (res) => {
      console.log('Tạo hóa đơn thành công, chuẩn bị update Paid...')
      // Sau khi tạo hóa đơn thành công -> Cập nhật trạng thái Order thành Paid
      updateToPaidMutation.mutate()
    },
    onError: (err) => {
      console.error('Lỗi tạo hóa đơn:', err)
      const msg = err.response?.data?.message || 'Lỗi tạo hóa đơn.'
      message.error(msg)
    },
  })

  // --- 1. BƯỚC ĐẦU: Logic xử lý ---
  const handleConfirmPayment = async () => {
    if (!order) return

    try {
      // Bước 1: Ép trạng thái về Completed (Yêu cầu của Backend để tạo được Invoice)
      // Chỉ gọi nếu trạng thái chưa phải là Completed
      if (order.status !== 'Completed') {
        console.log('Chuyển trạng thái sang Completed trước...')
        await http.patch(`/orders/${order._id}/status`, { status: 'Completed' })
      }

      // Bước 2: Tạo Payload CHUẨN (Quan trọng nhất)
      const payload = {
        order_id: order._id, // <-- SỬA LỖI 1: Truyền String, KHÔNG dùng mảng [order._id]
        method: 'Cash', // <-- SỬA LỖI 2: Dùng key 'method' cho giống bên Client
        amount: order.total_price,
      }

      console.log('Gửi yêu cầu tạo hóa đơn:', payload)
      createInvoiceMutation.mutate(payload)
    } catch (error) {
      console.error('Lỗi quy trình:', error)
      message.error('Lỗi hệ thống: Không thể cập nhật trạng thái đơn hàng.')
    }
  }

  if (!order) return null

  return (
    <Modal
      title={
        <div className="text-xl font-bold flex items-center gap-2">
          <DollarOutlined /> Xác nhận thu tiền mặt
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="flex flex-col gap-4">
        {/* Thông tin đơn hàng */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Descriptions column={1} bordered size="small" layout="horizontal">
            <Descriptions.Item label="Mã đơn">
              <span className="font-mono">#{order._id.slice(-6)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Bàn">
              <strong>{order.table_id?.name || order.table_id?.table_name || 'Mang về'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hiện tại">
              <Tag color={order.status === 'Pending Payment' ? 'red' : 'blue'}>{order.status}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
            <span className="text-lg font-medium text-gray-600">Tổng tiền phải thu:</span>
            <span className="text-3xl font-bold text-red-600">{formatVnd(order.total_price)}</span>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm italic">
          *Hành động này sẽ xác nhận đã nhận tiền mặt và hoàn tất đơn hàng.
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3 justify-end mt-2">
          <Button size="large" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            className="bg-green-600 hover:!bg-green-500 border-none min-w-[150px]"
            icon={<CheckCircleOutlined />}
            loading={createInvoiceMutation.isPending || updateToPaidMutation.isPending}
            onClick={handleConfirmPayment}
          >
            Đã thu tiền
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CashierPaymentModal
