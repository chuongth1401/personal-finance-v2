export type InsightType = 'ANOMALY' | 'RECURRING_CANDIDATE' | 'BUDGET_RISK' | 'FORECAST';
export type InsightSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface FinancialInsight {
  id: string;
  userId: string;
  categoryId: string | null;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  relatedTransactionIds: string[];
  /** ISO 8601 datetime, null nếu insight không gắn với một kỳ cụ thể. */
  periodStart: string | null;
  periodEnd: string | null;
  isRead: boolean;
  createdAt: string;
}
