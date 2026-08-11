export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** ISO 8601 datetime, null nếu chưa đặt hạn. */
  targetDate: string | null;
  icon: string | null;
  color: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  /** 0-100+, có thể vượt quá 100 nếu currentAmount > targetAmount. */
  progressPercentage: number;
  /** null khi targetAmount = 0 hoặc không có targetDate. 0 khi đã đạt mục tiêu. */
  monthlyContributionNeeded: number | null;
  /** ISO 8601 datetime, null khi không thể ước tính tốc độ tiết kiệm. */
  projectedCompletionDate: string | null;
}

export interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  icon?: string;
  color?: string;
  status?: GoalStatus;
}

export interface UpdateSavingsGoalRequest {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  /** `null` để xoá hạn hoàn thành hiện có. */
  targetDate?: string | null;
  icon?: string;
  color?: string;
  status?: GoalStatus;
}
