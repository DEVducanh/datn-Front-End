import React from 'react'
import { QRCode, Typography, Tooltip } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

const AppQRCode = ({ tableId, tableName }) => {
  const baseUrl = 'http://26.136.157.188:5173' // Bỏ dấu / ở đây

  const qrCodeUrl = `${baseUrl}/flareon?table_id=${tableId}` // Thêm / ở đây

  console.log(`URL cho ${tableName}: ${qrCodeUrl}`)
  // ===================================

  // 3. Hàm để tải QR code
  const downloadQRCode = () => {
    const canvas = document.getElementById(`qr-code-${tableId}`)?.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      a.href = url
      a.download = `QR-Ban-${tableName}.png`
      a.click()
    }
  }

  return (
    <div style={{ textAlign: 'center' }} id={`qr-code-${tableId}`}>
      <QRCode value={qrCodeUrl} size={150} errorLevel="H" />

      <Title level={5} style={{ marginTop: 8, marginBottom: 0 }}>
        {tableName}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Quét QR Code để gọi món
      </Text>
      <br />
      <Tooltip title="Tải xuống">
        <a onClick={downloadQRCode} style={{ fontSize: 14, color: '#1890ff' }}>
          <DownloadOutlined /> Tải xuống
        </a>
      </Tooltip>
    </div>
  )
}

export default AppQRCode
