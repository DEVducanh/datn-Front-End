import React from 'react'
import { Typography, Button, Avatar } from 'antd' // Import component Antd
import { Zap, Leaf, ChefHat, Smile } from 'lucide-react' // Import icons
import { useNavigate } from 'react-router-dom' // Import hook để chuyển trang

const { Title, Text, Paragraph } = Typography

// Ảnh banner, bạn có thể thay bằng ảnh của quán
const BANNER_IMAGE_URL =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1280'
// Ảnh "Câu chuyện"
const STORY_IMAGE_URL =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

const AboutPage = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-white">
      {/* === 1. PHẦN HERO/BANNER === */}
      <div className="relative bg-orange-50 py-20 md:py-32 overflow-hidden">
        {/* Ảnh nền mờ */}
        <img
          src={BANNER_IMAGE_URL}
          alt="Nhà bếp Flareon"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Title level={1} className="!text-4xl md:!text-5xl !font-bold !text-gray-900">
            Về Chúng Tôi
          </Title>
          <Paragraph className="text-lg text-gray-700 max-w-2xl mx-auto mt-4">
            Mang đến hương vị đích thực và trải nghiệm gọi món công nghệ tiện lợi nhất cho thực
            khách.
          </Paragraph>
        </div>
      </div>

      {/* === 2. PHẦN CÂU CHUYỆN (2 CỘT) === */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Cột ảnh */}
          <div>
            <img
              src={STORY_IMAGE_URL}
              alt="Không gian nhà hàng Flareon"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>
          {/* Cột chữ */}
          <div>
            <span className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full mb-4 font-semibold text-sm">
              CÂU CHUYỆN CỦA FLAREON
            </span>
            <Title level={2} className="!text-3xl !font-bold !text-gray-900 !mb-6">
              Từ đam mê ẩm thực đến giải pháp QR Order
            </Title>
            <Paragraph className="text-gray-600 text-base leading-relaxed mb-4">
              Flareon được sinh ra từ tình yêu với những món ăn ngon và mong muốn giúp mọi người
              thưởng thức chúng một cách dễ dàng nhất. Chúng tôi nhận thấy việc gọi món tại bàn đôi
              khi còn nhiều bất tiện, chờ đợi.
            </Paragraph>
            <Paragraph className="text-gray-600 text-base leading-relaxed">
              Vì vậy, chúng tôi đã tạo ra giải pháp QR Order này - một trải nghiệm mượt mà, nhanh
              chóng, giúp bạn toàn quyền quyết định món ăn của mình và tập trung vào điều quan trọng
              nhất: thưởng thức bữa ăn cùng bạn bè và người thân.
            </Paragraph>
          </div>
        </div>
      </div>

      {/* === 3. PHẦN GIÁ TRỊ CỐT LÕI (4 CỘT) === */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Title level={2} className="!text-3xl !font-bold !text-gray-900">
              Giá trị cốt lõi
            </Title>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Giá trị 1: Tươi */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Leaf className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <Title level={4} className="!text-lg !font-semibold !text-gray-800 !mb-2">
                Nguyên liệu tươi
              </Title>
              <Text className="text-gray-600">
                Chỉ sử dụng nguyên liệu sạch, đảm bảo an toàn vệ sinh.
              </Text>
            </div>
            {/* Giá trị 2: Nhanh */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Zap className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <Title level={4} className="!text-lg !font-semibold !text-gray-800 !mb-2">
                Gọi món tức thì
              </Title>
              <Text className="text-gray-600">Quét mã QR và gọi món ngay, không cần chờ đợi.</Text>
            </div>
            {/* Giá trị 3: Ngon */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <ChefHat className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <Title level={4} className="!text-lg !font-semibold !text-gray-800 !mb-2">
                Hương vị đích thực
              </Title>
              <Text className="text-gray-600">
                Công thức được trau chuốt bởi các đầu bếp chuyên nghiệp.
              </Text>
            </div>
            {/* Giá trị 4: Vui vẻ */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Smile className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <Title level={4} className="!text-lg !font-semibold !text-gray-800 !mb-2">
                Dịch vụ tận tâm
              </Title>
              <Text className="text-gray-600">
                Chúng tôi luôn lắng nghe để phục vụ bạn tốt hơn.
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* === 4. PHẦN ĐỘI NGŨ (TÙY CHỌN) === */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Title level={2} className="!text-3xl !font-bold !text-gray-900">
              Gặp gỡ đội ngũ
            </Title>
          </div>
          {/* Thay ảnh và tên của team bạn vào đây */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-8 md:gap-12">
            <div className="text-center">
              <Avatar size={96} src="https://i.pravatar.cc/150?u=phuonganh" />
              <Title level={4} className="!mt-4 !mb-1 !text-lg !font-semibold">
                Quỳnh Anh
              </Title>
            </div>
            <div className="text-center">
              <Avatar size={96} src="https://i.pravatar.cc/150?u=ducanh" />
              <Title level={4} className="!mt-4 !mb-1 !text-lg !font-semibold">
                Đức Anh
              </Title>
            </div>
            <div className="text-center">
              <Avatar size={96} src="https://i.pravatar.cc/150?u=ducanh" />
              <Title level={4} className="!mt-4 !mb-1 !text-lg !font-semibold">
                Văn Tiến
              </Title>
            </div>
            <div className="text-center">
              <Avatar size={96} src="https://i.pravatar.cc/150?u=ducanh" />
              <Title level={4} className="!mt-4 !mb-1 !text-lg !font-semibold">
                Quỳnh (chạy thận)
              </Title>
            </div>
            {/* Thêm thành viên khác nếu muốn */}
          </div>
        </div>
      </div>

      {/* === 5. PHẦN KÊU GỌI HÀNH ĐỘNG (CTA) === */}
      {/* === 5. PHẦN KÊU GỌI HÀNH ĐỘNG (CTA) - Đã sửa === */}
      <div className="bg-gray-50">
        {' '}
        {/* 1. Đổi nền sang xám nhạt cho hài hòa */}
        <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:px-6 lg:px-8">
          {' '}
          {/* 2. Thu hẹp chiều rộng 1 chút */}
          <Title level={2} className="!text-3xl !font-bold !text-gray-900 !mb-4">
            {' '}
            {/* 3. Đổi màu chữ */}
            Sẵn sàng trải nghiệm Flareon?
          </Title>
          <Text className="text-lg text-gray-600 mb-8 block">
            {' '}
            {/* 4. Thêm 1 câu mô tả nhỏ */}
            Khám phá thực đơn đa dạng và đặt món ngay tại bàn.
          </Text>
          <Button
            type="primary"
            size="large"
            className="!h-14 !rounded-lg !text-xl !font-bold !bg-orange-500 hover:!bg-orange-600 !border-none" // Style nút cam
            onClick={() => navigate('/flareon/category')}
          >
            Xem thực đơn ngay
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
