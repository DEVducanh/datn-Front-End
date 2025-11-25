import React, { useMemo } from 'react'
import { Table, Popconfirm, Tag, Button, Tooltip } from 'antd' // Nhớ import Button, Tooltip
import { EditOutlined, DeleteOutlined, FileSearchOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'
import AppQRCode from '@/components/AppQRCode'
import { STATUS_TABLE_MAP } from '@/shared/constants/table'

// Nhận prop onViewOrder từ cha
const TableTable = ({ data, loading, onEdit, onRemove, deletingId, onViewOrder }) => {
  const columns = useMemo(
    () => [
      { title: 'Tên bàn', dataIndex: 'table_name' },
      {
        title: 'Sức chứa',
        dataIndex: 'capacity',
        render: (capacity) => <span>{capacity} người</span>,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        render: (status) => {
          const info = STATUS_TABLE_MAP[status]
          return <Tag color={info?.color}>{info?.text}</Tag>
        },
      },
      {
        title: 'QR Code',
        dataIndex: '_id',
        key: 'qrCode',
        align: 'center',
        render: (_, record) => <AppQRCode tableId={record._id} tableName={record.table_name} />,
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 160,
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center justify-center gap-2">
            {/* NÚT XEM ĐƠN HÀNG */}
            {/* Chỉ hiện khi bàn đã đặt hoặc đang dùng */}
            {(record.status === 'occupied' || record.status === 'reserved') && (
              <Tooltip title="Xem đơn hàng">
                <Button
                  icon={<FileSearchOutlined />}
                  size="middle"
                  onClick={() => onViewOrder(record)} // Gọi hàm từ cha
                />
              </Tooltip>
            )}

            <AntButton title="Chỉnh sửa" icon={<EditOutlined />} onClick={() => onEdit(record)} />

            <Popconfirm
              title="Xoá bàn này?"
              onConfirm={() => onRemove(record._id)}
              okText="Có"
              cancelText="Ko"
            >
              <AntButton
                title="Xoá"
                icon={<DeleteOutlined />}
                danger
                loading={deletingId === record._id}
              />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [onEdit, onRemove, deletingId, onViewOrder] // Đừng quên dependency onViewOrder
  )
  return <Table rowKey="_id" loading={loading} columns={columns} dataSource={data} />
}

export default TableTable
