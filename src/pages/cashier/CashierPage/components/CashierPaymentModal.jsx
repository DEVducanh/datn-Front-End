import React from 'react'
import { Modal, Button, Descriptions, message, Tag, Table, Divider } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { CheckCircleOutlined, SolutionOutlined, ClockCircleOutlined } from '@ant-design/icons'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const CashierPaymentModal = ({ isOpen, onClose, order }) => {
  const queryClient = useQueryClient()

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

      // Lọc bỏ món hủy
      return items.filter((item) => item.status !== 'Cancelled')
    },
    enabled: !!order?._id && isOpen,
  })

  // --- 2. LOGIC CẬP NHẬT TRẠNG THÁI CUỐI CÙNG (PAID) ---
  const updateToPaidMutation = useMutation({
    mutationFn: async () => {
      // Cập nhật thành PAID
      await http.patch(`/orders/${order._id}`, { status: 'Paid' })

      // Giải phóng bàn
      const tableId = order.table_id?._id || order.table_id
      if (tableId && String(tableId).length === 24) {
        try {
          await http.patch(`/tables/${tableId}`, { status: 'empty' })
        } catch (e) { }
      }
    },
    onSuccess: () => {
      message.success('Thanh toán thành công!')
      queryClient.invalidateQueries(['cashier-orders'])
      queryClient.invalidateQueries(['tables'])
      onClose()
    },
    onError: (error) => {
      console.error("Lỗi update Paid:", error);
      message.warning('Đã thu tiền nhưng lỗi cập nhật trạng thái.');
    },
  })

  // --- 3. LOGIC TẠO HÓA ĐƠN ---
  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: () => {
      // Tạo hóa đơn xong thì mới chuyển sang Paid
      updateToPaidMutation.mutate()
    },
    onError: (err) => {
      console.error("Lỗi tạo hóa đơn:", err);
      message.error(err.response?.data?.message || 'Lỗi tạo hóa đơn.');
    },
  })

  // --- 4. HÀM XỬ LÝ CHÍNH (ĐÃ SỬA LOGIC "COMPLETED") ---
  const handleConfirmPayment = async () => {
    if (!order) return
    try {
      // BƯỚC 1: QUAN TRỌNG - Kiểm tra nếu chưa Completed thì phải ép sang Completed
      // Vì Backend yêu cầu phải Completed mới cho tạo hóa đơn
      if (order.status !== 'Completed') {
        try {
          // Gọi API update status -> Completed
          await http.patch(`/orders/${order._id}`, { status: 'Completed' })
        } catch (err) {
          console.log("Lỗi ép trạng thái Completed (có thể bỏ qua nếu BE tự xử lý):", err)
        }
      }

      // BƯỚC 2: Tính toán tiền nong
      const realTotal =
        orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) || order.total_price

      // BƯỚC 3: Tạo hóa đơn
      const payload = {
        order_id: order._id,
        method: 'Cash',
        amount: realTotal,
      }
      createInvoiceMutation.mutate(payload)

    } catch (error) {
      console.error("Lỗi hệ thống:", error)
      message.error('Lỗi hệ thống khi xử lý thanh toán.')
    }
  }

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: 'Tên món',
      dataIndex: 'dish_id',
      render: (d, r) => d?.dish_name || r.dish_name || '---',
    },
    { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60 },
    { title: 'Đơn giá', dataIndex: 'price', align: 'right', render: (v) => formatVnd(v) },
    {
      title: 'Thành tiền',
      align: 'right',
      render: (_, r) => formatVnd((r.price || 0) * (r.quantity || 0)),
    },
  ]

  if (!order) return null

  // Check trạng thái hiển thị
  const isPaymentRequested =
    order.status === 'PAYMENT_PENDING' ||
    order.status === 'Pending Payment' ||
    order.payment_status === 'PAYMENT_PENDING' ||
    order.status === 'WAITING_FOR_PAYMENT';

  const isPaid = order.status === 'Paid';

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
      <div className="flex flex-col gap-4">
        {/* Thông tin chung */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Mã đơn">
              <span className="font-mono">#{order._id.slice(-6).toUpperCase()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Bàn">
              <strong>{order.table_id?.name || order.table_id?.table_name || 'Mang về'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <span className="text-xl font-bold text-red-600">{formatVnd(order.total_price)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {isPaid ? <Tag color="green">Đã thanh toán</Tag> :
                isPaymentRequested ? <Tag color="orange" icon={<ClockCircleOutlined />}>Khách gọi t.toán</Tag> :
                  <Tag color="blue">{order.status}</Tag>
              }
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider orientation="left" style={{ margin: '0' }}>
          Danh sách món ăn (Thực tế)
        </Divider>

        {/* Bảng món ăn */}
        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          <Table
            dataSource={orderItems}
            columns={columns}
            rowKey={(r) => r._id || Math.random()}
            pagination={false}
            loading={isLoading}
            size="small"
            summary={() => (
              <Table.Summary.Row className="bg-gray-50">
                <Table.Summary.Cell index={0} colSpan={3} className="text-right font-bold">
                  Tổng cộng:
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} className="text-right font-bold text-red-600">
                  {formatVnd(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
          <Button size="large" onClick={onClose}>
            Đóng
          </Button>

          <Button
            type="primary"
            size="large"
            className={`${!isPaid && isPaymentRequested
              ? 'bg-green-600 hover:!bg-green-500'
              : 'bg-gray-400'
              } border-none h-12 text-lg font-bold min-w-[180px]`}
            icon={<CheckCircleOutlined />}

            // Loading khi đang tạo hóa đơn HOẶC đang update paid
            loading={createInvoiceMutation.isPending || updateToPaidMutation.isPending}

            onClick={handleConfirmPayment}
            disabled={isPaid || !isPaymentRequested}
          >
            {isPaid
              ? 'Đã thu tiền'
              : !isPaymentRequested
                ? 'Chưa yêu cầu'
                : 'Xác nhận thu tiền'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CashierPaymentModal