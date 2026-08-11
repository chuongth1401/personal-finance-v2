/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * Receipt.status được lưu là String và validate bằng enum này.
 */
export enum ReceiptStatus {
  /** Vừa tải lên, chưa xử lý. */
  UPLOADED = 'UPLOADED',
  /** Đang trích xuất dữ liệu (OCR/mock). */
  PROCESSING = 'PROCESSING',
  /** Trích xuất xong, có dữ liệu draft (merchant/amount/date) chờ người dùng xác nhận. */
  COMPLETED = 'COMPLETED',
  /** Trích xuất thất bại - xem errorMessage. */
  FAILED = 'FAILED',
  /** Người dùng đã xác nhận, đã tạo Transaction chính thức (xem transactionId). */
  CONFIRMED = 'CONFIRMED',
}
