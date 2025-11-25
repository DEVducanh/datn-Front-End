export const ITEM_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận', color: 'gold' },
  { value: 'Processing', label: 'Đang nấu', color: 'blue' },
  { value: 'Ready', label: 'Nấu xong', color: 'cyan' },
  { value: 'Served', label: 'Đã phục vụ', color: 'green' },
  { value: 'Cancelled', label: 'Hủy', color: 'red' },
]

export const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
