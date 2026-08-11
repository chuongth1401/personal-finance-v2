/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * SavingsGoal.status được lưu là String và validate bằng enum này ở
 * tầng ứng dụng.
 */
export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}
