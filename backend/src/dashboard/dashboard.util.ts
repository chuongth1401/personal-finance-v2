import { TransactionType } from '../transactions/enums/transaction-type.enum';

export interface TypedAmount {
  type: string;
  amount: number;
}

/** Tổng số tiền của các giao dịch khớp `type`. */
export function sumByType(
  transactions: TypedAmount[],
  type: TransactionType,
): number {
  return transactions
    .filter((t) => t.type === (type as string))
    .reduce((total, t) => total + t.amount, 0);
}

export function sumIncome(transactions: TypedAmount[]): number {
  return sumByType(transactions, TransactionType.INCOME);
}

export function sumExpense(transactions: TypedAmount[]): number {
  return sumByType(transactions, TransactionType.EXPENSE);
}

/**
 * % thay đổi so với kỳ trước: (current - previous) / previous * 100.
 * previous = 0: trả về 0 nếu current cũng = 0 (không đổi), null nếu không thể tính %
 * (tăng từ 0 lên một số dương không có tỷ lệ % hữu hạn).
 */
export function calculatePercentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}
