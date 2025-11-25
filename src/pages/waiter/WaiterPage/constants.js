export const TABLE_STATUS = {
  EMPTY: 'empty',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
}

export const ORDER_ITEM_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  READY: 'Ready', // Bếp đã nấu xong -> Waiter cần bưng ra
  SERVED: 'Served', // Waiter đã bưng ra
  CANCELLED: 'Cancelled',
}
