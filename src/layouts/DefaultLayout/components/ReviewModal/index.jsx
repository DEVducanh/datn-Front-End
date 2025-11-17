// src/components/ReviewModal/index.jsx
import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/apis/http'
import { Modal, Input, Button } from 'antd'
import { useMessage } from '@/contexts/MessageProvider'

const ReviewModal = ({ isOpen, onClose, selectedDish }) => {
  const queryClient = useQueryClient()
  const message = useMessage()
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Lấy thông tin user khi component được tạo
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        setCurrentUser(JSON.parse(userString))
      }
    } catch (e) {
      console.error('Không thể parse user data từ localStorage', e)
    }
  }, [])

  // Reset form mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setNewRating(5)
      setNewComment('')
    }
  }, [isOpen])

  // Mutation để gửi feedback
  const createFeedbackMutation = useMutation({
    mutationFn: (payload) => http.post('/feedback', payload),
    onSuccess: (res) => {
      if (res && (res.success || res.newFeedBack)) {
        message.success('Cảm ơn bạn đã gửi đánh giá!')
        if (selectedDish?.dishId) {
          // Làm mới danh sách bình luận ở trang chi tiết món ăn
          queryClient.invalidateQueries({ queryKey: ['feedbacks', selectedDish.dishId] })
        }
        onClose() // Đóng modal
      } else {
        message.error(`Lỗi: ${res?.message || 'Không thể gửi đánh giá.'}`)
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      message.error(errMsg)
    },
  })

  // Hàm submit form
  const handleSubmitFeedback = (e) => {
    e.preventDefault()
    if (!currentUser || !selectedDish) {
      message.error('Lỗi: Thông tin không hợp lệ.')
      return
    }
    if (newComment.trim() === '') {
      message.error('Vui lòng nhập nội dung bình luận.')
      return
    }

    const feedbackType = 'Dish' // Luôn gửi type "Dish"

    const payload = {
      user_id: currentUser._id,
      order_id: selectedDish.orderId,
      dish_id: selectedDish.dishId,
      type: feedbackType,
      rating: newRating,
      content: newComment.trim(),
    }

    createFeedbackMutation.mutate(payload)
  }

  // Không render gì nếu không có món ăn được chọn
  if (!selectedDish) {
    return null
  }

  return (
    <Modal
      title={`Đánh giá món: ${selectedDish?.dishName || ''}`}
      open={isOpen}
      onCancel={onClose}
      footer={null} // Tắt footer mặc định
    >
      <form onSubmit={handleSubmitFeedback} className="mt-6">
        {/* Star Rating */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Xếp hạng:</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setNewRating(star)}
                className={`text-3xl cursor-pointer ${
                  star <= newRating ? 'text-yellow-400' : 'text-gray-300'
                } hover:scale-110 transition-transform`}
                aria-label={`${star} sao`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="mb-4">
          <label htmlFor="commentText" className="block font-medium mb-1">
            Nội dung:
          </label>
          <Input.TextArea
            id="commentText"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder="Bạn thấy món ăn này thế nào?..."
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="primary"
          htmlType="submit"
          className="w-full !bg-orange-500 !border-orange-500"
          loading={createFeedbackMutation.isLoading}
        >
          {createFeedbackMutation.isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </form>
    </Modal>
  )
}

export default ReviewModal
