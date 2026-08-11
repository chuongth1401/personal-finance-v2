/**
 * SQLite không hỗ trợ enum ở tầng DB (xem prisma/schema.prisma), nên
 * FinancialInsight.type được lưu là String và validate bằng enum này.
 */
export enum InsightType {
  /** Giao dịch có số tiền bất thường so với lịch sử cùng danh mục. */
  ANOMALY = 'ANOMALY',
  /** Nhóm giao dịch có khả năng là khoản định kỳ (thuê bao, hoá đơn...). */
  RECURRING_CANDIDATE = 'RECURRING_CANDIDATE',
  /** Dự báo chi tiêu cuối tháng có nguy cơ vượt ngân sách đã đặt. */
  BUDGET_RISK = 'BUDGET_RISK',
  /** Dự báo tổng chi tiêu đến cuối tháng theo tốc độ chi tiêu hiện tại. */
  FORECAST = 'FORECAST',
}
