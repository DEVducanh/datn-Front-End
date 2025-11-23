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
      // Gọi API cập nhật trạng thái đơn hàng thành 'Paid' (hoặc 'Completed' tùy backend bạn)
      // Thông thường sau khi thu tiền xong, đơn hàng nên là 'Paid' hoặc 'Served' và ẩn đi
      await http.patch(`/orders/${order._id}/status`, { status: 'Paid' })
    },
    onSuccess: () => {
      message.success('Thanh toán thành công! Đơn hàng đã hoàn tất.')
      queryClient.invalidateQueries(['cashier-orders']) // Làm mới danh sách
      onClose()
    },
    onError: () => {
      // Dù lỗi bước này thì tiền cũng đã thu rồi, chỉ là status chưa cập nhật
      message.warning('Đã thu tiền nhưng cập nhật trạng thái thất bại. Vui lòng tải lại trang.')
      onClose()
    },
  })

  // --- 2. BƯỚC GIỮA: Tạo hóa đơn ---
  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: () => {
      // Sau khi tạo hóa đơn thành công -> Cập nhật trạng thái Order thành Paid
      updateToPaidMutation.mutate()
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Lỗi tạo hóa đơn.'
      message.error(msg)
    },
  })

  // --- 1. BƯỚC ĐẦU: Chuẩn bị trạng thái 'Completed' ---
  const handleConfirmPayment = async () => {
    if (!order) return

    try {
      // Bước 1: Nếu đơn chưa phải Completed, ép nó về Completed trước
      // (Vì backend của bạn yêu cầu đơn phải Completed mới cho tạo hóa đơn)
      if (order.status !== 'Completed') {
        await http.patch(`/orders/${order._id}/status`, { status: 'Completed' })
      }

      // Bước 2: Gọi tạo hóa đơn
      const payload = {
        order_id: [order._id],
        payment_method: 'Cash',
        amount: order.total_price,
      }
      createInvoiceMutation.mutate(payload)
    } catch (error) {
      message.error('Lỗi: Không thể cập nhật trạng thái đơn hàng.')
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
