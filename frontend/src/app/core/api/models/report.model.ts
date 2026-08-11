import { Transaction } from './transaction.model';

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
  categoryBreakdown: CategoryBreakdownItem[];
  topCategories: CategoryBreakdownItem[];
  cashFlow: CashFlowPoint[];
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
