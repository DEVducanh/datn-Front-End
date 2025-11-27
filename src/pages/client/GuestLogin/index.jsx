import React, { useEffect } from 'react'
import { Button, Input, Form, Typography, message, Spin } from 'antd'
import { UserOutlined, PhoneOutlined, QrcodeOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import authAPI from '@/apis/auth/auth.api'
import http from '@/apis/http' // Dùng để gọi API lấy tên bàn
import { useAuth } from '@/contexts/AuthContext'

const { Title, Text } = Typography
const FLAREON_LOGO = '/public/images/Logo.png'

const GuestLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const { login } = useAuth()

  // 1. Lấy table_id từ URL
  const searchParams = new URLSearchParams(location.search)
  const tableId = searchParams.get('table_id')

  // 2. Tự động điền Table ID vào form
  useEffect(() => {
    if (tableId) {
      form.setFieldsValue({ table_id: tableId })
    }
  }, [tableId, form])

  // 3. GỌI API LẤY TÊN BÀN (SỬA THEO SWAGGER)
  const { data: tableName, isLoading: loadingTable } = useQuery({
    queryKey: ['tableInfo', tableId],
    queryFn: async () => {
      if (!tableId) return null
      try {
        // Gọi API chi tiết bàn
        const res = await http.get(`/tables/${tableId}`)

        // Xử lý dữ liệu trả về tùy theo Backend
        // Swagger của bạn cho thấy field là 'table_name'
        if (res?.data) return res.data.table_name
        if (res?.table_name) return res.table_name

        return `Bàn ${tableId.slice(-4)}` // Fallback nếu không lấy được
      } catch (err) {
        console.error('Lỗi lấy tên bàn (Có thể do chưa Public API):', err)
        return `Bàn (Mã: ${tableId.slice(-4)})`
      }
    },
    enabled: !!tableId, // Chỉ chạy khi có ID
    retry: 1, // Chỉ thử lại 1 lần nếu lỗi
  })

  // 4. API Login
  const loginMutation = useMutation({
    mutationFn: (payload) => authAPI.guestLogin(payload),
    onSuccess: (response) => {
      console.log("Login Success:", response)
      const newToken = response.token || response.accessToken
      const userData = response.data || response.user

      if (newToken && userData) {
        login(newToken, userData)
        localStorage.setItem('user_info', JSON.stringify(userData))
        message.success(`Xin chào ${userData.username || userData.name}!`)
        navigate('/')
      } else {
        message.error("Lỗi: Server không trả về Token")
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại!'
      message.error(msg)
    },
  })

  const onFinish = (values) => {
    loginMutation.mutate({
      name: values.name,
      phone: values.phone,
      table_id: tableId
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-gray-100">

        <div className="text-center mb-8">
          <img src={FLAREON_LOGO} alt="Logo" className="mx-auto h-20 mb-4 object-contain" />
          <Title level={3} className="!text-orange-500 !m-0 font-bold">Xin chào!</Title>
          <Text type="secondary" className="text-gray-500">Nhập thông tin để bắt đầu gọi món</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">

          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Tên của bạn"
              className="!rounded-lg !h-12"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="Số điện thoại"
              className="!rounded-lg !h-12"
              type="tel"
            />
          </Form.Item>

          {/* HIỂN THỊ TÊN BÀN TỪ API */}
          {tableId && (
            <div className="text-center mb-6 p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-center gap-2 text-orange-700">
              <EnvironmentOutlined />
              {loadingTable ? (
                <Spin size="small" />
              ) : (
                <span className="font-semibold text-lg">
                  Bạn đang ngồi tại: <span className="text-orange-600 font-bold uppercase">{tableName}</span>
                </span>
              )}
            </div>
          )}

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loginMutation.isPending}
              className="!h-12 !rounded-lg !text-lg !font-bold !bg-orange-500 hover:!bg-orange-600 !border-none shadow-md shadow-orange-200"
            >
              Bắt đầu gọi món
            </Button>
          </Form.Item>
        </Form>
      </div>

      <p className="mt-8 text-gray-400 text-xs font-medium">Flareon Ordering System © 2025</p>
    </div>
  )
}

export default GuestLogin