/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * Category.kind được lưu là String và validate bằng enum này ở tầng ứng dụng.
 */
export enum CategoryKind {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}
