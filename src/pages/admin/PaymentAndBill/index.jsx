import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Breadcrumb, message, Select, Spin, Popconfirm } from 'antd'
import {
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'

// Giả sử đường dẫn API của bạn là đúng
import tableAPI from '@/apis/table/table.api'
import orderAPI from '@/apis/order/order'
import userAPI from '@/apis/user/user.api'

// Giả sử các component con này tồn tại trong cùng thư mục
import PaymentDetail from './paymentDetail'
import ShearchPayment from './shearchPayment'
import FilterPayment from './filterPayment'

const { Option } = Select

const PaymentAndBill = () => {
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([]) // Đơn hàng đã lọc để hiển thị
  const [allOrders, setAllOrders] = useState([]) // Tất cả đơn hàng từ API
  const [usersMap, setUsersMap] = useState({})
  const [loadingTables, setLoadingTables] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null) // Dùng cho FilterPayment

  useEffect(() => {
    ; (async () => {
      try {
        const users = await fetchUsers()
        await fetchTables()
        await fetchOrders(users)
      } catch (e) {
        console.error("Lỗi khởi tạo trang:", e)
        // Thử tải lại từng phần nếu có lỗi
        await fetchTables().catch(() => { })
        await fetchOrders({}).catch(() => { })
      }
    })()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll()
      const users = res?.data?.data || res?.data || []
      const map = {}
      users.forEach(u => {
        const id = u._id || u.id || u.user_id
        if (id) map[String(id)] = u
      })
      setUsersMap(map)
      return map
    } catch (err) {
      console.warn('fetchUsers failed', err)
      return {}
    }
  }

  const fetchTables = async () => {
    setLoadingTables(true)
    try {
      const res = await tableAPI.getAll()
      const data = res?.data?.data || res?.data || []
      setTables(data)
    } catch (err) {
      message.error('Tải danh sách bàn thất bại')
    } finally {
      setLoadingTables(false)
    }
  }

  const fetchOrders = async (users = {}) => {
    setLoadingOrders(true)
    try {
      const res = await orderAPI.getAll()
      const data = res?.data?.data || res?.data || []
      const usersLookup = Object.keys(users).length ? users : usersMap || {}
      const merged = (data || []).map(o => {
        const uid = o.user_id || o.customer_id || (o.user && (o.user._id || o.user.id)) || o.user
        const user = uid ? usersLookup[String(uid)] : null
        const customerName = o.customer || o.customer_name || (user && (user.name || user.fullName || user.username))
        return { ...o, customer: customerName || o.customer || o.customer_name || '-' }
      })

      setAllOrders(merged) // Lưu trữ tất cả đơn hàng

      // Cập nhật hiển thị dựa trên bộ lọc hiện tại
      let filteredOrders = merged
      if (selectedTable) {
        filteredOrders = filterByTable(filteredOrders, selectedTable)
      }
      if (statusFilter) {
        filteredOrders = filterByStatus(filteredOrders, statusFilter)
      }
      setOrders(filteredOrders) // Hiển thị tất cả nếu không có bàn nào được chọn

    } catch (err) {
      message.error('Tải danh sách đơn hàng thất bại')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Hàm lọc theo Bàn
  const filterByTable = (ordersList, tableId) => {
    if (!tableId) return ordersList // Trả về tất cả nếu không có tableId
    return (ordersList || []).filter(o => {
      const tid = o.table_id || (o.table && (o.table._id || o.table.id)) || o.tableId || o.table?.table_name || o.table_number
      return String(tid) === String(tableId)
    })
  }

  // Hàm lọc theo Trạng thái
  const filterByStatus = (ordersList, status) => {
    if (!status) return ordersList // Trả về tất cả nếu không có status
    return (ordersList || []).filter(o => String(o.status || '').toLowerCase() === String(status).toLowerCase())
  }

  // Hàm lọc theo Tìm kiếm
  const filterBySearch = (ordersList, term) => {
    const q = String(term || '').trim().toLowerCase()
    if (!q) return ordersList // Trả về tất cả nếu không có tìm kiếm

    return (ordersList || []).filter(o => {
      const code = String(o.orderId || o.code || o._id || '').toLowerCase()
      const customer = String(
        o.customer
        || o.customer_name
        || o.user?.name
        || o.user?.fullName
        || o.user?.username
        || ''
      ).toLowerCase()
      return code.includes(q) || customer.includes(q)
    })
  }

  // Hàm tổng hợp tất cả các bộ lọc
  const applyFilters = (filters) => {
    const { table, status, search } = filters

    let result = allOrders

    result = filterByTable(result, table)
    result = filterByStatus(result, status)
    result = filterBySearch(result, search) // Giả sử handleSearch truyền vào `search`

    setOrders(result)
  }


  const onTableChange = (tableId) => {
    setSelectedTable(tableId)
    // Khi đổi bàn, lọc lại danh sách orders
    let filtered = filterByTable(allOrders, tableId)
    if (statusFilter) { // Áp dụng lại bộ lọc trạng thái
      filtered = filterByStatus(filtered, statusFilter)
    }
    setOrders(filtered)
  }

  const openDetail = (order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  const markPaid = async (order) => {
    const id = order._id || order.id || order.order_id || order.key
    if (!id) {
      message.error('Không xác định được ID đơn hàng')
      return
    }

    const current = order.status || ''
    const isCurrentlyPaid = ['paid', 'Paid', 'completed', 'Completed', 'done', 'Done'].includes(String(current))
    const newStatus = isCurrentlyPaid ? 'Pending' : 'Completed'

    try {
      if (orderAPI.updateStatus) {
        await orderAPI.updateStatus(id, newStatus)
      } else if (orderAPI.update) {
        await orderAPI.update(id, { status: newStatus })
      } else if (orderAPI.patch) {
        await orderAPI.patch(id, { status: newStatus })
      } else {
        message.error("Không tìm thấy hàm API để cập nhật trạng thái")
        return
      }
      message.success(isCurrentlyPaid ? 'Đã chuyển về Pending' : 'Cập nhật trạng thái: đã thanh toán')
      await fetchOrders(usersMap) // Tải lại tất cả đơn hàng
      setDetailOpen(false)
    } catch (err) {
      console.error("Lỗi markPaid:", err)
      message.error('Cập nhật trạng thái thất bại')
    }
  }


  const handleDelete = async (order) => {
    const id = order._id || order.id || order.order_id || order.key
    if (!id) {
      message.error('Không xác định được ID đơn hàng')
      return
    }

    try {
      if (orderAPI.delete) {
        await orderAPI.delete(id)
      } else if (orderAPI.remove) {
        await orderAPI.remove(id)
      } else if (orderAPI.update) { // Fallback to soft-delete
        await orderAPI.update(id, { status: 'Deleted' })
      } else if (orderAPI.patch) {
        await orderAPI.patch(id, { status: 'Deleted' })
      } else {
        message.error("Không tìm thấy hàm API để xóa")
        return
      }
      message.success('Xóa đơn hàng thành công')
      await fetchOrders(usersMap) // Tải lại tất cả đơn hàng
      setDetailOpen(false)
    } catch (err) {
      console.error(err)
      message.error('Xóa thất bại')
    }
  }

  const handleSearch = (term) => {
    const q = String(term || '').trim().toLowerCase()

    // Lọc dựa trên các bộ lọc khác
    let base = allOrders
    if (selectedTable) {
      base = filterByTable(base, selectedTable)
    }
    if (statusFilter) {
      base = filterByStatus(base, statusFilter)
    }

    if (!q) {
      setOrders(base) // Nếu không tìm kiếm, trả về danh sách đã lọc
      return
    }

    const filtered = filterBySearch(base, q)
    setOrders(filtered)
  }

  const handleFilterStatus = (status) => {
    setStatusFilter(status)

    // Lọc dựa trên các bộ lọc khác
    let base = allOrders
    if (selectedTable) {
      base = filterByTable(base, selectedTable)
    }

    const filtered = filterByStatus(base, status)
    setOrders(filtered)
    // Cần chạy lại handleSearch nếu có nội dung tìm kiếm
  }

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderId', key: 'orderId', render: (_, r) => r.orderId || r.code || r._id?.slice(-8) || '-' },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer', render: (_, r) => r.customer || r.customer_name || '-' },
    { title: 'Nhân viên', dataIndex: 'servedByName', key: 'servedByName', render: (_, r) => r.servedByName || r.servedBy || '-' },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (v, r) => (v || r?.createdAt ? new Date(v || r.createdAt).toLocaleString('vi-VN') : '-') },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Tổng (₫)', dataIndex: 'total', key: 'total', align: 'right', render: v => (v || 0).toLocaleString('vi-VN') },

    {
      title: () => <div style={{ textAlign: 'center' }}>Hành động</div>,
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={() => openDetail(record)}
            icon={<EyeOutlined />}
            style={{
              borderRadius: 8,
              background: '#fff',
              border: '1px solid #f0f0f0',
              padding: 6,
              height: 36,
              width: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />

          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đơn hàng này?"
            onConfirm={() => handleDelete(record)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{
                borderRadius: 8,
                background: '#fff',
                border: '1px solid #ff4d4f',
                color: '#ff4d4f',
                padding: 6,
                height: 36,
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            s        </Popconfirm>
        </div>
      )
    },
  ]

  return (
    <>
      <section className="mb-3">
        <h1 className="font-bold text-2xl mb-2">Quản lý thanh toán & hóa đơn</h1>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý thanh toán' }]} />
      </section>

      <Card>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>Chọn bàn:</div>
            {loadingTables ? (
              <Spin />
            ) : (
              <Select
                style={{ width: 260 }}
                placeholder="Chọn bàn..."
                value={selectedTable}
                onChange={onTableChange}
                allowClear
              >
                {tables.map(t => {
                  const id = t._id || t.id || t.table_id || t.table_number || t.name
                  const label = t.table_name || t.name || `Bàn ${id}`
                  return <Option key={id} value={id}>{label}</Option>
                })}
              </Select>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShearchPayment onSearch={handleSearch} style={{ width: 360 }} />
            <FilterPayment value={statusFilter} onChange={handleFilterStatus} style={{ minWidth: 220 }} />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loadingOrders}
          rowKey={r => r._id || r.key || r.order_id}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={detailOpen}
        title={selectedOrder ? `Hoá đơn ${selectedOrder.orderId || selectedOrder._id}` : 'Hoá đơn'}
        footer={null}
        onCancel={() => { setDetailOpen(false); setSelectedOrder(null) }}
        width={800}
      >
        <PaymentDetail
          order={selectedOrder}
          onClose={() => { setDetailOpen(false); setSelectedOrder(null) }}
          onMarkPaid={(o) => markPaid(o || selectedOrder)}
        />
      </Modal>
    </>
  )
}

export default PaymentAndBill