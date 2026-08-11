import { GoalStatus } from '../enums/goal-status.enum';

export interface SavingsGoalResponse {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  icon: string | null;
  color: string | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoalWithProgress extends SavingsGoalResponse {
  /** 0-100+, có thể vượt quá 100 nếu currentAmount > targetAmount. */
  progressPercentage: number;
  /**
   * Số tiền cần tiết kiệm mỗi tháng để đạt targetAmount đúng targetDate.
   * null khi targetAmount = 0 hoặc không có targetDate. 0 khi đã đạt mục tiêu.
   */
  monthlyContributionNeeded: number | null;
  /**
   * Ngày dự kiến hoàn thành nếu giữ tốc độ tiết kiệm trung bình hiện tại
   * (currentAmount / số tháng kể từ khi tạo mục tiêu).
   * null khi targetAmount = 0, hoặc chưa có khoản tiết kiệm nào để ước tính tốc độ.
   */
  projectedCompletionDate: Date | null;
}
