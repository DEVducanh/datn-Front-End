import React, { useState } from 'react'

import {
  Card,
  Breadcrumb,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tooltip,
} from 'antd'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toast } from 'react-toastify'

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'

// 1. Import API feedback chúng ta vừa tạo

import feedbackAPI from '@/apis/feedback/feedback.api'

const { TextArea } = Input

// Định nghĩa màu cho các trạng thái

const STATUS_MAP = {
  Pending: { color: 'gold', text: 'Chờ duyệt' },

  Resolved: { color: 'green', text: 'Đã duyệt' },

  Rejected: { color: 'red', text: 'Đã từ chối' },
}

// Key cho react-query

const feedbackKeys = {
  all: ['feedbacks'],

  list: (params) => ['feedbacks', 'list', params],
}

const ReviewManagement = () => {
  const queryClient = useQueryClient()

  const [replyForm] = Form.useForm()

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const [selectedFeedback, setSelectedFeedback] = useState(null)

  // === 2. GỌI API GET /feedback ===

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: feedbackKeys.list(), // Key cho query

    queryFn: async () => {
      const res = await feedbackAPI.getAll()

      // API của bạn (controller) trả về { message, data }

      return res.data
    },

    onError: () => toast.error('Không thể tải danh sách đánh giá!'),
  })

  // === 3. MUTATION CẬP NHẬT TRẠNG THÁI (Duyệt / Từ chối) ===

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => feedbackAPI.updateStatus(id, { status }),

    onSuccess: (res) => {
      // API (controller) trả về { success, message, result }

      if (res.success) {
        toast.success('Cập nhật trạng thái thành công!')

        queryClient.invalidateQueries(feedbackKeys.all) // Tải lại bảng
      } else {
        toast.error(res.message || 'Cập nhật thất bại.')
      }
    },

    onError: () => toast.error('Cập nhật trạng thái thất bại!'),
  })

  // === 4. MUTATION PHẢN HỒI BÌNH LUẬN ===

  const replyMutation = useMutation({
    mutationFn: ({ feedbackId, payload }) => feedbackAPI.createResponse(feedbackId, payload),

    onSuccess: () => {
      toast.success('Phản hồi thành công!')

      // Tự động duyệt (Resolved) khi phản hồi

      queryClient.invalidateQueries(feedbackKeys.all)

      closeReplyModal()
    },

    onError: () => toast.error('Phản hồi thất bại!'),
  })

  // === 5. MUTATION XÓA BÌNH LUẬN ===

  const deleteMutation = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),

    onSuccess: (res) => {
      // API (service) trả về { success, message }

      if (res.success) {
        toast.success(res.message || 'Xóa đánh giá thành công!')

        queryClient.invalidateQueries(feedbackKeys.all) // Tải lại bảng
      } else {
        // Ví dụ: Lỗi "Feedback chưa được xử lý, không thể xóa"

        toast.error(res.message || 'Không thể xóa đánh giá này.')
      }
    },

    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Xóa đánh giá thất bại!'

      toast.error(errMsg)
    },
  })

  // --- Hàm xử lý modal ---

  const showReplyModal = (record) => {
    setSelectedFeedback(record)

    replyForm.resetFields()

    setIsReplyModalOpen(true)
  }

  const closeReplyModal = () => setIsReplyModalOpen(false)

  const showDetailsModal = (record) => {
    setSelectedFeedback(record)

    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => setIsDetailsModalOpen(false)

  // --- Hàm xử lý các hành động ---

  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status })
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleReplySubmit = () => {
    replyForm

      .validateFields()

      .then((values) => {
        // 'values' sẽ là { content: '...' }

        replyMutation.mutate({
          feedbackId: selectedFeedback._id,

          payload: values,
        })
      })

      .catch((info) => {
        console.log('Validate Failed:', info)
      })
  }

  // === 6. ĐỊNH NGHĨA CÁC CỘT CHO BẢNG ===

  const columns = [
    {
      title: 'Khách hàng',

      dataIndex: 'user_id',

      key: 'user',

      // Nhờ sửa ở Bước 1, 'user' giờ là object

      render: (user) => user?.username || 'N/A',
    },

    {
      title: 'Món ăn',

      dataIndex: 'dish_id',

      key: 'dish',

      // Nhờ sửa ở Bước 1, 'dish' giờ là object

      render: (dish) => dish?.dish_name || '(Món đã bị xóa)',
    },

    {
      title: 'Đánh giá',

      dataIndex: 'rating',

      key: 'rating',

      render: (rating) => <span>{rating} ⭐</span>,
    },

    {
      title: 'Nội dung',

      dataIndex: 'content',

      key: 'content',

      ellipsis: true, // Rút gọn nội dung nếu quá dài
    },

    {
      title: 'Trạng thái',

      dataIndex: 'status',

      key: 'status',

      render: (status) => {
        const statusInfo = STATUS_MAP[status] || { color: 'default', text: status }

        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },

    {
      title: 'Thao tác',

      key: 'action',

      align: 'center',

      width: 180,

      render: (_, record) => (
        <div className="flex justify-center gap-2">
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => showDetailsModal(record)} />
          </Tooltip>

          {/* Nếu đang "Chờ duyệt" */}

          {record.status === 'Pending' && (
            <>
              <Tooltip title="Duyệt (Approve)">
                <Button
                  icon={<CheckCircleOutlined />}
                  style={{ color: 'green', borderColor: 'green' }}
                  onClick={() => handleUpdateStatus(record._id, 'Resolved')}
                />
              </Tooltip>

              <Tooltip title="Từ chối (Reject)">
                <Button
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => handleUpdateStatus(record._id, 'Rejected')}
                />
              </Tooltip>

              <Tooltip title="Phản hồi & Duyệt">
                <Button
                  icon={<MessageOutlined />}
                  type="primary"
                  onClick={() => showReplyModal(record)}
                />
              </Tooltip>
            </>
          )}

          {/* Nếu đã "Duyệt" */}

          {record.status === 'Resolved' && (
            <>
              <Tooltip title="Phản hồi thêm">
                <Button
                  icon={<MessageOutlined />}
                  type="primary"
                  onClick={() => showReplyModal(record)}
                />
              </Tooltip>

              <Popconfirm
                title="Xóa đánh giá này?"
                description="Hành động này không thể hoàn tác."
                onConfirm={() => handleDelete(record._id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
              </Popconfirm>
            </>
          )}

          {/* Nếu đã "Từ chối" */}

          {record.status === 'Rejected' && (
            <Popconfirm
              title="Xóa đánh giá này?"
              description="Hành động này không thể hoàn tác."
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <section className="mb-3">
        <h1 className="font-bold text-3xl mb-2">Quản lý đánh giá</h1>

        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý đánh giá' }]} />
      </section>

      <Card title="Danh sách đánh giá" className="shadow-sm rounded-2xl">
        <Table
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={feedbackData || []} // Dùng dữ liệu từ API
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal để xem chi tiết bình luận */}

      <Modal
        title="Chi tiết đánh giá"
        open={isDetailsModalOpen}
        onCancel={closeDetailsModal}
        footer={[
          <Button key="close" onClick={closeDetailsModal}>
            Đóng
          </Button>,
        ]}
      >
        {selectedFeedback && (
          <div>
            {/* API getDetailFeedbackSV mới populate dish_name, nên check lại */}

            <p>
              <strong>Khách hàng:</strong> {selectedFeedback.user_id?.username}
            </p>

            <p>
              <strong>Món ăn:</strong> {selectedFeedback.dish_id?.dish_name || '(Không rõ)'}
            </p>

            <p>
              <strong>Đánh giá:</strong> {selectedFeedback.rating} ⭐
            </p>

            <p>
              <strong>Ngày:</strong> {new Date(selectedFeedback.created_at).toLocaleString('vi-VN')}
            </p>

            <p>
              <strong>Trạng thái:</strong> {STATUS_MAP[selectedFeedback.status]?.text}
            </p>

            <hr className="my-2" />

            <p>
              <strong>Nội dung:</strong>
            </p>

            <p>{selectedFeedback.content}</p>
          </div>
        )}
      </Modal>

      {/* Modal để phản hồi */}

      <Modal
        title={`Phản hồi đánh giá của: ${selectedFeedback?.user_id?.username}`}
        open={isReplyModalOpen}
        onCancel={closeReplyModal}
        onOk={handleReplySubmit}
        confirmLoading={replyMutation.isPending}
        okText="Gửi phản hồi"
        cancelText="Hủy"
      >
        <Form form={replyForm} layout="vertical">
          <p>
            <strong>Nội dung gốc:</strong> {selectedFeedback?.content}
          </p>

          <Form.Item
            name="content" // Phải khớp với 'content' trong createFeedbackResponseController
            label="Nội dung phản hồi của Admin:"
            rules={[{ required: true, message: 'Vui lòng nhập phản hồi!' }]}
          >
            <TextArea rows={4} placeholder="Viết phản hồi của bạn..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReviewManagement
