import React, { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query' // MỚI
import { notification } from 'antd' // MỚI
import http from '@/apis/http' // MỚI (Để kiểm tra)
import tableAPI from '@/apis/table/table.api' // MỚI (Để cập nhật)

import Categories from '@/layouts/DefaultLayout/components/Categories'
import Features from '@/layouts/DefaultLayout/components/Features'
import Hero from '@/layouts/DefaultLayout/components/Hero'
import Products from '@/layouts/DefaultLayout/components/Products'
import { useLocation, useNavigate } from 'react-router'

const Home = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // === 1. (MỚI) ĐỊNH NGHĨA MUTATION ĐỂ CẬP NHẬT BÀN ===
  const updateTableStatusMutation = useMutation({
    // Dùng hàm 'update' từ file admin của bạn
    mutationFn: ({ id, payload }) => tableAPI.update(id, payload),
    onSuccess: () => {
      console.log('Cập nhật trạng thái bàn thành "occupied" thành công!')
      notification.success({
        message: 'Chào mừng!',
        description: 'Đã nhận bàn. Bạn có thể bắt đầu gọi món.',
        placement: 'topRight',
      })
    },
    onError: (error) => {
      console.error('Lỗi khi cập nhật trạng thái bàn:', error)
      notification.error({
        message: 'Không thể nhận bàn',
        description:
          'Bàn này có thể đang được bảo trì hoặc đã có người. Vui lòng liên hệ nhân viên.',
        placement: 'topRight',
      })
    },
  })

  // === 2. (CẬP NHẬT) USE-EFFECT ĐỂ THÊM LOGIC MỚI ===
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tableIdFromUrl = searchParams.get('table_id')

    if (tableIdFromUrl) {
      console.log('Đã phát hiện và lưu table_id:', tableIdFromUrl)
      localStorage.setItem('currentTableId', tableIdFromUrl)

      // === 3. (MỚI) LOGIC KIỂM TRA VÀ CẬP NHẬT BÀN ===
      const checkAndOccupyTable = async (id) => {
        try {
          // A. Gọi API để xem bàn này có "empty" không
          // (Tôi giả định API này là GET /tables/:id)
          const res = await http.get(`/tables/${id}`)
          const tableData = res.data // Lấy toàn bộ dữ liệu bàn

          if (tableData && tableData.status === 'empty') {
            // B. Nếu "empty", gọi mutation để đổi thành "occupied"
            console.log('Bàn đang trống. Cập nhật thành "occupied"...')

            // Tạo payload đầy đủ để update (giống như file admin)
            // Chúng ta gửi lại toàn bộ data cũ, chỉ đổi 'status'
            const updatePayload = {
              ...tableData,
              status: 'occupied', // Đổi trạng thái
            }
            // Xóa _id, vì payload thường không chứa _id
            delete updatePayload._id

            updateTableStatusMutation.mutate({
              id: id,
              payload: updatePayload,
            })
          } else {
            // Bàn không trống (occupied, reserved, maintenance), không làm gì cả
            console.log(`Bàn ở trạng thái: ${tableData.status}. Không cập nhật.`)
            // Bạn có thể thêm thông báo nếu bàn đang 'maintenance' (bảo trì)
            if (tableData.status === 'maintenance') {
              notification.warn({
                message: 'Bàn đang bảo trì',
                description: 'Bàn này hiện không thể sử dụng. Vui lòng chọn bàn khác.',
                placement: 'topRight',
              })
            }
          }
        } catch (error) {
          console.error('Không thể lấy thông tin bàn:', error)
          notification.error({
            message: 'Lỗi quét bàn',
            description: 'Không thể xác thực thông tin bàn. Vui lòng thử lại hoặc báo nhân viên.',
            placement: 'topRight',
          })
        }
      }

      // Gọi hàm kiểm tra
      checkAndOccupyTable(tableIdFromUrl)

      // 4. Xóa ID khỏi URL (giữ nguyên)
      searchParams.delete('table_id')
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true }
      )
    }
    // Thêm mutation vào dependency array của useEffect
  }, [location, navigate, updateTableStatusMutation])

  // (Phần return ... <Hero /> ... giữ nguyên)
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <Products />
    </>
  )
}

export default Home
