import { Transaction } from '../../../generated/prisma/client';

export interface PeriodComparison {
  /** YYYY-MM cho báo cáo tháng, YYYY cho báo cáo năm. */
  previousPeriod: string;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
}

export interface CashFlowPoint {
  /** YYYY-MM-DD cho báo cáo tháng, YYYY-MM cho báo cáo năm. */
  period: string;
  income: number;
  expense: number;
}

interface PeriodReportBase {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  comparisonToPreviousPeriod: PeriodComparison;
  /** Chi tiêu theo danh mục, sắp xếp giảm dần theo số tiền. */
  categoryBreakdown: CategoryBreakdownItem[];
  /** Top 5 danh mục chi nhiều nhất - luôn là tập con đầu của categoryBreakdown. */
  topCategories: CategoryBreakdownItem[];
  cashFlow: CashFlowPoint[];
  /** Toàn bộ giao dịch trong kỳ, dùng để xuất CSV phía client nếu cần. */
  transactions: Transaction[];
}

export interface MonthlyReport extends PeriodReportBase {
  /** Định dạng YYYY-MM. */
  month: string;
}

export interface YearlyReport extends PeriodReportBase {
  /** Định dạng YYYY. */
  year: string;
}
