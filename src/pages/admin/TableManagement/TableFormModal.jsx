import { DEFAULT_FORM_VALUES } from '@/shared/constants/table'
import { Modal, Form, Input, Select, InputNumber } from 'antd'

const noEdgeSpaces = (_, value) => {
  if (value === undefined || value === null || value === '') return Promise.resolve()
  if (typeof value !== 'string') return Promise.resolve()
  if (value !== value.trim()) return Promise.reject(new Error('Không được để khoảng trắng ở đầu hoặc cuối'))
  return Promise.resolve()
}

const validateCapacity = (_, value) => {
  if (value === undefined || value === null || value === '') return Promise.resolve()
  const n = Number(value)
  if (Number.isNaN(n)) return Promise.reject(new Error('Lượng khách phải là số'))
  if (!Number.isInteger(n)) return Promise.reject(new Error('Lượng khách phải là số nguyên'))
  if (n < 0) return Promise.reject(new Error('Lượng khách không được âm'))
  return Promise.resolve()
}

const TableFormModal = ({ open, title, submitting, form, onOk, onCancel }) => {
  return (
    <Modal
      title={title}
      centered
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={DEFAULT_FORM_VALUES}>
        <Form.Item
          label="Tên bàn"
          name="table_name"
          rules={[
            { required: true, message: 'Vui lòng nhập tên bàn' },
            { validator: noEdgeSpaces },
            { min: 1, message: 'Tên ít nhất 1 ký tự' },
            { max: 100, message: 'Tên tối đa 100 ký tự' },
          ]}
        >
          <Input placeholder="Nhập tên bàn" allowClear maxLength={100} />
        </Form.Item>

        <Form.Item
          label="Lượng khách cho phép"
          name="capacity"
          rules={[
            { validator: validateCapacity },
          ]}
        >
          <InputNumber
            placeholder="Nhập lượng khách cho phép"
            style={{ width: '100%' }}
            min={0}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select
            options={[
              { value: "available", label: 'Còn trống' },
              { value: "occupied", label: 'Đã đặt' },
              { value: "reserved", label: 'Đang sử dụng' },
              { value: "maintenance", label: 'Bảo trì' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TableFormModal
