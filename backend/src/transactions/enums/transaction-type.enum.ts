/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * Transaction.type được lưu là String và validate bằng enum này ở
 * tầng ứng dụng.
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}
