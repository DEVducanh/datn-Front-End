import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Breadcrumb, Form } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import AntButton from '@/components/AntButton'
import categoryAPI from '@/apis/category/category.api' // API bạn vừa cung cấp
import CategoryTable from './CategoryTable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CategoryFormModal from './CategoryFormModal'

const categoryKeys = {
  all: ['categories'],
  list: () => ['categories', 'list'],
  detail: (id) => ['categories', 'detail', id],
}

const CategoryManagement = () => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // GET LIST
  const { data: categories = [], isLoading } = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await categoryAPI.getAll()
      // Xử lý trường hợp data trả về có thể bọc trong .data hoặc trả về trực tiếp
      return res.data?.data || res.data || res || []
    },
    onError: () => toast.error('Không thể tải danh mục, vui lòng thử lại!'),
  })

  // CREATE
  const createMutation = useMutation({
    mutationFn: (payload) => categoryAPI.create(payload),
    onSuccess: () => {
      toast.success('Thêm danh mục thành công!')
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
      closeModal()
    },
    onError: () => toast.error('Thêm danh mục thất bại!'),
  })

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => categoryAPI.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thành công!')
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
      closeModal()
    },
    onError: () => toast.error('Cập nhật thất bại!'),
  })

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: (id) => categoryAPI.delete(id),
    onSuccess: () => {
      toast.success('Xoá danh mục thành công!')
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
    onError: () => toast.error('Xoá danh mục thất bại!'),
  })

  // --- HÀM XỬ LÝ SWITCH TRẠNG THÁI (MỚI THÊM) ---
  const handleToggleStatus = (record, checked) => {
    const newStatus = checked ? 1 : 0 // 1: Hiện, 0: Ẩn

    // Gọi mutation update nhưng không đóng modal hay làm gì khác
    updateMutation.mutate({
      id: record._id,
      payload: {
        ...record, // Giữ nguyên các trường khác
        status: newStatus,
      },
    })
  }

  const openCreate = () => {
    setEditingRow(null)
    form.resetFields()
    setIsOpenModal(true)
  }

  const openEdit = (record) => {
    setEditingRow(record)
    form.resetFields()
    form.setFieldsValue({
      category_name: record.category_name,
      description: record.description || '',
      imageUrl: record.imageUrl || '',
      status: typeof record.status === 'number' ? record.status : 1,
    })
    setIsOpenModal(true)
  }

  const handleRemove = (id) => {
    deleteMutation.mutate(id)
  }

  const closeModal = () => {
    form.resetFields()
    setIsOpenModal(false)
    setEditingRow(null)
  }

  const submitting = createMutation.isPending || updateMutation.isPending
  const modalTitle = useMemo(
    () => (editingRow ? 'Cập nhật danh mục' : 'Thêm danh mục'),
    [editingRow]
  )

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = { ...values }

      if (editingRow) {
        updateMutation.mutate({ id: editingRow._id, payload })
      } else {
        createMutation.mutate(payload)
      }
    } catch {
      // Lỗi validate
    }
  }

  return (
    <div className="h-full overflow-auto">
      <section className="mb-3">
        <h1 className="font-bold text-3xl mb-2">Quản lý danh mục</h1>
        <Breadcrumb items={[{ title: 'Trang chủ' }, { title: 'Quản lý danh mục' }]} />
      </section>

      <section className="flex justify-end mb-5">
        <AntButton type="primary" icon={<PlusCircleOutlined />} onClick={openCreate}>
          Thêm mới
        </AntButton>
      </section>

      <Card title="Danh sách danh mục" className="shadow-sm rounded-2xl">
        <CategoryTable
          data={categories}
          loading={isLoading}
          onEdit={openEdit}
          onRemove={handleRemove}
          deletingId={deletingId}
          onToggleStatus={handleToggleStatus} // <--- TRUYỀN HÀM MỚI VÀO ĐÂY
        />
      </Card>

      <CategoryFormModal
        open={isOpenModal}
        title={modalTitle}
        submitting={submitting}
        form={form}
        onOk={handleOk}
        onCancel={closeModal}
      />
    </div>
  )
}

export default CategoryManagement
