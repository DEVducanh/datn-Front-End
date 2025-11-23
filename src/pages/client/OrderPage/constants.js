import React from 'react'
import { Tag } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const STATUS_CONFIG = {
  Pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang chờ' },
  Processing: { color: 'blue', icon: <SyncOutlined spin />, text: 'Đang nấu' },
  Ready: { color: 'cyan', icon: <CheckCircleOutlined />, text: 'Đã xong' },
  Served: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã phục vụ' },
  Cancelled: { color: 'red', icon: <CloseCircleOutlined />, text: 'Đã hủy' },
  Paid: { color: 'magenta', icon: <DollarOutlined />, text: 'Đã thanh toán' },
  'Pending Payment': { color: 'purple', icon: <ClockCircleOutlined />, text: 'Chờ thanh toán' },
}

export const getItemStatusTag = (status) => {
  const config = STATUS_CONFIG[status]
  if (!config) return <Tag>{status}</Tag>
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  )
}
