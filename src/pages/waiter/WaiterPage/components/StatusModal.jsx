import React, { useEffect, useState } from 'react'
import { Modal, Radio, Button, message, Tag } from 'antd'
import http from '@/apis/http'
import { useQueryClient } from '@tanstack/react-query'

const StatusModal = ({ isOpen, onClose, table, activeOrder }) => {
    // --- SỬA 'available' -> 'empty' ---
    const [status, setStatus] = useState('empty')
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    useEffect(() => {
        if (table && table.status) {
            // Backend trả về 'empty', mình cũng set 'empty'
            setStatus(table.status)
        }
    }, [table, isOpen])

    const handleUpdate = async () => {
        // Chặn nếu bàn đang có khách mà muốn set Trống (empty)
        if (activeOrder && status === 'empty') {
            message.warning('Bàn đang có đơn chưa thanh toán, không thể set Trống!')
            return
        }

        try {
            setLoading(true)

            // Gọi API: PATCH /tables/:id/status
            // Body: { status: "empty" } (hoặc occupied, reserved...)
            await http.patch(`/tables/${table._id}/status`, { status })

            message.success(`Đã cập nhật trạng thái thành công!`)
            queryClient.invalidateQueries(['waiter-tables'])
            onClose()
        } catch (error) {
            console.error("Lỗi API:", error)
            const serverMessage = error.response?.data?.message || 'Lỗi không xác định'
            message.error(`Lỗi Server: ${serverMessage}`)
        } finally {
            setLoading(false)
        }
    }

    const statusOptions = [
        // --- QUAN TRỌNG: Value phải khớp với enum.ts của Backend ---
        { value: 'empty', label: 'Trống (Sẵn sàng)', color: 'green', disabled: !!activeOrder },
        { value: 'occupied', label: 'Đang có khách', color: 'red', disabled: false },
        { value: 'maintenance', label: 'Bảo trì', color: 'gray', disabled: !!activeOrder },
    ]

    return (
        <Modal
            title={`Cập nhật - ${table?.table_name}`}
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>Hủy</Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleUpdate} className="bg-blue-600">
                    Lưu thay đổi
                </Button>,
            ]}
        >
            <div className="flex flex-col gap-4 py-4">
                <p className="font-semibold text-gray-700">Chọn trạng thái mới:</p>
                <Radio.Group value={status} onChange={(e) => setStatus(e.target.value)} className="flex flex-col gap-3">
                    {statusOptions.map((opt) => (
                        <Radio key={opt.value} value={opt.value} disabled={opt.disabled}>
                            <Tag color={opt.color}>{opt.label}</Tag>
                        </Radio>
                    ))}
                </Radio.Group>
            </div>
        </Modal>
    )
}

export default StatusModal