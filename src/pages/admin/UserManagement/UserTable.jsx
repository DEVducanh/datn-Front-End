import React, { useMemo } from 'react'
import { Table, Popconfirm, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'
import { ROLE_MAP } from '@/shared/constants/user'

const UserTable = ({ data, loading, onEdit, onRemove, deletingId }) => {
  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        align: 'center',
        render: (_, __, index) => <span>{index + 1}</span>,
        width: 70,
      },
      { title: 'Tên người dùng', dataIndex: 'username' },
      { title: 'Email', dataIndex: 'email' },
      { title: 'Số điện thoại', dataIndex: 'phone' },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        render: (status) => {
          const info = ROLE_MAP[status]
          return <Tag color={info.color}>{info.text}</Tag>
        },
      },
      // {
      //   title: 'Thao tác',
      //   key: 'action',
      //   width: 120,
      //   align: 'center',
      //   render: (_, record) => (
      //     <div className="flex items-center gap-2">
      //       {/* <AntButton title="Chỉnh sửa" icon={<EditOutlined />} onClick={() => onEdit(record)} />
      //       <Popconfirm
      //         title="Bạn có chắc chắn muốn xoá danh mục này?"
      //         onConfirm={() => onRemove(record._id)}
      //         okText="Có"
      //         cancelText="Không"
      //       >
      //         <AntButton
      //           title="Xoá"
      //           icon={<DeleteOutlined />}
      //           danger
      //           loading={deletingId === record._id}
      //         />
      //       </Popconfirm> */}
      //     </div>
      //   ),
      // },
    ],
    [onEdit, onRemove]
  )
  return <Table rowKey="_id" loading={loading} columns={columns} dataSource={data} />
}

export default UserTable
