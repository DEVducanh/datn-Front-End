import React from 'react'
import { Form, Input, Button, Card, message, Spin } from 'antd'
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import http from '@/apis/http'

const GuestLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const tableId = searchParams.get('table_id')

  const { data: foundTable, isLoading, isError } = useQuery({
    queryKey: ['guest-all-tables', tableId],
    queryFn: async () => {
      if (!tableId) throw new Error("No ID");
      try {
        const res = await http.get(`/tables`)
        const listTables = res.data?.data || res.data || res || [];

        if (!Array.isArray(listTables)) {
          return null;
        }

        const target = listTables.find(t => t._id === tableId);
        if (!target) throw new Error("Không tìm thấy bàn");

        return target;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!tableId,
    retry: 1
  })

  const getTableDisplay = () => {
    if (!tableId) return { text: 'Vui lòng quét mã QR', color: 'red', valid: false };
    if (isLoading) return { text: 'Đang xác thực bàn...', color: 'blue', valid: false };
    if (isError || !foundTable) return { text: 'Bàn không tồn tại!', color: 'red', valid: false };

    const name = foundTable.table_name || foundTable.name || 'Bàn ???';
    return { text: name, color: 'green', valid: true };
  }

  const { text: tableNameDisplay, color: statusColor, valid: isValidTable } = getTableDisplay();

  const onFinish = async (values) => {
    if (!isValidTable) {
      message.error('Bàn lỗi, không thể vào!');
      return;
    }
    try {
      const guestData = {
        name: values.name,
        phone: values.phone,
        role: 'guest',
        tableId: tableId,
        tableName: tableNameDisplay
      }

      const mockToken = 'guest_token_' + Date.now();
      login(mockToken, guestData, false);
      localStorage.setItem('currentTableId', tableId);

      message.success(`Xin chào ${values.name}!`);
      navigate('/flareon')
    } catch (error) {
      message.error('Lỗi đăng nhập');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">

      {/* --- NÚT ĐĂNG NHẬP / ĐĂNG KÝ (FIX LỖI RESET) --- */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => {
            // 1. Lấy ID bàn hiện tại ra biến tạm
            const currentTableId = tableId || localStorage.getItem('currentTableId');

            // 2. CỰC KỲ QUAN TRỌNG: Xóa sạch toàn bộ LocalStorage
            // Dùng lệnh clear() để đảm bảo không sót bất kỳ token nào
            localStorage.clear();

            // 3. Lưu lại mỗi cái Table ID thôi (để sau này còn biết bàn nào)
            if (currentTableId) {
              localStorage.setItem('currentTableId', currentTableId);
            }

            // 4. Chuyển hướng cứng sang trang Login
            window.location.href = `/login?table_id=${currentTableId || ''}`;
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-full shadow-sm hover:shadow-md hover:bg-orange-50 transition-all border border-orange-100 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>

          <span className="text-sm">Đăng nhập / Đăng ký</span>
        </button>
      </div>
      {/* --------------------------------------------------- */}

      <Card className="w-full max-w-md shadow-xl rounded-2xl border-t-4 border-t-orange-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-orange-600 m-0">Flareon</h1>
          <p className="text-gray-400 text-sm mt-1">Hệ thống gọi món tại bàn</p>
        </div>

        <Form name="guest_login" onFinish={onFinish} layout="vertical" size="large">

          <div className={`p-4 rounded-xl mb-6 text-center border-2 ${statusColor === 'green' ? 'bg-green-50 border-green-200' :
            statusColor === 'red' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 font-bold">Vị trí ngồi</p>
            <div className={`text-xl font-bold flex items-center justify-center gap-2 ${statusColor === 'green' ? 'text-green-700' : statusColor === 'red' ? 'text-red-600' : 'text-blue-600'
              }`}>
              {isLoading ? <Spin size="small" /> : <EnvironmentOutlined />}
              {tableNameDisplay}
            </div>
          </div>

          <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input prefix={<UserOutlined />} placeholder="Tên của bạn" />
          </Form.Item>

          <Form.Item name="phone" rules={[{ required: true, message: 'Nhập SĐT' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary" htmlType="submit" block
              className="bg-orange-600 hover:bg-orange-500 h-12 text-lg font-bold rounded-xl border-none"
              disabled={!isValidTable || isLoading}
            >
              VÀO GỌI MÓN
            </Button>
          </Form.Item>
        </Form>

        {!isValidTable && !isLoading && tableId && (
          <div className="text-center mt-2">
            <span className="text-xs text-red-400">ID: {tableId} (Không tìm thấy trong hệ thống)</span>
          </div>
        )}
      </Card>
    </div>
  )
}

export default GuestLogin