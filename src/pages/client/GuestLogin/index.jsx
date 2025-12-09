import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Card, message, Spin, Alert } from 'antd'
import { UserOutlined, PhoneOutlined, EnvironmentOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import http from '@/apis/http'

const GuestLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  // Lấy ID từ URL
  const tableId = searchParams.get('table_id')

  // --- LOGIC MỚI: GỌI API LẤY TẤT CẢ BÀN VÀ TỰ LỌC ---
  const { data: foundTable, isLoading, isError } = useQuery({
    queryKey: ['guest-all-tables', tableId],
    queryFn: async () => {
      if (!tableId) throw new Error("No ID");
      try {
        // Gọi API lấy danh sách tất cả bàn (API này chắc chắn chạy được)
        const res = await http.get(`/tables`)

        // Lấy mảng dữ liệu (tùy backend trả về dạng nào)
        const listTables = res.data?.data || res.data || res || [];

        if (!Array.isArray(listTables)) {
          console.error("API không trả về mảng:", res);
          return null;
        }

        // Tìm bàn có ID trùng khớp
        const target = listTables.find(t => t._id === tableId);

        if (!target) throw new Error("Không tìm thấy bàn trong danh sách");

        return target;
      } catch (err) {
        console.error("Lỗi tìm bàn:", err);
        throw err;
      }
    },
    enabled: !!tableId,
    retry: 1
  })

  // --- XỬ LÝ HIỂN THỊ ---
  const getTableDisplay = () => {
    if (!tableId) return { text: 'Vui lòng quét mã QR', color: 'red', valid: false };
    if (isLoading) return { text: 'Đang xác thực bàn...', color: 'blue', valid: false };
    if (isError || !foundTable) return { text: 'Bàn không tồn tại!', color: 'red', valid: false };

    // Lấy tên bàn
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-t-4 border-t-orange-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-orange-600 m-0">Flareon</h1>
          <p className="text-gray-400 text-sm mt-1">Hệ thống gọi món tại bàn</p>
        </div>

        <Form name="guest_login" onFinish={onFinish} layout="vertical" size="large">

          {/* --- KHUNG HIỂN THỊ TÊN BÀN --- */}
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