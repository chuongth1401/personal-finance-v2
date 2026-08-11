/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * Account.type được lưu là String và validate bằng enum này ở tầng ứng dụng.
 */
export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  EWALLET = 'EWALLET',
  CREDIT = 'CREDIT',
}
