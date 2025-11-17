import React, { useEffect } from 'react'
import { Modal, Form, Select, message } from 'antd'

const OrderModalEdit = ({ open, order, onCancel, onSubmit }) => {
  const [form] = Form.useForm() // Khởi tạo form instance
  const [messageApi, contextHolder] = message.useMessage()

  // Định nghĩa các lựa chọn trạng thái
  const STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ]

  // Thiết lập giá trị ban đầu (chỉ khi modal mở hoặc order thay đổi)
  useEffect(() => {
    if (order && open) { // Kiểm tra cả 'open' để tránh lỗi
      form.setFieldsValue({
        status: order.status || 'Pending', // Đảm bảo có giá trị mặc định
      })
    } else {
      form.resetFields() // Reset form khi modal đóng
    }
  }, [order, open, form])

  const handleOk = () => {
    // Kích hoạt form submit. Logic onFinish sẽ xử lý gọi API.
    form.submit()
  }

  // Hàm xử lý khi Form submit thành công
  const onFinish = (values) => {
    // Gọi hàm onSubmit (được truyền từ OrderManagement) để gọi API
    onSubmit(values)

    // Sau khi gọi API thành công (do onSubmit gọi API và refresh), 
    // chúng ta sẽ đóng modal
    onCancel()
    messageApi.success('Đang gửi yêu cầu cập nhật...') // Thông báo tạm thời
  }


  return (
    <>
      {contextHolder}
      <Modal
        title={`Chỉnh sửa đơn #${order?._id?.slice(-6) || ''}`}
        open={open}
        onOk={handleOk} // Gọi hàm handleOk để kích hoạt form.submit()
        onCancel={onCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        {/* ✅ KHẮC PHỤC LỖI CHÍNH: TRUYỀN form instance vào Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish} // Xử lý submit
        // Không dùng initialValues ở đây vì đã dùng setFieldsValue trong useEffect
        >
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select
              placeholder="Chọn trạng thái..."
              options={STATUS_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default OrderModalEdit