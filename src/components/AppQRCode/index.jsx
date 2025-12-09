import React from 'react'
import { QRCode, Typography, Tooltip, Alert } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

const AppQRCode = ({ tableId, tableName }) => {
  const baseUrl = window.location.origin

  if (!tableId) {
    return <Alert type="error" message="Lỗi: Thiếu ID bàn" showIcon />
  }

  // --- SỬA Ở ĐÂY: ĐỔI ĐƯỜNG DẪN VỀ TRANG ĐĂNG NHẬP ---
  // Thay vì /flareon, hãy dẫn khách vào /guest-login để họ nhập tên
  const qrCodeUrl = `${baseUrl}/guest-login?table_id=${tableId}`

  const downloadQRCode = () => {
    const canvas = document.getElementById(`qr-code-${tableId}`)?.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      // Tên file khi tải xuống (Dùng tên bàn cho dễ nhớ)
      link.download = `QR-${tableName || 'Ban-' + tableId.slice(-4)}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div style={{ textAlign: 'center' }} id={`qr-code-${tableId}`}>
      {/* Hiển thị QR */}
      <QRCode value={qrCodeUrl} size={180} errorLevel="M" icon="/images/Logo.png" iconSize={30} />

      {/* Hiển thị tên bàn bên dưới QR (Cho đẹp) */}
      <Title level={5} style={{ marginTop: 10, marginBottom: 0 }}>
        {tableName || 'Bàn ' + tableId.slice(-4)}
      </Title>

      {/* Link text để kiểm tra */}
      <div style={{ marginBottom: 8, wordBreak: 'break-all' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>
          {qrCodeUrl}
        </Text>
      </div>

      <Tooltip title="Tải xuống để in">
        <a
          onClick={downloadQRCode}
          style={{ fontSize: 14, color: '#fa8c16', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <DownloadOutlined /> Tải xuống QR
        </a>
      </Tooltip>
    </div>
  )
}

export default AppQRCode