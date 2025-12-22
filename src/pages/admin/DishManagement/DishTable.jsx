import React, { useMemo } from 'react'
import { Table, Image, Popconfirm, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'
import { STATUS_DISH_MAP } from '@/shared/constants/dish'

const DishTable = ({ data, loading, onEdit, onRemove, deletingId }) => {
  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        align: 'center',
        render: (_, __, index) => <span>{index + 1}</span>,
        width: 70,
      },
      { title: 'Tên món ăn', dataIndex: 'dish_name' },
      {
        title: 'Hình ảnh',
        dataIndex: 'imageUrl',
        render: (url) => (
          <Image
            src={url}
            width={100}
            height={100}
            className="rounded-lg object-cover"
            preview={false}
          />
        ),
      },
      { title: 'Giá', dataIndex: 'price' },
      { title: 'Mô tả', dataIndex: 'description' },
      { title: 'Danh mục', dataIndex: ['category_id', 'category_name'] },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        render: (status) => {
          const info = STATUS_DISH_MAP[status]
          return <Tag color={info.color}>{info.text}</Tag>
        },
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 120,
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <AntButton title="Chỉnh sửa" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            <Popconfirm
              title="Bạn có chắc chắn muốn xoá danh mục này?"
              onConfirm={() => onRemove(record._id)}
              okText="Có"
              cancelText="Không"
            >
              {/* <AntButton
                title="Xoá"
                icon={<DeleteOutlined />}
                danger
                loading={deletingId === record._id}
              /> */}
            </Popconfirm>
          </div>
        ),
      },
    ],
    [onEdit, onRemove]
  )
  return <Table rowKey="_id" loading={loading} columns={columns} dataSource={data} />
}

export default DishTable
