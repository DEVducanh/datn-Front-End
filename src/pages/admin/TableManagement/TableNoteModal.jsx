import React, { useEffect } from 'react'
import { Modal, Form, Input, Button } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

const { TextArea } = Input

const TableNoteModal = ({ open, onCancel, onSave, tableData, submitting }) => {
  const [form] = Form.useForm()

  // Mỗi khi mở modal hoặc đổi bàn, điền ghi chú cũ vào form
  useEffect(() => {
    if (open && tableData) {
      form.setFieldsValue({
        note: tableData.note || ''
      })
    } else {
      form.resetFields()
    }
  }, [open, tableData, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave(tableData._id, values.note)
    } catch (e) {
      // Lỗi validate
    }
  }

  return (
    <Modal
      title={
        <span className="flex items-center gap-2 text-blue-600">
          <FileTextOutlined />
          Ghi chú cho: <b>{tableData?.table_name}</b>
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Đóng
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={submitting} 
          onClick={handleOk}
          className="bg-blue-600"
        >
          Lưu Ghi Chú
        </Button>,
      ]}
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="note" 
          label="Tình hình bàn / Lưu ý đặc biệt"
          help="Ví dụ: Khách đang đợi bạn, Khách dị ứng hải sản, v.v..."
        >
          <TextArea 
            rows={6} 
            placeholder="Nhập ghi chú tại đây..." 
            style={{ fontSize: '16px' }}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TableNoteModal