// import React from 'react'
// import { Table, Button, Tag, Typography } from 'antd'
// import { DeleteOutlined } from '@ant-design/icons'
// import { getItemStatusTag } from '../constants'

// const { Text } = Typography

// const OrderTable = ({ items, isUpdating, onCancelItem }) => {
//   const columns = [
//     {
//       title: 'Mã ĐH',
//       dataIndex: 'orderId',
//       key: 'orderId',
//       render: (text) =>
//         text ? <span className="text-gray-500 font-mono">{text.slice(0, 8)}</span> : '',
//       width: 100,
//     },
//     {
//       title: 'Tên món ăn',
//       dataIndex: 'dish_id',
//       key: 'dish_name',
//       render: (dish_id) => (
//         <span className="font-medium text-gray-800">
//           {dish_id?.dish_name || 'Không rõ tên món'}
//         </span>
//       ),
//       sorter: (a, b) => (a.dish_id?.dish_name || '').localeCompare(b.dish_id?.dish_name || ''),
//     },
//     {
//       title: 'Đơn giá',
//       dataIndex: 'price',
//       key: 'price',
//       render: (price) => `${Number(price).toLocaleString('vi-VN')} đ`,
//       align: 'right',
//       width: 120,
//     },
//     {
//       title: 'SL',
//       dataIndex: 'quantity',
//       key: 'quantity',
//       align: 'center',
//       width: 60,
//       render: (quantity) => <span className="font-bold">{quantity}</span>,
//     },
//     {
//       title: 'Trạng thái',
//       dataIndex: 'status',
//       key: 'item_status',
//       align: 'center',
//       render: (status) => getItemStatusTag(status), // Hàm này lấy từ constants.js
//       width: 150,
//     },
//     {
//       title: 'Thành tiền',
//       key: 'subtotal',
//       align: 'right',
//       width: 140,
//       render: (_, record) => {
//         // Nếu đã hủy hoặc đã trả tiền thì gạch ngang số tiền
//         const isFinalized = record.status === 'Cancelled' || record.orderStatus === 'Paid'
//         const amount = record.subtotal || record.price * record.quantity
//         const displayAmount = isFinalized ? 0 : amount

//         return (
//           <Text strong delete={isFinalized} type={isFinalized ? 'secondary' : 'danger'}>
//             {displayAmount.toLocaleString('vi-VN')} đ
//           </Text>
//         )
//       },
//     },
//     {
//       title: 'Hành động',
//       key: 'action',
//       align: 'center',
//       width: 120,
//       render: (_, record) => {
//         // Chỉ cho phép hủy nếu món chưa được Phục vụ, chưa Hủy, chưa Trả tiền và chưa Nấu xong (tùy quy định)
//         const canCancel =
//           record.status !== 'Served' &&
//           record.status !== 'Cancelled' &&
//           record.status !== 'Paid' &&
//           record.status !== 'Ready' // Nếu bếp nấu xong rồi thì cũng ko hủy được

//         if (canCancel) {
//           return (
//             <Button
//               type="primary"
//               danger
//               icon={<DeleteOutlined />}
//               size="small"
//               loading={isUpdating}
//               onClick={() => onCancelItem(record)}
//             >
//               Hủy
//             </Button>
//           )
//         }

//         // Hiển thị trạng thái dạng text nếu không hủy được
//         if (record.status === 'Cancelled')
//           return <span className="text-red-500 text-xs">Đã Hủy</span>
//         if (record.status === 'Paid') return <span className="text-green-500 text-xs">Đã Trả</span>
//         return <span className="text-gray-400 text-xs">Không thể hủy</span>
//       },
//     },
//   ]

//   return (
//     <Table
//       columns={columns}
//       dataSource={items}
//       rowKey={(record) => record.key || record._id}
//       pagination={false}
//       scroll={{ x: 800 }}
//       className="shadow-sm rounded-lg overflow-hidden border border-gray-200"
//     />
//   )
// }

// export default OrderTable
