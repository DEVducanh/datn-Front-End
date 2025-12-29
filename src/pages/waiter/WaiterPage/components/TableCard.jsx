import React, { useState } from 'react'
import { Card, Badge, Button, Tooltip, Modal, message, Typography } from 'antd'
import {
  UserOutlined,
  ClearOutlined,
  SwapOutlined,
  FileSearchOutlined,
  ExclamationCircleOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'

const { Text } = Typography

const TableCard = ({ table, activeOrder, onClick, onMoveTable, onUpdateStatus }) => {
  const queryClient = useQueryClient()

  // --- STATE MODAL DỌN BÀN NHANH (RESET) ---
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // 1. API lấy chi tiết món (để hiện số lượng món đã xong)
  const { data: items = [] } = useQuery({
    queryKey: ['waiter-card-items', activeOrder?._id],
    queryFn: async () => {
      if (!activeOrder) return []
      const res = await http.get(`/order-item/order/${activeOrder._id}`)
      if (Array.isArray(res?.Orderitems)) return res.Orderitems
      if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
      if (Array.isArray(res?.data)) return res.data
      return []
    },
    enabled: !!activeOrder,
  })

  // --- HÀM DỌN BÀN NHANH (RESET) ---
  const handleOpenResetModal = (e) => {
    e.stopPropagation()
    setIsResetModalOpen(true)
  }

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true)

      // --- SỬA QUAN TRỌNG: Gửi status 'empty' (Theo đúng enum.ts của Backend) ---
      // URL: /tables/{id}/status
      // Body: { status: 'empty' }
      await http.patch(`/tables/${table._id}/status`, { status: 'empty' })
      // -----------------------------------------------------------------------

      message.success(`Đã dọn bàn ${table.table_name} thành công`)
      queryClient.invalidateQueries(['waiter-tables'])
      queryClient.invalidateQueries(['waiter-active-orders'])
      setIsResetModalOpen(false)
    } catch (err) {
      console.error(err)
      // Hiển thị lỗi chi tiết từ server nếu có
      const msg = err.response?.data?.message || 'Lỗi khi dọn bàn'
      message.error(msg)
    } finally {
      setIsResetting(false)
    }
  }

  // --- HÀM CHUYỂN BÀN ---
  const handleMoveClick = (e) => {
    e.stopPropagation()
    if (onMoveTable) onMoveTable(table, activeOrder)
  }

  // --- LOGIC HIỂN THỊ GIAO DIỆN ---
  const readyCount = items.filter((i) => i.status === 'Ready' || i.status === 'Served').length

  // Kiểm tra trạng thái dựa trên enum: 'occupied'
  const isOccupied = table.status === 'occupied' || !!activeOrder

  // Xử lý màu sắc thẻ dựa trên trạng thái
  let cardClass = 'h-full shadow-sm hover:shadow-md transition-all cursor-pointer border-t-4 relative'
  let statusText = ''
  let statusIcon = null
  let statusColorClass = ''

  // So sánh với các giá trị trong enum.ts (maintenance, reserved, occupied...)
  if (table.status === 'maintenance') {
    cardClass += ' border-t-gray-500 bg-gray-200 opacity-70'
    statusText = 'Bảo trì'
    statusColorClass = 'text-gray-600 font-bold'
  } else if (table.status === 'reserved') {
    cardClass += ' border-t-orange-400 bg-orange-50'
    statusText = 'Đang sử dụng'
    statusColorClass = 'text-orange-600 font-bold'
  } else if (!isOccupied) {
    // Trạng thái 'empty' sẽ rơi vào đây
    cardClass += ' border-t-gray-300 bg-white opacity-90'
    statusText = 'Trống'
    statusColorClass = 'text-gray-400'
  } else if (readyCount > 0) {
    cardClass += ' border-t-cyan-500 bg-cyan-50'
    statusText = `${readyCount} món xong!`
    statusIcon = <div className="animate-bounce">🔔</div>
    statusColorClass = 'text-cyan-600 font-bold'
  } else if (items.length > 0) {
    cardClass += ' border-t-green-500 bg-green-50'
    statusText = 'Đang phục vụ'
    statusIcon = <FileSearchOutlined />
    statusColorClass = 'text-green-600 font-medium'
  } else {
    cardClass += ' border-t-purple-400 bg-purple-50'
    statusText = 'Khách mới'
    statusIcon = <UserOutlined />
    statusColorClass = 'text-purple-600'
  }

  return (
    <>
      <Card
        className={cardClass}
        bodyStyle={{
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onClick={() => isOccupied && onClick(table, activeOrder)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-700 m-0">{table.table_name}</h3>
            <p className="text-gray-500 text-xs m-0">{table.capacity} ghế</p>
          </div>

          {/* Badge hiển thị số món đã xong */}
          {isOccupied ? (
            <Badge count={readyCount} showZero={false}>
              <div className={`p-2 rounded-full ${readyCount > 0 ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <UserOutlined className="text-lg" />
              </div>
            </Badge>
          ) : (
            <div className="p-2 rounded-full bg-gray-100 text-gray-300 border border-dashed border-gray-300">
              <UserOutlined className="text-lg" />
            </div>
          )}
        </div>

        {/* --- FOOTER CARD: TRẠNG THÁI & NÚT BẤM --- */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <div className={`flex items-center gap-1 text-xs ${statusColorClass}`}>
            {statusIcon} <span>{statusText}</span>
          </div>

          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>

            {/* 1. NÚT ĐỔI TRẠNG THÁI THỦ CÔNG (LUÔN HIỆN) */}
            <Tooltip title="Đổi trạng thái">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdateStatus(table)
                }}
                className="flex items-center justify-center text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
              />
            </Tooltip>

            {/* 2. CÁC NÚT THAO TÁC KHI CÓ KHÁCH */}
            {isOccupied && (
              <>
                <Tooltip title="Chuyển bàn">
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<SwapOutlined />}
                    onClick={handleMoveClick}
                    className="flex items-center justify-center border-blue-400 text-blue-500"
                  />
                </Tooltip>

                <Tooltip title="Dọn bàn / Reset">
                  <Button
                    size="small"
                    danger
                    icon={<ClearOutlined />}
                    onClick={handleOpenResetModal}
                    className="flex items-center justify-center"
                  />
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* MODAL XÁC NHẬN DỌN BÀN */}
      <Modal
        title={<div className="flex items-center gap-2 text-red-600"><ExclamationCircleOutlined /> Xác nhận dọn bàn?</div>}
        open={isResetModalOpen}
        onCancel={(e) => { e.stopPropagation(); setIsResetModalOpen(false) }}
        footer={[
          <Button key="back" onClick={(e) => { e.stopPropagation(); setIsResetModalOpen(false) }}>Hủy bỏ</Button>,
          <Button key="submit" type="primary" danger loading={isResetting} onClick={(e) => { e.stopPropagation(); handleConfirmReset() }}>Xác nhận Dọn ngay</Button>,
        ]}
        width={400}
        centered
        wrapProps={{ onClick: (e) => e.stopPropagation() }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <p className="font-bold text-lg text-gray-800 mb-2">{table.table_name}</p>
          <p>Bạn có chắc chắn muốn đưa bàn này về trạng thái <strong>TRỐNG (Sẵn sàng)</strong> không?</p>
          <div className="bg-red-50 p-3 rounded-md mt-3 border border-red-100">
            <Text type="danger" className="text-xs">*Lưu ý: Chỉ thực hiện khi khách đã thanh toán xong và rời đi.</Text>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TableCard