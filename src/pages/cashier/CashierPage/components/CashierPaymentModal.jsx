import React from 'react'
import { Modal, Button, Descriptions, message, Tag, Table, Divider } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { DollarOutlined, CheckCircleOutlined, SolutionOutlined } from '@ant-design/icons'

const formatVnd = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const CashierPaymentModal = ({ isOpen, onClose, order }) => {
  const queryClient = useQueryClient()

  // --- 1. LẤY CHI TIẾT MÓN ĂN (ĐÃ LỌC BỎ MÓN HỦY) ---
  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ['cashier-order-items', order?._id],
    queryFn: async () => {
      if (!order?._id) return []
      const res = await http.get(`/order-item/order/${order._id}`)

      let items = []
      if (Array.isArray(res)) items = res
      else if (res.data && Array.isArray(res.data)) items = res.data
      else if (res.Orderitems) items = res.Orderitems

      // --- LỌC BỎ MÓN HỦY ---
      return items.filter((item) => item.status !== 'Cancelled')
    },
    enabled: !!order?._id && isOpen,
  })

  // --- 2. LOGIC THANH TOÁN (GIỮ NGUYÊN) ---
  const updateToPaidMutation = useMutation({
    mutationFn: async () => {
      console.log('Đang cập nhật trạng thái sang Paid...')
      await http.patch(`/orders/${order._id}/status`, { status: 'Paid' })

      // Update bàn thành trống
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
    onError: () => message.warning('Lỗi cập nhật trạng thái.'),
  })

  const createInvoiceMutation = useMutation({
    mutationFn: (payload) => http.post('/invoices', payload),
    onSuccess: () => updateToPaidMutation.mutate(),
    onError: (err) => message.error(err.response?.data?.message || 'Lỗi tạo hóa đơn.'),
  })

  const handleConfirmPayment = async () => {
    if (!order) return
    try {
      if (order.status !== 'Completed') {
        await http.patch(`/orders/${order._id}/status`, { status: 'Completed' })
      }

      // Tính lại tổng tiền thực tế từ danh sách món đã lọc (Optional nhưng an toàn hơn)
      const realTotal =
        orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) || order.total_price

      const payload = {
        order_id: order._id,
        method: 'Cash',
        amount: realTotal,
      }
      createInvoiceMutation.mutate(payload)
    } catch (error) {
      message.error('Lỗi hệ thống.')
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
              <Tag color="blue">{order.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider orientation="left" style={{ margin: '0' }}>
          Danh sách món ăn (Thực tế)
        </Divider>

        {/* Bảng món ăn */}
        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          <Table
            dataSource={orderItems} // Dữ liệu đã lọc bỏ món hủy
            columns={columns}
            rowKey={(r) => r._id || Math.random()}
            pagination={false}
            loading={isLoading}
            size="small"
            summary={() => (
              // Hiện tổng tiền thực tế dưới chân bảng
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
            className="bg-green-600 hover:!bg-green-500 border-none h-12 text-lg font-bold min-w-[180px]"
            icon={<CheckCircleOutlined />}
            loading={createInvoiceMutation.isPending || updateToPaidMutation.isPending}
            onClick={handleConfirmPayment}
            disabled={order.status === 'Paid'}
          >
            {order.status === 'Paid' ? 'Đã thu tiền' : 'Xác nhận thu tiền'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CashierPaymentModal
