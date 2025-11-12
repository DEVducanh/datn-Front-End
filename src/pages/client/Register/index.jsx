import React from 'react'
import { Button, Input, Form, Typography, Divider, notification } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

import { useMutation } from '@tanstack/react-query'
import authAPI from '@/apis/auth/auth.api'
import { useNavigate } from 'react-router'

const { Title, Text, Link } = Typography

// Giả định đường dẫn logo đúng
const FLAREON_LOGO = '/public/images/Logo.png'
const GL_Logo = '/public/images/google.png'

const Register = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const registerMutation = useMutation({
    mutationFn: (payload) => authAPI.register(payload),

    onSuccess: (data) => {
      notification.success({
        message: 'Đăng ký thành công! 🎉',
        description: data.message || 'Vui lòng đăng nhập để tiếp tục.',
        placement: 'topRight',
      })

      // === SỬA LỖI TẠI ĐÂY (ĐÃ CẬP NHẬT ĐƯỜNG DẪN ĐÚNG) ===
      navigate('/flareon/login')
      // ===================================================
    },

    onError: (error) => {
      let displayMessage = 'Đăng ký thất bại. Lỗi không xác định.'
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('validation failed')) {
          displayMessage = 'Lỗi thiếu thông tin bắt buộc: Tên đăng nhập hoặc Số điện thoại.'
        } else {
          displayMessage = error.response.data.message
        }
      }

      console.error('Lỗi đăng ký:', error.response?.data)
      notification.error({
        message: 'Lỗi đăng ký',
        description: displayMessage,
        placement: 'topRight',
      })
    },
  })

  // Hàm xử lý sự kiện submit form
  const onFinish = (values) => {
    const payload = {
      username: values.username || values.name,
      email: values.email,
      password: values.password,
      phone: values.phone,
    }
    registerMutation.mutate(payload)
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white">
      <header className="w-full flex justify-between items-center p-4">
        {/* Sửa lại nút quay lại để trỏ về trang chủ /flareon */}
        <Link
          onClick={() => navigate('/flareon')}
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
            Đăng ký
          </Title>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Trường Tên */}
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập Tên của bạn!' }]}
          >
            <Input
              placeholder="Tên (Sẽ dùng làm Tên đăng nhập)"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          {/* TRƯỜNG SỐ ĐIỆN THOẠI MỚI (phone) */}
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập Số điện thoại!' },
              { pattern: /^[0-9]+$/, message: 'Số điện thoại không hợp lệ!' },
            ]}
          >
            <Input
              placeholder="Số điện thoại"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          {/* Trường Email */}
          <Form.Item
            name="email"
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

          {/* Trường Mật khẩu */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập Mật Khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Mật Khẩu"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          {/* Trường XÁC NHẬN MẬT KHẨU */}
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận Mật Khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'))
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Xác nhận Mật Khẩu"
              className="!rounded-lg !h-14 !text-lg placeholder:!text-orange-500 !border-orange-500"
            />
          </Form.Item>

          {/* Nút Đăng Ký */}
          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={registerMutation.isPending}
              className="!h-14 !rounded-lg !text-xl !font-bold !bg-orange-500 hover:!bg-orange-600 !border-none"
            >
              Đăng Ký
            </Button>
          </Form.Item>
        </Form>

        <Divider plain className="!my-8">
          <Text type="secondary" className="!text-gray-500">
            or
          </Text>
        </Divider>

        {/* Đăng nhập / Đăng nhập với Google */}
        <div className="space-y-4">
          <Button
            block
            size="large"
            // Sửa lại đường dẫn cho nút Đăng nhập
            onClick={() => navigate('/flareon/login')}
            className="!h-14 !rounded-lg !text-lg !font-semibold !bg-gray-100 !border-none hover:!bg-gray-200"
          >
            Đăng nhập
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

        <div className="text-center text-xs text-gray-500 mb-20 px-4 mt-10">
          <Text type="secondary" className="!text-gray-500 text-sm">
            Bằng cách đăng ký, bạn đồng ý với
            <Link href="/terms" className="!font-bold !text-gray-800 hover:!text-orange-500">
              {' '}
              Điều khoản dịch vụ{' '}
            </Link>
            và
            <br />
            <Link href="/privacy" className="!font-bold !text-gray-800 hover:!text-orange-500">
              {' '}
              Chính sách bảo mật
            </Link>
          </Text>
        </div>
      </div>
    </div>
  )
}

export default Register
