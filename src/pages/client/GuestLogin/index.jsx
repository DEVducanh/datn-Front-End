import React, { useEffect } from 'react'
import { Button, Input, Form, Typography, message } from 'antd'
import { UserOutlined, PhoneOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router'
import authAPI from '@/apis/auth/auth.api'
import { useAuth } from '@/contexts/AuthContext' // <--- 1. Import cái này

const { Title, Text } = Typography
const FLAREON_LOGO = '/public/images/Logo.png'

const GuestLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  // 2. Lấy hàm login từ Context ra để cập nhật trạng thái ứng dụng
  const { login } = useAuth()

  const getTableIdFromUrl = () => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get('table_id')
  }

  const tableId = getTableIdFromUrl()

  useEffect(() => {
    if (tableId) {
      form.setFieldsValue({ table_id: tableId })
    }
  }, [tableId, form])

  const loginMutation = useMutation({
    mutationFn: (payload) => authAPI.guestLogin(payload),

    onSuccess: (response) => {
      console.log('Guest API Response:', response)

      const newToken = response.token || response.accessToken
      const userData = response.data || response.user

      if (newToken && userData) {
        // --- SỬA ĐOẠN NÀY ---
        // Thay vì chỉ set localStorage thủ công, hãy dùng hàm login của Context
        // Hàm này sẽ vừa lưu localStorage, vừa cập nhật State cho cả trang web biết

        login(newToken, userData)

        // Lưu thêm user_info (nếu hàm login của bạn không tự lưu cái này)
        localStorage.setItem('user_info', JSON.stringify(userData))

        message.success(
          `Cập nhật thông tin thành công! Xin chào ${userData.username || userData.name}`
        )

        navigate('/')
      } else {
        message.error('Lỗi: Không nhận được Token hoặc Dữ liệu từ Server')
      }
    },
    onError: (error) => {
      console.error('Login Error:', error)
      const msg = error.response?.data?.message || 'Cập nhật thông tin thất bại!'
      message.error(msg)
    },
  })

  const onFinish = (values) => {
    loginMutation.mutate({
      name: values.name,
      phone: values.phone,
      table_id: values.table_id,
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <img src={FLAREON_LOGO} alt="Logo" className="mx-auto h-20 mb-4 object-contain" />
          <Title level={3} className="!text-orange-500 !m-0">
            Xin chào!
          </Title>
          <Text type="secondary">Nhập thông tin để bắt đầu gọi món</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên của bạn!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Tên của bạn"
              className="!rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="Số điện thoại"
              className="!rounded-lg"
              type="tel"
            />
          </Form.Item>

          <Form.Item
            name="table_id"
            rules={[{ required: true, message: 'Không tìm thấy mã bàn!' }]}
            hidden={!!tableId}
          >
            <Input
              prefix={<QrcodeOutlined className="text-gray-400" />}
              placeholder="Mã bàn"
              className="!rounded-lg bg-gray-50"
              disabled={!!tableId}
            />
          </Form.Item>

          {tableId && (
            <div className="text-center mb-6 p-2 bg-orange-50 rounded-lg border border-orange-100 text-orange-600 font-medium">
              Bạn đang ngồi tại: <span className="font-bold">{tableId}</span>
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
      <p className="mt-8 text-gray-400 text-xs">Flareon Ordering System</p>
    </div>
  )
}

export default GuestLogin
