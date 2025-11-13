import React, { useEffect, useState } from 'react';
import { Modal, Table, Spin, Typography, Tag, Divider, notification, Button, Select, Space } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import http from '@/apis/http';

// URL cơ sở cho Order Item 
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api-datn-orderfood-backend-2.onrender.com';
const ORDER_ITEM_BASE_URL = `${BASE_URL}/order-item/order`;

const orderItemAPI = {
  getOrderItemDetails: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${ORDER_ITEM_BASE_URL}/${orderId}`;

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return response.data || {};
    } catch (error) {
      console.error('[API ERROR] Failed to fetch order items:', error.response || error.message);
      return {};
    }
  },

  // Hàm cập nhật trạng thái món ăn (Dùng cho việc HỦY)
  updateItemStatus: async (itemId, newStatus) => {
    const token = localStorage.getItem('token');
    const url = `${BASE_URL}/order-item/${itemId}/status`;

    const response = await axios.patch(url, { status: newStatus }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.data;
  },
};

const { Text } = Typography;

// Map màu cho trạng thái Order Item
const getItemStatusTag = (status) => {
  switch (status) {
    case 'Pending':
      return <Tag color="orange" icon={<ClockCircleOutlined />}>{status}</Tag>;
    case 'Processing':
      return <Tag color="blue" icon={<ClockCircleOutlined />}>{status}</Tag>;
    case 'Ready':
      return <Tag color="geekblue" icon={<CheckCircleOutlined />}>{status}</Tag>;
    case 'Served':
      return <Tag color="green" icon={<CheckCircleOutlined />}>{status}</Tag>;
    case 'Cancelled':
      return <Tag color="red" icon={<CloseCircleOutlined />}>{status}</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const OrderDetailModal = ({ order, visible, onClose }) => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (visible && order && order._id) {
      fetchOrderItems(order._id);
    } else {
      setOrderItems([]);
    }
  }, [visible, order]);

  const fetchOrderItems = async (orderId) => {
    setLoading(true);
    try {
      const res = await orderItemAPI.getOrderItemDetails(orderId);

      let items = [];
      if (Array.isArray(res.Orderitems)) {
        items = res.Orderitems;
      } else if (Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res)) {
        items = res;
      }

      setOrderItems(items);

    } catch (error) {
      notification.error({
        message: 'Lỗi tải chi tiết',
        description: 'Kiểm tra API hoặc xác thực token.',
      });
    } finally {
      setLoading(false);
    }
  };

  // HÀM XỬ LÝ HỦY MÓN ĂN (ĐÃ SỬA LỖI LOGIC)
  const handleCancelItem = async (itemId, currentStatus) => {

    // KIỂM TRA CHẶN CÁC TRẠNG THÁI KHÔNG THỂ HỦY
    if (currentStatus === 'Served' || currentStatus === 'Cancelled') {
      notification.warning({
        message: 'Không thể hủy',
        description: `Món ăn này đã ở trạng thái ${currentStatus}.`,
      });
      return;
    }

    setIsUpdating(true);
    try {
      // GỌI API HỦY
      await orderItemAPI.updateItemStatus(itemId, 'Cancelled');

      // CẬP NHẬT STATE VÀ BÁO THÀNH CÔNG
      setOrderItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId ? { ...item, status: 'Cancelled' } : item
        )
      );

      notification.success({
        message: 'Hủy thành công',
        description: 'Món ăn đã được hủy khỏi đơn hàng.',
      });
    } catch (error) {
      // BÁO LỖI THẬT
      notification.error({
        message: 'Hủy thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi hủy món.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Tên món ăn',
      dataIndex: 'dish_name',
      key: 'dish_name',
      render: (_, record) => {
        return record.dish_id?.dish_name || 'Không rõ tên món';
      },
    },
    {
      title: 'Giá/Đơn vị',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${Number(price).toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Trạng thái món',
      dataIndex: 'status',
      key: 'item_status',
      render: (status) => getItemStatusTag(status),
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (_, record) => (
        <Text strong>
          {(record.subtotal || (record.price * record.quantity)).toLocaleString('vi-VN')} VNĐ
        </Text>
      ),
    },
    // ⭐ CỘT HÀNH ĐỘNG ĐÃ SỬA ĐỔI
    {
      title: 'Hành động',
      key: 'cancel_action',
      render: (_, record) => {
        // Case 1: Đã hủy (Cancelled)
        if (record.status === 'Cancelled') {
          return (
            <Tag color="green">
              Hủy thành công
            </Tag>
          );
        }

        // Case 2: Đã phục vụ (Served)
        if (record.status === 'Served') {
          return (
            <Tag color="default">
              Không thể hủy
            </Tag>
          );
        }

        // Case 3: Các trạng thái có thể hủy (Pending, Processing, Ready)
        return (
          <Space>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={isUpdating}
              onClick={() => handleCancelItem(record._id, record.status)}
            >
              Hủy món
            </Button>
          </Space>
        );
      }
    }
  ];

  if (!order) return null;

  return (
    <Modal
      title={`Chi tiết Đơn hàng: ${order._id ? order._id.slice(0, 8) : 'N/A'}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
    >
      {loading || isUpdating ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>{isUpdating ? 'Đang xử lý hủy món...' : 'Đang tải chi tiết món ăn...'}</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            <Text strong>Trạng thái đơn:</Text>{' '}
            {/* Sử dụng trạng thái của Order chính */}
            <Tag color={getItemStatusTag(order.status).props.color}>
              {order.status ? order.status.toUpperCase() : 'N/A'}
            </Tag>
            <Text strong style={{ marginLeft: '20px' }}>Tổng tiền Order:</Text>{' '}
            <Text strong type="success">
              {order.total_price ? Number(order.total_price).toLocaleString('vi-VN') : '0'} VNĐ
            </Text>
          </div>

          <Divider orientation="left">Danh sách món ăn</Divider>
          {orderItems.length > 0 ? (
            <Table
              columns={columns}
              dataSource={orderItems}
              rowKey={(record, index) => record._id || index}
              pagination={false}
              bordered
              size="small"
            />
          ) : (
            <p style={{ textAlign: 'center', padding: '20px' }}>Không có món ăn nào trong đơn hàng này hoặc đơn hàng đang rỗng.</p>
          )}
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              Tổng tiền từ Items: {totalAmount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </div>
        </>
      )}
    </Modal>
  );
};

export default OrderDetailModal;