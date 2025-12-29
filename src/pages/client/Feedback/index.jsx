import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Rate, Input, Button, List, Avatar, message, Spin, Typography } from 'antd'
import { useQuery, useMutation } from '@tanstack/react-query'
import http from '@/apis/http'
import feedbackAPI from '@/apis/feedback/feedback.api'

const { TextArea } = Input
const { Title } = Typography

const FeedbackPage = () => {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [reviews, setReviews] = useState({})

    // Lấy thông tin User hiện tại để gửi kèm đánh giá
    const [userId, setUserId] = useState(null)
    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user') || localStorage.getItem('user_info')
            if (userStr) {
                const u = JSON.parse(userStr)
                setUserId(u._id || u.id)
            }
        } catch (e) { }
    }, [])

    const { data: orderItems = [], isLoading } = useQuery({
        queryKey: ['feedback-order-items', orderId],
        queryFn: async () => {
            const res = await http.get(`/order-item/order/${orderId}`)
            if (Array.isArray(res?.Orderitems)) return res.Orderitems
            if (Array.isArray(res?.data?.Orderitems)) return res.data.Orderitems
            return []
        },
        enabled: !!orderId
    })

    const handleRateChange = (dishId, value) => {
        setReviews(prev => ({ ...prev, [dishId]: { ...prev[dishId], rate: value } }))
    }

    const handleCommentChange = (dishId, value) => {
        setReviews(prev => ({ ...prev, [dishId]: { ...prev[dishId], comment: value } }))
    }

    const submitMutation = useMutation({
        mutationFn: async () => {
            const promises = orderItems.map(item => {
                const dishId = item.dish_id?._id || item.dish_id
                const userReview = reviews[dishId] || { rate: 5, comment: '' }

                const payload = {
                    dish_id: dishId,
                    rating: userReview.rate,
                    content: userReview.comment,
                    order_id: orderId,
                    user_id: userId // <--- QUAN TRỌNG: Gửi kèm ID người dùng
                }
                return feedbackAPI.create(payload)
            })
            await Promise.all(promises)
        },
        onSuccess: () => {
            message.success('Cảm ơn bạn đã đánh giá!')
            navigate('/flareon')
        },
        onError: (err) => {
            message.error('Có lỗi xảy ra khi gửi đánh giá.')
        }
    })

    const handleSubmit = () => submitMutation.mutate()

    if (isLoading) return <div className="flex justify-center p-10"><Spin /></div>

    return (
        <div className="max-w-2xl mx-auto p-4 pt-10">
            <div className="text-center mb-8">
                <Title level={2} className="text-orange-600 !mb-0">Đánh giá bữa ăn</Title>
                <p className="text-gray-500 mt-2">Ý kiến của bạn giúp chúng tôi phục vụ tốt hơn!</p>
            </div>

            <List
                itemLayout="vertical"
                dataSource={orderItems}
                renderItem={(item) => {
                    const dish = item.dish_id || {}
                    const currentReview = reviews[dish._id] || { rate: 5, comment: '' }

                    return (
                        <Card className="mb-6 shadow-sm border-gray-200 hover:shadow-md transition-all">
                            <div className="flex gap-4 sm:flex-row flex-col">
                                <Avatar src={dish.image} shape="square" size={100} className="rounded-lg object-cover mx-auto sm:mx-0" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-xl mb-2 text-gray-800">{dish.dish_name}</h4>
                                    <div className="mb-3">
                                        <Rate className="text-2xl" value={currentReview.rate} onChange={(val) => handleRateChange(dish._id, val)} />
                                        <span className="ml-3 text-gray-400 font-medium">{currentReview.rate ? `${currentReview.rate} Sao` : 'Chạm để chấm điểm'}</span>
                                    </div>
                                    <TextArea placeholder="Món ăn này thế nào?" rows={3} className="bg-gray-50 border-gray-200" value={currentReview.comment} onChange={(e) => handleCommentChange(dish._id, e.target.value)} />
                                </div>
                            </div>
                        </Card>
                    )
                }}
            />

            <div className="flex justify-end gap-3 mt-8 pb-10">
                <Button size="large" onClick={() => navigate('/flareon')}>Để sau</Button>
                <Button type="primary" size="large" className="bg-orange-600 border-none px-8" onClick={handleSubmit} loading={submitMutation.isPending}>Gửi đánh giá</Button>
            </div>
        </div>
    )
}

export default FeedbackPage