export type BudgetStatus = 'NORMAL' | 'WARNING' | 'EXCEEDED';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  /** Định dạng YYYY-MM. */
  month: string;
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithUsage extends Budget {
  categoryName: string;
  categoryColor: string;
  spentAmount: number;
  /** limitAmount - spentAmount, có thể âm khi đã vượt ngân sách. */
  remainingAmount: number;
  /** 0-100+, có thể vượt quá 100 nếu đã chi vượt ngân sách. */
  percentageUsed: number;
  status: BudgetStatus;
}

export interface CreateBudgetRequest {
  categoryId: string;
  month: string;
  limitAmount: number;
}

export interface UpdateBudgetRequest {
  categoryId?: string;
  month?: string;
  limitAmount?: number;
}
