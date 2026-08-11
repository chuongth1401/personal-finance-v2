/**
 * SQLite không hỗ trợ enum ở tầng DB, nên status được tính động ở tầng
 * ứng dụng (không lưu trong Prisma) dựa trên phần trăm đã dùng của ngân sách.
 */
export enum BudgetStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  EXCEEDED = 'EXCEEDED',
}
