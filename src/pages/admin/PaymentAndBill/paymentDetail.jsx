import React, { useRef } from 'react'
import { Button, Divider, Table } from 'antd'

const PaymentDetail = ({ order, onClose, onMarkPaid }) => {
    const printRef = useRef(null)

    if (!order) return <div>Không có hoá đơn hoặc đang tải chi tiết...</div>

    // 💡 SỬA LỖI: Lấy mảng sản phẩm từ 'order_item' (hoặc 'items' nếu API chưa đồng nhất)
    const orderItems = order.order_item || order.items || []

    // Tính subtotal: Cần dùng 'quantity' và 'price' từ order_item
    // Lưu ý: Nếu dish_id không được populate thành tên sản phẩm, cột "Sản phẩm" sẽ trống
    const subtotal = orderItems.reduce((s, it) => s + (it.quantity || 0) * (it.price || 0), 0)

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
            return d ? d.toLocaleString('vi-VN') : '-'
        } catch {
            return v || '-'
        }
    }

    const getOrderIdForAction = () => order._id || order.id || order.order_id || order.key

    const isPaidStatus = (s) => {
        if (!s) return false
        return ['paid', 'Paid', 'completed', 'Completed', 'done', 'Done'].includes(String(s).toLowerCase())
    }

    // 💡 SỬA LỖI: Lấy thông tin từ cấu trúc API chi tiết mới
    const tableName = order.table?.name || order.table_id?.table_name || order.tableName || order.table_id?._id || '-'
    const customerName = order.user?.name || order.user_id?.username || order.customer || '-'
    const invoiceIdDisplay = (order._id && `#${String(order._id).slice(-8)}`) || order.orderId || order.code || '-'

    // Tổng số tiền cuối cùng (ưu tiên total_amount từ API)
    const finalTotal = order.total_amount || order.total || subtotal

    // Hàm gọi hành động và log ID
    const handleActionClick = () => {
        const idToLog = getOrderIdForAction()
        console.log(`[PaymentDetail] Đang gọi hành động cho Hoá đơn ID:`, idToLog)
        onMarkPaid && onMarkPaid(idToLog)
    }

    // 💡 Cột Table: Cần ánh xạ lại trường dữ liệu cho phù hợp với 'order_item'
    const columns = [
        {
            // Vấn đề: API chi tiết chỉ trả về dish_id, không có tên.
            // Nếu bạn muốn hiển thị tên, bạn cần API phải populate dish_id.
            title: '',
            dataIndex: 'dish_name', // Giả sử API sẽ populate thành dish_name
            key: 'name',
            // Tạm thời hiển thị dish_id nếu không có tên
            render: (_, r) => r.name || r.dish_name || r.dish_id || '-'
        },
        { title: 'SL', dataIndex: 'quantity', key: 'qty', align: 'center', render: v => v || 0 }, // SỬ DỤNG quantity
        { title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right', render: v => (v || 0).toLocaleString('vi-VN') + '₫' },
        { title: 'Thành tiền', key: 'total', align: 'right', render: (_, r) => ((r.quantity || 0) * (r.price || 0)).toLocaleString('vi-VN') + '₫' },
    ]

    return (
        <div>
            <div ref={printRef}>
                <h3 style={{ marginBottom: 0 }}>Tên cửa hàng</h3>
                <div>Địa chỉ • SĐT</div>
                <Divider />
                <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>

                    <div><strong>Mã hoá đơn:</strong> {invoiceIdDisplay}</div>

                    {/* 💡 Đã sửa để dùng order.table.name */}
                    <div><strong>Bàn:</strong> {tableName}</div>

                    {/* 💡 Đã sửa để dùng order.user.name */}
                    <div><strong>Khách hàng:</strong> {customerName}</div>

                    <div><strong>Nhân viên:</strong> {order.servedByName || order.servedBy || order.staffName || '-'}</div>

                    {/* 💡 Đã sửa để dùng created_at */}
                    <div><strong>Ngày:</strong> {formatDate(order.created_at || order.createdAt)}</div>

                    {/* 💡 Hiển thị trạng thái */}
                    <div><strong>Trạng thái:</strong> {order.status || '-'}</div>

                </div>

                <Table
                    size="small"
                    pagination={false}
                    // 💡 SỬ DỤNG orderItems (đã được định nghĩa là order.order_item)
                    dataSource={orderItems.map((it, i) => ({ key: i, ...it }))}
                    columns={columns}
                    footer={() => (
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>
                            Tạm tính: {subtotal.toLocaleString('vi-VN')}₫ — Tổng: {finalTotal.toLocaleString('vi-VN')}₫
                        </div>
                    )}
                    rowKey="key"
                />

                {/* 💡 Hiển thị thông tin thanh toán và giao dịch */}
                {(order.payment || order.transaction) && (
                    <div style={{ marginTop: 10, borderTop: '1px dashed #ccc', paddingTop: 10, textAlign: 'right' }}>
                        {/* 💡 Payment Info */}
                        {order.payment && (
                            <>
                                <div>**Phương thức TT:** {order.payment.method || '-'}</div>
                                <div>**Trạng thái TT:** {order.payment.status || '-'}</div>
                                <div>**Số tiền đã trả (Payment):** {order.payment.amount_paid?.toLocaleString('vi-VN') || 0}₫</div>
                            </>
                        )}
                        {/* 💡 Transaction Info */}
                        {order.transaction && (
                            <>
                                <Divider style={{ margin: '8px 0' }} />
                                <div>**Trạng thái Giao dịch:** {order.transaction.status || '-'}</div>
                                <div>**Loại Giao dịch:** {order.transaction.type || '-'}</div>
                                <div>**Số tiền GD:** {order.transaction.amount_paid?.toLocaleString('vi-VN') || 0}₫</div>
                                <div>**Ngày GD:** {formatDate(order.transaction.created_at)}</div>
                            </>
                        )}
                    </div>
                )}

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <Button danger onClick={onClose}>Đóng</Button>
                <Button onClick={handlePrint}>In / Tải</Button>
                <Button
                    type="primary"
                    onClick={handleActionClick}
                    disabled={isPaidStatus(order.status)}
                >
                    {isPaidStatus(order.status) ? 'Đã Thanh Toán' : 'Đánh dấu đã thanh toán'}
                </Button>
            </div>
        </div>
    )
}

export default PaymentDetail