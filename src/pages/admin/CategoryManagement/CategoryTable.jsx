import React, { useMemo } from 'react'
import { Table, Popconfirm, Space, Switch, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'

const CategoryTable = ({ data, loading, onEdit, onRemove, deletingId, onToggleStatus }) => {
  const columns = useMemo(
    () => [
      {
        title: 'Ảnh',
        dataIndex: 'imageUrl',
        key: 'imageUrl',
        width: 100,
        render: (url) => (
          <div className="w-16 h-16 rounded overflow-hidden border bg-gray-50">
            {url ? (
              <img src={url} alt="img" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>
        ),
      },
      {
        title: 'Tên danh mục',
        dataIndex: 'category_name',
        render: (text) => <span className="font-semibold">{text}</span>,
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        ellipsis: true,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 150,
        render: (status, record) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={status === 1} // 1 là Bật
              checkedChildren="Hiện"
              unCheckedChildren="Ẩn"
              onChange={(checked) => {
                // Gọi hàm từ cha truyền xuống
                if (onToggleStatus) {
                  onToggleStatus(record, checked)
                }
              }}
            />
            {/* Tag hiển thị phụ trợ nếu cần */}
            <Tag color={status === 1 ? 'success' : 'default'}>
              {status === 1 ? 'Active' : 'Hidden'}
            </Tag>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        align: 'center',
        width: 150,
        render: (_, record) => (
          <Space>
            <AntButton title="Sửa" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            {/* <Popconfirm
              title="Xoá danh mục?"
              description="Các món thuộc danh mục này cũng sẽ bị ẩn!"
              onConfirm={() => onRemove(record._id)}
              okText="Xoá"
              cancelText="Hủy"
              okType="danger"
            >
              <AntButton
                title="Xoá"
                icon={<DeleteOutlined />}
                danger
                loading={deletingId === record._id}
              />
            </Popconfirm> */}
          </Space>
        ),
      },
    ],
    [onEdit, onRemove, deletingId, onToggleStatus]
  )

  return (
    <Table
      rowKey="_id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10 }}
    />
  )
}

export default CategoryTable
