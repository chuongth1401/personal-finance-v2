import { BudgetStatus } from '../enums/budget-status.enum';

export interface BudgetResponse {
  id: string;
  userId: string;
  categoryId: string;
  /** Định dạng YYYY-MM. */
  month: string;
  limitAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetWithUsage extends BudgetResponse {
  categoryName: string;
  categoryColor: string;
  spentAmount: number;
  /** limitAmount - spentAmount, có thể âm khi đã vượt ngân sách. */
  remainingAmount: number;
  /** 0-100+, có thể vượt quá 100 nếu đã chi vượt ngân sách. */
  percentageUsed: number;
  status: BudgetStatus;
}
