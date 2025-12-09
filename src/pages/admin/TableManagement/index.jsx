import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Breadcrumb, Form, Modal, message } from 'antd' // Thêm Modal, message
import { PlusCircleOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'
import TableTable from './TableTable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import TableFormModal from './TableFormModal'
import tableAPI from '@/apis/table/table.api'
import OrderDetailModal from './OrderDetailModal'

const tableKeys = {
  all: ['tables'],
  list: () => ['tables', 'list'],
}

const TableManagement = () => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // State modal
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // State xem đơn
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)

  // API lấy danh sách bàn (CÓ AUTO REFRESH)
  const { data: tables = [], isLoading } = useQuery({
    queryKey: tableKeys.list(),
    queryFn: async () => {
      const res = await tableAPI.getAll()
      return res.data || []
    },
    // --- SỬA Ở ĐÂY: Thêm dòng này để tự động cập nhật mỗi 5 giây ---
    refetchInterval: 5000,
    // -----------------------------------------------------------------
    onError: () => toast.error('Lỗi tải danh sách bàn!'),
  })

  // ... (Các mutation Create/Update/Delete giữ nguyên) ...
  const createMutation = useMutation({
    mutationFn: (payload) => tableAPI.create(payload),
    onSuccess: () => {
      toast.success('Thành công')
      queryClient.invalidateQueries({ queryKey: tableKeys.list() })
      closeModal()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => tableAPI.update(id, payload),
    onSuccess: () => {
      toast.success('Thành công')
      queryClient.invalidateQueries({ queryKey: tableKeys.list() })
      closeModal()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => tableAPI.delete(id),
    onSuccess: () => {
      toast.success('Thành công')
      queryClient.invalidateQueries({ queryKey: tableKeys.list() })
    },
  })

  // Các hàm xử lý (Giữ nguyên)
  const openCreate = () => {
    setEditingRow(null)
    form.resetFields()
    setIsOpenModal(true)
  }
  const openEdit = (record) => {
    setEditingRow(record)
    form.resetFields()
    form.setFieldsValue({ ...record })
    setIsOpenModal(true)
  }
  const handleRemove = (id) => {
    deleteMutation.mutate(id)
  }
  const closeModal = () => {
    setIsOpenModal(false)
    setEditingRow(null)
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingRow) updateMutation.mutate({ id: editingRow._id, payload: values })
      else createMutation.mutate(values)
    } catch {}
  }

  const handleViewOrder = (tableRecord) => {
    setSelectedTable(tableRecord)
    setIsOrderModalOpen(true)
  }

  return (
    <div className="h-full overflow-auto">
      <section className="mb-3">
        <h1 className="font-bold text-3xl mb-2">Quản lý bàn ăn</h1>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý bàn ăn' }]} />
      </section>

      <section className="flex justify-end mb-5">
        <AntButton type="primary" icon={<PlusCircleOutlined />} onClick={openCreate}>
          Thêm mới
        </AntButton>
      </section>

      <Card title="Danh sách bàn ăn" className="shadow-sm rounded-2xl">
        <TableTable
          data={tables}
          loading={isLoading}
          onEdit={openEdit}
          onRemove={handleRemove}
          deletingId={deletingId}
          onViewOrder={handleViewOrder}
        />
      </Card>

      {/* Modal Thêm/Sửa Bàn */}
      <TableFormModal
        open={isOpenModal}
        title={editingRow ? 'Cập nhật' : 'Thêm mới'}
        submitting={createMutation.isPending || updateMutation.isPending}
        form={form}
        onOk={handleOk}
        onCancel={closeModal}
      />

      {/* Modal Xem Đơn */}
      <OrderDetailModal
        open={isOrderModalOpen}
        onCancel={() => setIsOrderModalOpen(false)}
        tableId={selectedTable?._id}
        tableName={selectedTable?.table_name}
      />
    </div>
  )
}

export default TableManagement
