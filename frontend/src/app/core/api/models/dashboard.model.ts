import { Transaction } from './transaction.model';

export interface MonthComparison {
  previousMonth: string;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
}

export interface CashFlowDay {
  /** Định dạng YYYY-MM-DD. */
  date: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
}

export interface BudgetNearLimit {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  /** 0-100+, có thể vượt quá 100 nếu đã chi vượt ngân sách. */
  usagePercent: number;
}

export interface DashboardSummary {
  /** Định dạng YYYY-MM. */
  month: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number;
  comparisonToPreviousMonth: MonthComparison;
  cashFlow: CashFlowDay[];
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: Transaction[];
  budgetsNearLimit: BudgetNearLimit[];
}
