/** Số tháng từ `from` đến `to`, chỉ tính theo năm/tháng (bỏ qua ngày trong tháng). Có thể âm. */
export function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

/** % tiến độ đạt mục tiêu. An toàn khi targetAmount <= 0 (trả về 0 thay vì chia cho 0/NaN). */
export function calculateProgressPercentage(
  currentAmount: number,
  targetAmount: number,
): number {
  if (targetAmount <= 0) return 0;
  return Math.max((currentAmount / targetAmount) * 100, 0);
}

/**
 * Số tiền cần tiết kiệm mỗi tháng để đạt targetAmount đúng targetDate.
 *
 * - null: targetAmount <= 0 (không có mục tiêu rõ ràng) hoặc không có targetDate
 *   (không có hạn để tính theo tháng).
 * - 0: đã đạt hoặc vượt targetAmount.
 * - targetDate đã qua hoặc là tháng hiện tại: cần đạt toàn bộ phần còn thiếu ngay
 *   trong tháng này (chia cho tối thiểu 1 tháng).
 */
export function calculateMonthlyContributionNeeded(
  currentAmount: number,
  targetAmount: number,
  targetDate: Date | null,
  now: Date = new Date(),
): number | null {
  if (targetAmount <= 0 || !targetDate) return null;

  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;

  const monthsRemaining = Math.max(monthsBetween(now, targetDate), 1);
  return Math.ceil(remaining / monthsRemaining);
}

/**
 * Ngày dự kiến hoàn thành nếu giữ tốc độ tiết kiệm trung bình hiện tại
 * (currentAmount / số tháng kể từ khi tạo mục tiêu, tối thiểu 1 tháng).
 *
 * - null: targetAmount <= 0, hoặc tốc độ tiết kiệm hiện tại <= 0 (chưa có đóng góp
 *   nào để ước tính, không thể dự đoán ngày hoàn thành).
 * - now: đã đạt hoặc vượt targetAmount (coi như hoàn thành ngay bây giờ).
 */
export function calculateProjectedCompletionDate(
  currentAmount: number,
  targetAmount: number,
  createdAt: Date,
  now: Date = new Date(),
): Date | null {
  if (targetAmount <= 0) return null;
  if (currentAmount >= targetAmount) return now;

  const monthsElapsed = Math.max(monthsBetween(createdAt, now), 1);
  const averageMonthlyPace = currentAmount / monthsElapsed;
  if (averageMonthlyPace <= 0) return null;

  const remaining = targetAmount - currentAmount;
  const monthsNeeded = Math.ceil(remaining / averageMonthlyPace);
  return new Date(
    now.getFullYear(),
    now.getMonth() + monthsNeeded,
    now.getDate(),
  );
}
