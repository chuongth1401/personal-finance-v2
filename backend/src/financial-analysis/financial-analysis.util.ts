import { InsightSeverity } from './enums/insight-severity.enum';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ---------------------------------------------------------------------------
// 1. Phát hiện giao dịch bất thường (so với lịch sử theo danh mục)
// ---------------------------------------------------------------------------

/** Cần tối thiểu ngần này giao dịch lịch sử mới đủ tin cậy để so sánh. */
export const MIN_HISTORY_SAMPLE_SIZE = 3;
/** z-score >= ngưỡng này thì coi là bất thường. */
export const ANOMALY_Z_SCORE_THRESHOLD = 2.5;
/** z-score >= ngưỡng này thì coi là bất thường nghiêm trọng. */
export const ANOMALY_CRITICAL_Z_SCORE = 4;
/** Dùng khi lịch sử "phẳng" (độ lệch chuẩn = 0) - so sánh theo bội số trung bình thay vì z-score. */
export const FLAT_HISTORY_MULTIPLIER = 2;

export interface CategoryStats {
  mean: number;
  stdDev: number;
  count: number;
}

/** Trung bình và độ lệch chuẩn (dân số) của một mảng số tiền. */
export function calculateStats(amounts: number[]): CategoryStats {
  const count = amounts.length;
  if (count === 0) return { mean: 0, stdDev: 0, count: 0 };

  const mean = amounts.reduce((sum, a) => sum + a, 0) / count;
  const variance = amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / count;
  return { mean, stdDev: Math.sqrt(variance), count };
}

export interface AnomalyCandidate {
  id: string;
  categoryId: string | null;
  amount: number;
}

export interface AnomalyResult {
  transactionId: string;
  categoryId: string;
  amount: number;
  categoryMean: number;
  /** null khi lịch sử "phẳng" (stdDev = 0) và không thể tính z-score. */
  zScore: number | null;
}

/**
 * So sánh từng giao dịch hiện tại với phân bố số tiền lịch sử của cùng danh
 * mục (z-score = (amount - mean) / stdDev). Bỏ qua danh mục chưa đủ lịch sử
 * (MIN_HISTORY_SAMPLE_SIZE) để tránh báo động giả từ dữ liệu quá ít.
 */
export function detectAnomalousTransactions(
  currentTransactions: AnomalyCandidate[],
  historyByCategory: Map<string, number[]>,
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  for (const t of currentTransactions) {
    if (!t.categoryId) continue;
    const history = historyByCategory.get(t.categoryId) ?? [];
    if (history.length < MIN_HISTORY_SAMPLE_SIZE) continue;

    const stats = calculateStats(history);

    if (stats.stdDev === 0) {
      if (t.amount > stats.mean * FLAT_HISTORY_MULTIPLIER) {
        results.push({
          transactionId: t.id,
          categoryId: t.categoryId,
          amount: t.amount,
          categoryMean: stats.mean,
          zScore: null,
        });
      }
      continue;
    }

    const zScore = (t.amount - stats.mean) / stats.stdDev;
    if (zScore >= ANOMALY_Z_SCORE_THRESHOLD) {
      results.push({
        transactionId: t.id,
        categoryId: t.categoryId,
        amount: t.amount,
        categoryMean: stats.mean,
        zScore,
      });
    }
  }

  return results.sort(
    (a, b) => (b.zScore ?? Infinity) - (a.zScore ?? Infinity),
  );
}

export function anomalySeverity(zScore: number | null): InsightSeverity {
  if (zScore === null || zScore >= ANOMALY_CRITICAL_Z_SCORE)
    return InsightSeverity.CRITICAL;
  return InsightSeverity.WARNING;
}

// ---------------------------------------------------------------------------
// 2. Phát hiện khoản có khả năng định kỳ
// ---------------------------------------------------------------------------

/** Số lần lặp lại tối thiểu mới coi là ứng viên định kỳ. */
export const MIN_RECURRING_OCCURRENCES = 3;
/** Số tiền giữa các lần lặp phải nằm trong ±10% trung bình nhóm. */
export const RECURRING_AMOUNT_TOLERANCE_RATIO = 0.1;
/** Khoảng cách giữa các lần lặp phải nằm trong ±25% khoảng cách trung bình. */
export const RECURRING_INTERVAL_TOLERANCE_RATIO = 0.25;

export interface RecurringCandidate {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface RecurringGroup {
  /** Mô tả đã chuẩn hoá dùng làm khoá nhóm - cũng là mô tả hiển thị. */
  description: string;
  transactionIds: string[];
  occurrenceCount: number;
  averageAmount: number;
  averageIntervalDays: number;
}

/** Chuẩn hoá mô tả/ghi chú để so khớp "gần giống nhau": bỏ khoảng trắng thừa, hoa/thường, dấu tiếng Việt. */
export function normalizeDescription(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt (combining marks sau NFKD)
    .replace(/\s+/g, ' ');
}

/**
 * Nhóm giao dịch theo mô tả tương tự nhau, rồi giữ lại các nhóm có số tiền
 * gần nhau (±10%) và khoảng lặp đều đặn (±25%) với tối thiểu 3 lần lặp.
 */
export function findRecurringCandidates(
  transactions: RecurringCandidate[],
): RecurringGroup[] {
  const groups = new Map<string, RecurringCandidate[]>();
  for (const t of transactions) {
    const key = normalizeDescription(t.description);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const results: RecurringGroup[] = [];

  for (const [key, group] of groups) {
    if (group.length < MIN_RECURRING_OCCURRENCES) continue;

    const amounts = group.map((t) => t.amount);
    const meanAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const amountsAreSimilar = amounts.every(
      (a) =>
        Math.abs(a - meanAmount) <=
        meanAmount * RECURRING_AMOUNT_TOLERANCE_RATIO,
    );
    if (!amountsAreSimilar) continue;

    const sorted = [...group].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(
        (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / MS_PER_DAY,
      );
    }
    const meanGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    if (meanGap <= 0) continue;

    const intervalsAreRegular = gaps.every(
      (g) =>
        Math.abs(g - meanGap) <= meanGap * RECURRING_INTERVAL_TOLERANCE_RATIO,
    );
    if (!intervalsAreRegular) continue;

    results.push({
      description: key,
      transactionIds: sorted.map((t) => t.id),
      occurrenceCount: sorted.length,
      averageAmount: meanAmount,
      averageIntervalDays: meanGap,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// 3. Dự báo chi tiêu cuối tháng (run-rate tuyến tính - đơn giản, minh bạch)
// ---------------------------------------------------------------------------

export interface ForecastResult {
  spentSoFar: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  dailyAverage: number;
  projectedTotal: number;
}

/**
 * Dự báo = (đã chi / số ngày đã qua) * tổng số ngày trong tháng.
 * `daysElapsed` được kẹp trong [1, totalDaysInMonth] để tránh chia cho 0 (đầu
 * tháng) hoặc vượt quá số ngày thực có khi `asOf` nằm ngoài tháng đang xét.
 */
export function forecastMonthEndSpending(
  spentSoFar: number,
  monthStart: Date,
  monthEndExclusive: Date,
  asOf: Date,
): ForecastResult {
  const totalDaysInMonth = Math.round(
    (monthEndExclusive.getTime() - monthStart.getTime()) / MS_PER_DAY,
  );
  const rawElapsed =
    Math.floor((asOf.getTime() - monthStart.getTime()) / MS_PER_DAY) + 1;
  const daysElapsed = Math.min(Math.max(rawElapsed, 1), totalDaysInMonth);

  const dailyAverage = spentSoFar / daysElapsed;
  const projectedTotal = dailyAverage * totalDaysInMonth;

  return {
    spentSoFar,
    daysElapsed,
    totalDaysInMonth,
    dailyAverage,
    projectedTotal,
  };
}

// ---------------------------------------------------------------------------
// 4. Đánh giá rủi ro vượt ngân sách dựa trên dự báo
// ---------------------------------------------------------------------------

export type BudgetRiskLevel = 'NONE' | 'WARNING' | 'CRITICAL';

/** Dự báo >= 120% hạn mức: CRITICAL. >= 100%: WARNING. Còn lại: NONE. */
export function evaluateBudgetRisk(
  projectedTotal: number,
  limit: number,
): BudgetRiskLevel {
  if (limit <= 0) return 'NONE';
  const ratio = projectedTotal / limit;
  if (ratio >= 1.2) return 'CRITICAL';
  if (ratio >= 1) return 'WARNING';
  return 'NONE';
}
