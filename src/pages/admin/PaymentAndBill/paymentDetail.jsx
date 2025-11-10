import React, { useRef } from 'react'
import { Button, Divider, Table } from 'antd'

const PaymentDetail = ({ order, onClose, onMarkPaid }) => {
    const printRef = useRef(null)

    if (!order) return <div>Không có hoá đơn</div>

    const subtotal = (order.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0)

    const handlePrint = () => {
        if (!printRef.current) return
        const w = window.open('', '_blank')
        if (!w) return
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Hoá đơn</title></head><body>')
        w.document.write(printRef.current.innerHTML)
        w.document.write('</body></html>')
        w.document.close()
        setTimeout(() => { w.print(); w.close() }, 300)
    }

    const formatDate = (v) => {
        try {
            const d = v ? new Date(v) : null
            return d ? d.toLocaleString() : '-'
        } catch {
            return v || '-'
        }
    }

    const getOrderIdForAction = () => order._id || order.id || order.order_id || order.key

    const isPaidStatus = (s) => {
        if (!s) return false
        return ['paid', 'Paid', 'completed', 'Completed', 'done', 'Done'].includes(String(s))
    }

    return (
        <div>
            <div ref={printRef}>
                <h3 style={{ marginBottom: 0 }}>Tên cửa hàng</h3>
                <div>Địa chỉ • SĐT</div>
                <Divider />
                <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div><strong>Mã hoá đơn:</strong> {order.orderId || order.code || (order._id && `#${String(order._id).slice(-8)}`) || '-'}</div>
                    <div><strong>Bàn:</strong> {order.tableId || order.table_number || (order.table && (order.table.table_name || order.table.name)) || '-'}</div>
                    <div><strong>Nhân viên:</strong> {order.servedByName || order.servedBy || order.staffName || '-'}</div>
                    <div><strong>Ngày:</strong> {formatDate(order.createdAt)}</div>
                </div>

                <Table
                    size="small"
                    pagination={false}
                    dataSource={(order.items || []).map((it, i) => ({ key: i, ...it }))}
                    columns={[
                        { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
                        { title: 'SL', dataIndex: 'qty', key: 'qty', align: 'center' },
                        { title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right', render: v => (v || 0).toLocaleString('vi-VN') + '₫' },
                        { title: 'Thành tiền', key: 'total', align: 'right', render: (_, r) => ((r.qty || 0) * (r.price || 0)).toLocaleString('vi-VN') + '₫' },
                    ]}
                    footer={() => (
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>
                            Tạm tính: {subtotal.toLocaleString('vi-VN')}₫ — Tổng: {(order.total || subtotal).toLocaleString('vi-VN')}₫
                        </div>
                    )}
                    rowKey="key"
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <Button danger onClick={onClose}>Đóng</Button>
                <Button onClick={handlePrint}>In / Tải</Button>
                <Button
                    type="primary"
                    onClick={() => onMarkPaid && onMarkPaid(getOrderIdForAction())}
                    disabled={isPaidStatus(order.status)}
                >
                    Đánh dấu đã thanh toán
                </Button>
            </div>
        </div>
    )
}

export default PaymentDetail