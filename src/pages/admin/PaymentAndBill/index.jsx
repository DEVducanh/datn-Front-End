import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, Table, Button, Modal, Breadcrumb, message, Select, Spin, Input } from 'antd'
import { EyeOutlined } from '@ant-design/icons'

import invoiceAPI from '@/apis/invoice/invoice.api'
import orderAPI from '@/apis/order/order'

// Giả sử các component con này tồn tại trong cùng thư mục
import PaymentDetail from './paymentDetail'
import ShearchPayment from './shearchPayment'
import FilterPayment from './filterPayment'

const { Option } = Select

const PaymentAndBill = () => {
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [tableNamesMap, setTableNamesMap] = useState({})

  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)

  // Hàm lọc theo Bàn (Sử dụng useCallback để tối ưu)
  const filterByTable = useCallback((ordersList, tableId) => {
    if (!tableId) return ordersList
    return (ordersList || []).filter(o => {
      const invoiceTableId = o.table_id?._id || o.table_id
      return String(invoiceTableId) === String(tableId)
    })
  }, [])

  // Hàm lọc theo Trạng thái
  const filterByStatus = (ordersList, status) => {
    if (!status) return ordersList
    return (ordersList || []).filter(o => String(o.status || '').toLowerCase() === String(status).toLowerCase())
  }

  const fetchInvoices = async () => {
    setLoadingOrders(true)
    try {
      const res = await invoiceAPI.getAll()
      const data = res?.data || []

      const merged = (data || []).map(o => {
        const customerName = o.user_id?.username || '-'
        const tableName = o.table_id?.table_name || 'N/A'
        const totalAmount = o.total_amount || o.total || 0
        const orderId = o._id?.slice(-8) || '-'

        return {
          ...o,
          customer: customerName,
          total: totalAmount,
          orderId: orderId,
          tableName: tableName,
          table_id: o.table_id
        }
      })

      // Tạo map danh sách bàn để hiển thị dropdown
      const map = {}
      merged.forEach(o => {
        const id = o.table_id?._id || o.table_id
        const name = o.table_id?.table_name || 'Bàn Khác'
        if (id) {
          map[String(id)] = { id: id, name: name }
        }
      })
      setTableNamesMap(map)

      setAllOrders(merged)

      // Áp dụng bộ lọc hiện tại
      let result = merged
      if (selectedTable) {
        result = filterByTable(result, selectedTable)
      }
      if (statusFilter) {
        result = filterByStatus(result, statusFilter)
      }
      setOrders(result)

    } catch (err) {
      console.error(err)
      message.error('Tải danh sách hóa đơn thất bại')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const onTableChange = (tableId) => {
    setSelectedTable(tableId)
    let filtered = filterByTable(allOrders, tableId)
    if (statusFilter) {
      filtered = filterByStatus(filtered, statusFilter)
    }
    setOrders(filtered)
  }

  const fetchDetailAndOpenModal = async (invoiceSummary) => {
    const id = invoiceSummary._id || invoiceSummary.id
    if (!id) {
      message.error('Không tìm thấy ID hóa đơn.')
      return
    }

    setLoadingDetail(true)
    try {
      const res = await invoiceAPI.getById(id)
      const detailedData = res?.data || res
      setSelectedOrder({
        ...invoiceSummary,
        ...detailedData
      })
      setDetailOpen(true)
    } catch (err) {
      message.error('Tải chi tiết hóa đơn thất bại.')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Alias cho hàm mở chi tiết
  const openDetail = fetchDetailAndOpenModal

  const markPaid = async (order) => {
    const id = order._id || order.id || order.order_id || order.key || order
    if (!id) {
      message.error('Không xác định được ID hóa đơn')
      return
    }

    const current = order.status || ''
    const isCurrentlyPaid = ['paid', 'Paid', 'completed', 'Completed', 'done', 'Done'].includes(String(current))
    const newStatus = isCurrentlyPaid ? 'unpaid' : 'paid'

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
      message.success(isCurrentlyPaid ? 'Đã chuyển về Unpaid' : 'Cập nhật trạng thái: đã thanh toán')
      await fetchInvoices()
      setDetailOpen(false)
    } catch (err) {
      console.error("Lỗi markPaid:", err)
      message.error('Cập nhật trạng thái thất bại')
    }
  }

  const handleSearch = (term) => {
    const q = String(term || '').trim().toLowerCase()

    // Lọc dựa trên danh sách gốc (allOrders)
    const filtered = (allOrders || []).filter(o => {
      const code = String(o.orderId || o.code || o._id || '').toLowerCase()
      const customer = String(o.customer || '').toLowerCase()
      return code.includes(q) || customer.includes(q)
    })

    // Áp dụng thêm filter bàn nếu có
    const result = selectedTable ? filterByTable(filtered, selectedTable) : filtered

    // Áp dụng thêm filter status nếu có
    const finalResult = statusFilter ? filterByStatus(result, statusFilter) : result

    setOrders(finalResult)
  }

  const handleFilterStatus = (status) => {
    setStatusFilter(status)
    let base = allOrders
    if (selectedTable) {
      base = filterByTable(base, selectedTable)
    }
    const filtered = filterByStatus(base, status)
    setOrders(filtered)
  }

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderId', key: 'orderId', render: (v) => v || '-' },
    { title: 'Bàn', dataIndex: 'tableName', key: 'tableName' },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer', render: (v) => v || '-' },
    { title: 'Nhân viên', dataIndex: 'servedByName', key: 'servedByName', render: (_, r) => r.servedByName || r.servedBy || '-' },
    { title: 'Thời gian', dataIndex: 'created_at', key: 'created_at', render: (v) => v ? new Date(v).toLocaleTimeString() + ' ' + new Date(v).toLocaleDateString() : '-' },
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
            loading={selectedOrder?._id === record._id && loadingDetail}
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
        </div>
      )
    },
  ]

  const tablesForSelect = useMemo(() => Object.values(tableNamesMap), [tableNamesMap])

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
            {loadingOrders ? (
              <Spin />
            ) : (
              <Select
                style={{ width: 260 }}
                placeholder="Chọn bàn..."
                value={selectedTable}
                onChange={onTableChange}
                allowClear
              >
                {tablesForSelect.map(t => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
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
          loading={loadingOrders || loadingDetail}
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