import React, { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Breadcrumb,
  message,
  Select,
  Input,
  Tag,
  Space,
  Tooltip,
  Typography,
} from 'antd'
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs' // Khuyên dùng dayjs để format ngày tháng chuẩn hơn

// Giả sử đường dẫn API
import invoiceAPI from '@/apis/invoice/invoice.api'
import orderAPI from '@/apis/order/order'

// Component con
import PaymentDetail from './paymentDetail'

const { Option } = Select
const { Title, Text } = Typography

// --- CẤU HÌNH UI CHO TRẠNG THÁI ---
const STATUS_MAP = {
  paid: { color: 'success', label: 'Đã thanh toán' },
  unpaid: { color: 'error', label: 'Chưa thanh toán' },
  'pending payment': { color: 'warning', label: 'Chờ thanh toán' },
  completed: { color: 'processing', label: 'Hoàn thành (Chờ thu)' },
  default: { color: 'default', label: 'Khác' },
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

const PaymentAndBill = () => {
  const queryClient = useQueryClient()

  // --- STATE ---
  const [searchText, setSearchText] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // --- 1. LẤY DỮ LIỆU (React Query) ---
  const {
    data: rawInvoices = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await invoiceAPI.getAll()
      return res.data?.data || res.data || [] // Xử lý các trường hợp trả về của API
    },
    staleTime: 1000 * 60, // Cache trong 1 phút
  })

  // --- 2. XỬ LÝ & LỌC DỮ LIỆU (useMemo) ---
  const { processedData, tableOptions } = useMemo(() => {
    // A. Chuẩn hóa dữ liệu đầu vào
    const formatted = rawInvoices.map((item) => ({
      ...item,
      key: item._id,
      orderId: item._id?.slice(-6).toUpperCase() || '---',
      tableName: item.table_id?.table_name || item.table_id?.name || 'Mang về',
      customerName: item.user_id?.username || item.user_id?.name || 'Khách lẻ',
      staffName: item.served_by?.name || item.servedBy || '-',
      totalAmount: item.total_amount || item.total || item.amount || 0,
      createdAt: item.createdAt || item.created_at,
      status: (item.status || 'unknown').toLowerCase(), // Chuẩn hóa status về chữ thường
    }))

    // B. Tạo danh sách bàn cho Select (Unique)
    const tablesMap = new Map()
    formatted.forEach((item) => {
      const tId = item.table_id?._id || item.table_id
      if (tId && !tablesMap.has(tId)) {
        tablesMap.set(tId, { id: tId, name: item.tableName })
      }
    })

    // C. Lọc dữ liệu
    const filtered = formatted.filter((item) => {
      // Lọc theo từ khóa (Mã đơn hoặc Tên khách)
      const matchesSearch =
        item.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchText.toLowerCase())

      // Lọc theo bàn
      const matchesTable = selectedTable
        ? String(item.table_id?._id || item.table_id) === String(selectedTable)
        : true

      // Lọc theo trạng thái
      const matchesStatus = statusFilter ? item.status === statusFilter.toLowerCase() : true

      return matchesSearch && matchesTable && matchesStatus
    })

    // Sắp xếp mới nhất lên đầu
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return {
      processedData: filtered,
      tableOptions: Array.from(tablesMap.values()),
    }
  }, [rawInvoices, searchText, selectedTable, statusFilter])

  // --- 3. MUTATION: CẬP NHẬT TRẠNG THÁI ---
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      // Ưu tiên gọi patch status
      return await orderAPI.patch(id, { status: newStatus })
    },
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công!')
      queryClient.invalidateQueries(['invoices']) // Tải lại danh sách
      setDetailOpen(false)
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật trạng thái.')
    },
  })

  const handleMarkPaid = (order) => {
    if (!order?._id) return
    const currentStatus = order.status
    const isPaid = currentStatus === 'paid'

    // Logic đảo ngược trạng thái (hoặc set cứng thành Paid tùy nghiệp vụ)
    const newStatus = isPaid ? 'unpaid' : 'paid'

    Modal.confirm({
      title: 'Xác nhận thay đổi trạng thái',
      content: `Bạn có chắc muốn chuyển trạng thái đơn ${order.orderId} thành "${newStatus.toUpperCase()}"?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => updateStatusMutation.mutate({ id: order._id, newStatus }),
    })
  }

  // --- 4. CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderId',
      width: 100,
      render: (text) => (
        <Text strong copyable>
          {text}
        </Text>
      ),
    },
    {
      title: 'Thông tin',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.tableName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Khách: {record.customerName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 160,
      render: (date) => (
        <div style={{ fontSize: 13 }}>
          <div>{dayjs(date).format('HH:mm')}</div>
          <div style={{ color: '#888' }}>{dayjs(date).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      align: 'right',
      render: (amount) => (
        <Text type="danger" strong>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 150,
      render: (status) => {
        const config = STATUS_MAP[status] || STATUS_MAP.default
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            shape="circle"
            icon={<EyeOutlined style={{ color: '#1890ff' }} />}
            onClick={() => {
              setSelectedOrder(record)
              setDetailOpen(true)
            }}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* --- HEADER & BREADCRUMB --- */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: 'Admin' }, { title: 'Quản lý Hóa đơn' }]} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Lịch sử giao dịch
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries(['invoices'])}
            loading={isFetching}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Tìm theo mã đơn, tên khách..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />

          <Select
            placeholder="Lọc theo bàn"
            style={{ width: 200 }}
            allowClear
            onChange={setSelectedTable}
            value={selectedTable}
          >
            {tableOptions.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 200 }}
            allowClear
            onChange={setStatusFilter}
            value={statusFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="paid">
              <Tag color="success">Đã thanh toán</Tag>
            </Option>
            <Option value="unpaid">
              <Tag color="error">Chưa thanh toán</Tag>
            </Option>
            <Option value="pending payment">
              <Tag color="warning">Chờ thanh toán</Tag>
            </Option>
          </Select>
        </div>
      </Card>

      {/* --- DATA TABLE --- */}
      <Card bodyStyle={{ padding: 0 }} bordered={false} className="shadow-sm">
        <Table
          columns={columns}
          dataSource={processedData}
          loading={isLoading}
          rowKey="key"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng cộng ${total} hóa đơn`,
            position: ['bottomRight'],
          }}
        />
      </Card>

      {/* --- DETAIL MODAL --- */}
      <Modal
        open={detailOpen}
        title={
          <Space>
            <DollarOutlined />
            <span>Chi tiết hóa đơn: {selectedOrder?.orderId}</span>
            {selectedOrder && (
              <Tag color={STATUS_MAP[selectedOrder.status]?.color || 'default'}>
                {STATUS_MAP[selectedOrder.status]?.label}
              </Tag>
            )}
          </Space>
        }
        footer={null}
        onCancel={() => setDetailOpen(false)}
        width={800}
        destroyOnClose
      >
        <PaymentDetail
          order={selectedOrder}
          onClose={() => setDetailOpen(false)}
          onMarkPaid={() => handleMarkPaid(selectedOrder)}
          isUpdating={updateStatusMutation.isPending}
        />
      </Modal>
    </div>
  )
}

export default PaymentAndBill
