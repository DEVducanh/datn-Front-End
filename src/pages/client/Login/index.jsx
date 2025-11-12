import React from 'react'
import { Button, Input, Form, Typography, Divider, notification } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

import { useMutation } from '@tanstack/react-query'
import authAPI from '@/apis/auth/auth.api'
// 👈 1. IMPORT HOOK useAuth
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router'

const { Title, Text, Link } = Typography

const FLAREON_LOGO = '/public/images/Logo.png'
const GL_Logo = '/public/images/google.png'

const Login = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // 👈 2. SỬ DỤNG useAuth ĐỂ LẤY HÀM login()
  const { login } = useAuth()

  // --- LOGIC GỌI API ĐĂNG NHẬP ---
  const loginMutation = useMutation({
    mutationFn: (payload) => authAPI.login(payload),

    onSuccess: (data) => {
      // Giả định Backend trả về: { token: '...', user: { _id: '...', ... } }
      const token = data.token || data.accessToken
      const userObject = data.user

      if (token && userObject && userObject._id) {
        // 💥 3. BỎ QUA VIỆC LƯU LOCAL STORAGE TRỰC TIẾP 💥
        // Thay vào đó, gọi hàm login() từ Context.
        // Hàm này sẽ tự động lưu Local Storage VÀ cập nhật trạng thái isLoggedIn = true.
        login(token, userObject)

        notification.success({
          message: 'Đăng nhập thành công! 🎉',
          description: 'Chào mừng trở lại! Đang chuyển hướng...',
          placement: 'topRight',
        })

        // Chuyển hướng về trang chủ
        navigate('/')
      } else {
        notification.error({
          message: 'Lỗi Dữ liệu',
          description: 'Phản hồi từ máy chủ không chứa token hoặc ID người dùng hợp lệ.',
          placement: 'topRight',
        })
      }
    },
    // TRONG component Login, thay thế hàm onError này:
    onError: (error) => {
      // Log toàn bộ lỗi để kiểm tra cấu trúc
      console.error('LỖI ĐĂNG NHẬP (CHI TIẾT):', error)
      // Log nội dung phản hồi lỗi từ server
      console.error('SERVER RESPONSE DATA:', error.response?.data) // <--- Lỗi chi tiết nằm ở đây

      // Lấy thông báo lỗi từ server (thường là trường 'message' hoặc 'error')
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'

      // Mã lỗi HTTP
      const serverStatus = error.response?.status

      // Thiết lập thông báo hiển thị cho người dùng
      const message = serverMessage

      notification.error({
        message: `Lỗi Đăng nhập (${serverStatus || 'Lỗi Mạng/Client'})`,
        description: message,
        placement: 'topRight',
      })
    },
  })

  // 3. Hàm xử lý sự kiện submit form
  const onFinish = (values) => {
    const payload = {
      email: values.email,
      password: values.password,
    }
    loginMutation.mutate(payload)
  }

  return (
    // ... (Phần JSX giữ nguyên)
    <div className="flex flex-col items-center justify-start min-h-screen bg-white">
      <header className="w-full flex justify-between items-center p-4">
        <Link
          onClick={() => navigate('/')}
          className="flex items-center !text-lg !text-orange-500 !hover:text-orange-500 font-bold cursor-pointer"
        >
          <ArrowLeftOutlined className="mr-1" />
          Quay lại
        </Link>
      </header>

      <div className="w-full max-w-sm px-4 mt-8">
        <div className="text-center mb-10">
          <img src={FLAREON_LOGO} alt="Logo" className="mx-auto h-20 mb-6" />
          <Title level={4} className="!text-xl !font-semibold !text-orange-500">
            Đăng nhập
          </Title>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email" // Trường Email
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
            ]}
          >
            <Input
              placeholder="Email"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          <Form.Item
            name="password" // Trường Mật khẩu
            rules={[{ required: true, message: 'Vui lòng nhập Mật Khẩu!' }]}
            hasFeedback
          >
            <Input.Password // Dùng Input.Password
              placeholder="Mật Khẩu"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          {/* Nút Đăng nhập */}
          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loginMutation.isPending} // Hiển thị loading
              className="!h-14 !rounded-lg !text-xl !font-bold !bg-orange-500 hover:!bg-orange-600 !border-none"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider plain className="!my-8">
          <Text type="secondary" className="!text-gray-500">
            or
          </Text>
        </Divider>

        {/* Đăng ký / Đăng nhập với Google */}
        <div className="space-y-4">
          <Button
            block
            size="large"
            onClick={() => navigate('/register')} // Chuyển hướng đến trang Đăng ký
            className="!h-14 !rounded-lg !text-lg !font-semibold !bg-gray-100 !border-none hover:!bg-gray-200"
          >
            Đăng ký
          </Button>

          {/* Continue with Google */}
          <Button
            block
            size="large"
            icon={<img src={GL_Logo} alt="Google" className="h-6 mr-2" />}
            className="!h-14 !rounded-lg !text-lg !font-semibold !bg-gray-100 !border-none hover:!bg-gray-200"
          >
            Continue with Google
          </Button>
        </div>

        <Button
          block
          size="large"
          icon={<img src={GL_Logo} alt="Google" className="h-6 mr-2" />}
          className="!h-14 !rounded-lg !text-lg !font-semibold !bg-gray-100 hover:!bg-gray-200"
        >
          Continue with Google
        </Button>
      </div>

      {/* Chính sách */}
      <div className="text-center text-xs text-gray-500 mb-20 px-4 mt-10">
        <Text type="secondary" className="!text-gray-500 text-sm">
          Bằng cách tiếp tục, bạn đồng ý với
          <Link href="/terms" className="!font-bold !text-gray-800 hover:!text-orange-500">
            {' '}
            Điều khoản sử dụng{' '}
          </Link>
          và
          <Link href="/privacy" className="!font-bold !text-gray-800 hover:!text-orange-500">
            {' '}
            Chính sách bảo mật
          </Link>
        </Text>
      </div>
    </div>
  )
}

export default Login
