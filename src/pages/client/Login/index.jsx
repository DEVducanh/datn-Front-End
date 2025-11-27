import React from 'react'
import { Button, Input, Form, Typography, Divider, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import authAPI from '@/apis/auth/auth.api'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router'
import { useMessage } from '@/contexts/MessageProvider'

const { Title, Text, Link } = Typography

const FLAREON_LOGO = '/public/images/Logo.png'
const GL_Logo = '/public/images/google.png'

const Login = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const message = useMessage()
  const { login } = useAuth()

  const loginMutation = useMutation({
    mutationFn: (payload) => authAPI.login(payload),
    onSuccess: (data) => {
      const token = data.token || data.accessToken
      const userObject = data.user

      if (token && userObject && userObject._id) {
        login(token, userObject)

        message.success('Đăng nhập thành công!')
        navigate('/')
      } else {
        message.error('Lỗi Dữ liệu')
      }
    },

    onError: (error) => {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'

      const serverStatus = error.response?.status

      const message = serverMessage

      message.error(`Lỗi Đăng nhập (${serverStatus || 'Lỗi Mạng/Client'})`)
    },
  })


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
