// src/pages/admin/ReviewManagement/index.jsx
import React, { useState } from 'react'
import { Card, Breadcrumb, Table, Tag, Button, Modal, Form, Input, Tooltip, Popconfirm } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'

import feedbackAPI from '@/apis/feedback/feedback.api'

// ====== CONSTANTS ======
const { TextArea } = Input

const STATUS_MAP = {
  Pending: { color: 'gold', text: 'Chờ duyệt' },
  Resolved: { color: 'green', text: 'Đã duyệt' },
  Rejected: { color: 'red', text: 'Đã từ chối' },
}

const feedbackKeys = {
  all: ['feedbacks'],
  list: () => ['feedbacks', 'list'],
}

const ReviewManagement = () => {
  const queryClient = useQueryClient()
  const [replyForm] = Form.useForm()

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)

  // ====== QUERY: GET FEEDBACK LIST ======
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: feedbackKeys.list(),
    queryFn: async () => {
      const res = await feedbackAPI.getAll()
      return res.data
    },
    onError: () => toast.error('Không thể tải danh sách đánh giá!'),
  })

  // ====== MUTATION: UPDATE STATUS ======
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => feedbackAPI.updateStatus(id, { status }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Cập nhật trạng thái thành công!')
        queryClient.invalidateQueries(feedbackKeys.all)
      } else {
        toast.error(res.message || 'Cập nhật thất bại.')
      }
    },
    onError: () => toast.error('Cập nhật trạng thái thất bại!'),
  })

  // ====== MUTATION: REPLY FEEDBACK ======
  const replyMutation = useMutation({
    mutationFn: ({ feedbackId, payload }) => feedbackAPI.createResponse(feedbackId, payload),

    onSuccess: (res, variables) => {
      toast.success('Phản hồi thành công!')
      closeReplyModal()

      if (variables.currentStatus === 'Pending') {
        updateStatusMutation.mutate({
          id: variables.feedbackId,
          status: 'Resolved',
        })
      } else {
        queryClient.invalidateQueries(feedbackKeys.all)
      }
    },

    onError: () => toast.error('Phản hồi thất bại!'),
  })

  // ====== MUTATION: DELETE FEEDBACK ======
  const deleteMutation = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Xóa đánh giá thành công!')
        queryClient.invalidateQueries(feedbackKeys.all)
      } else {
        toast.error(res.message || 'Không thể xóa đánh giá này.')
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Xóa đánh giá thất bại!'
      toast.error(msg)
    },
  })

  // ====== MODAL HANDLERS ======
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

  // ====== ACTION HANDLERS ======
  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status })
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id)
  }

  const handleReplySubmit = () => {
    replyForm.validateFields().then((values) => {
      replyMutation.mutate({
        feedbackId: selectedFeedback._id,
        payload: values,
        currentStatus: selectedFeedback.status,
      })
    })
  }

  // ====== TABLE COLUMNS ======
  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'user_id',
      key: 'user',
      render: (user) => user?.username || user?.email || 'N/A',
    },
    {
      title: 'Món ăn',
      dataIndex: 'dish_id',
      key: 'dish',
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
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const item = STATUS_MAP[status] || { color: 'default', text: status }
        return <Tag color={item.color}>{item.text}</Tag>
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

          {record.status === 'Pending' && (
            <>
              <Tooltip title="Duyệt">
                <Button
                  icon={<CheckCircleOutlined />}
                  style={{ color: 'green', borderColor: 'green' }}
                  onClick={() => handleUpdateStatus(record._id, 'Resolved')}
                />
              </Tooltip>

              <Tooltip title="Từ chối">
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

          {record.status === 'Resolved' && (
            <>
              <Tooltip title="Phản hồi thêm">
                <Button
                  icon={<MessageOutlined />}
                  type="primary"
                  onClick={() => showReplyModal(record)}
                />
              </Tooltip>

              <Popconfirm title="Xóa đánh giá này?" onConfirm={() => handleDelete(record._id)}>
                <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending} />
              </Popconfirm>
            </>
          )}

          {record.status === 'Rejected' && (
            <Popconfirm title="Xóa đánh giá này?" onConfirm={() => handleDelete(record._id)}>
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
          dataSource={feedbackData || []}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* ===== Modal: Chi tiết ===== */}
      <Modal
        title="Chi tiết đánh giá"
        open={isDetailsModalOpen}
        onCancel={closeDetailsModal}
        footer={<Button onClick={closeDetailsModal}>Đóng</Button>}
      >
        {selectedFeedback && (
          <div className="space-y-2">
            <p>
              <strong>Khách hàng:</strong>{' '}
              {selectedFeedback.user_id?.username || selectedFeedback.user_id?.email || 'N/A'}
            </p>

            <p>
              <strong>Món ăn:</strong> {selectedFeedback.dish_id?.dish_name}
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

            <hr />

            <p>
              <strong>Nội dung:</strong>
            </p>
            <p>{selectedFeedback.content}</p>
          </div>
        )}
      </Modal>

      {/* ===== Modal: Phản hồi ===== */}
      <Modal
        title={`Phản hồi đánh giá của: ${
          selectedFeedback?.user_id?.username || selectedFeedback?.user_id?.email
        }`}
        open={isReplyModalOpen}
        onCancel={closeReplyModal}
        onOk={handleReplySubmit}
        okText="Gửi phản hồi"
        confirmLoading={replyMutation.isPending}
      >
        <Form form={replyForm} layout="vertical">
          <p>
            <strong>Nội dung gốc:</strong> {selectedFeedback?.content}
          </p>

          <Form.Item
            name="content"
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
