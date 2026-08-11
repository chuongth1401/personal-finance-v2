import { InsightSeverity } from './enums/insight-severity.enum';
import {
  anomalySeverity,
  calculateStats,
  detectAnomalousTransactions,
  evaluateBudgetRisk,
  findRecurringCandidates,
  forecastMonthEndSpending,
  normalizeDescription,
} from './financial-analysis.util';

describe('calculateStats', () => {
  it('tính đúng trung bình và độ lệch chuẩn', () => {
    const stats = calculateStats([10, 20, 30, 40]);
    expect(stats.mean).toBe(25);
    expect(stats.count).toBe(4);
    expect(stats.stdDev).toBeCloseTo(11.18, 1);
  });

  it('trả về mean/stdDev/count = 0 với mảng rỗng (an toàn, không NaN)', () => {
    expect(calculateStats([])).toEqual({ mean: 0, stdDev: 0, count: 0 });
  });

  it('stdDev = 0 khi mọi giá trị giống hệt nhau', () => {
    expect(calculateStats([50, 50, 50]).stdDev).toBe(0);
  });
});

describe('detectAnomalousTransactions', () => {
  const historyByCategory = new Map<string, number[]>([
    // mean=100, stdDev nhỏ - lịch sử ổn định quanh 100k
    ['cat-food', [95_000, 100_000, 105_000, 98_000, 102_000]],
  ]);

  it('phát hiện giao dịch cao bất thường so với lịch sử (z-score >= 2.5)', () => {
    const results = detectAnomalousTransactions(
      [{ id: 'tx-1', categoryId: 'cat-food', amount: 500_000 }],
      historyByCategory,
    );
    expect(results).toHaveLength(1);
    expect(results[0].transactionId).toBe('tx-1');
    expect(results[0].zScore).not.toBeNull();
    expect(results[0].zScore!).toBeGreaterThanOrEqual(2.5);
  });

  it('không báo động với giao dịch nằm trong biên độ bình thường', () => {
    const results = detectAnomalousTransactions(
      [{ id: 'tx-2', categoryId: 'cat-food', amount: 101_000 }],
      historyByCategory,
    );
    expect(results).toHaveLength(0);
  });

  it('bỏ qua danh mục chưa đủ lịch sử (dưới MIN_HISTORY_SAMPLE_SIZE)', () => {
    const thinHistory = new Map([['cat-new', [50_000, 60_000]]]);
    const results = detectAnomalousTransactions(
      [{ id: 'tx-3', categoryId: 'cat-new', amount: 1_000_000 }],
      thinHistory,
    );
    expect(results).toHaveLength(0);
  });

  it('bỏ qua giao dịch không có categoryId', () => {
    const results = detectAnomalousTransactions(
      [{ id: 'tx-4', categoryId: null, amount: 1_000_000 }],
      historyByCategory,
    );
    expect(results).toHaveLength(0);
  });

  it('dùng ngưỡng bội số trung bình khi lịch sử "phẳng" (stdDev = 0)', () => {
    const flatHistory = new Map([
      ['cat-rent', [5_000_000, 5_000_000, 5_000_000]],
    ]);

    const notAnomalous = detectAnomalousTransactions(
      [{ id: 'tx-5', categoryId: 'cat-rent', amount: 5_000_000 }],
      flatHistory,
    );
    expect(notAnomalous).toHaveLength(0);

    const anomalous = detectAnomalousTransactions(
      [{ id: 'tx-6', categoryId: 'cat-rent', amount: 11_000_000 }],
      flatHistory,
    );
    expect(anomalous).toHaveLength(1);
    expect(anomalous[0].zScore).toBeNull();
  });

  it('sắp xếp kết quả theo z-score giảm dần', () => {
    const results = detectAnomalousTransactions(
      [
        { id: 'tx-low', categoryId: 'cat-food', amount: 300_000 },
        { id: 'tx-high', categoryId: 'cat-food', amount: 900_000 },
      ],
      historyByCategory,
    );
    expect(results.map((r) => r.transactionId)).toEqual(['tx-high', 'tx-low']);
  });
});

describe('anomalySeverity', () => {
  it('CRITICAL khi zScore null (lịch sử phẳng)', () => {
    expect(anomalySeverity(null)).toBe(InsightSeverity.CRITICAL);
  });

  it('CRITICAL khi zScore vượt ngưỡng nghiêm trọng', () => {
    expect(anomalySeverity(5)).toBe(InsightSeverity.CRITICAL);
  });

  it('WARNING khi zScore vừa vượt ngưỡng bất thường nhưng chưa nghiêm trọng', () => {
    expect(anomalySeverity(2.6)).toBe(InsightSeverity.WARNING);
  });
});

describe('normalizeDescription', () => {
  it('chuẩn hoá hoa/thường, khoảng trắng thừa và dấu tiếng Việt', () => {
    expect(normalizeDescription('  Tiền  Thuê Nhà  ')).toBe(
      normalizeDescription('tien thue nha'),
    );
  });

  it('hai chuỗi khác nghĩa thì không trùng khoá', () => {
    expect(normalizeDescription('Netflix')).not.toBe(
      normalizeDescription('Spotify'),
    );
  });
});

describe('findRecurringCandidates', () => {
  function daysAgo(n: number, from = new Date('2026-08-11')): Date {
    return new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
  }

  it('phát hiện nhóm giao dịch lặp hàng tháng, số tiền gần nhau', () => {
    const transactions = [
      {
        id: 'tx-1',
        description: 'Netflix',
        amount: 260_000,
        date: daysAgo(90),
      },
      {
        id: 'tx-2',
        description: 'netflix',
        amount: 262_000,
        date: daysAgo(60),
      },
      {
        id: 'tx-3',
        description: 'Netflix ',
        amount: 258_000,
        date: daysAgo(30),
      },
      { id: 'tx-4', description: 'Netflix', amount: 260_000, date: daysAgo(0) },
    ];

    const groups = findRecurringCandidates(transactions);

    expect(groups).toHaveLength(1);
    expect(groups[0].occurrenceCount).toBe(4);
    expect(groups[0].transactionIds).toEqual(['tx-1', 'tx-2', 'tx-3', 'tx-4']);
    expect(groups[0].averageIntervalDays).toBeCloseTo(30, 0);
  });

  it('bỏ qua nhóm chưa đủ số lần lặp tối thiểu', () => {
    const transactions = [
      {
        id: 'tx-1',
        description: 'Cafe la Viet',
        amount: 45_000,
        date: daysAgo(30),
      },
      {
        id: 'tx-2',
        description: 'Cafe la Viet',
        amount: 45_000,
        date: daysAgo(0),
      },
    ];
    expect(findRecurringCandidates(transactions)).toHaveLength(0);
  });

  it('bỏ qua nhóm có số tiền dao động quá nhiều dù cùng mô tả', () => {
    const transactions = [
      { id: 'tx-1', description: 'Mua sam', amount: 50_000, date: daysAgo(90) },
      {
        id: 'tx-2',
        description: 'Mua sam',
        amount: 500_000,
        date: daysAgo(60),
      },
      { id: 'tx-3', description: 'Mua sam', amount: 80_000, date: daysAgo(30) },
    ];
    expect(findRecurringCandidates(transactions)).toHaveLength(0);
  });

  it('bỏ qua nhóm có khoảng lặp không đều đặn', () => {
    const transactions = [
      {
        id: 'tx-1',
        description: 'Sua xe',
        amount: 300_000,
        date: daysAgo(200),
      },
      {
        id: 'tx-2',
        description: 'Sua xe',
        amount: 300_000,
        date: daysAgo(150),
      },
      { id: 'tx-3', description: 'Sua xe', amount: 300_000, date: daysAgo(10) },
    ];
    expect(findRecurringCandidates(transactions)).toHaveLength(0);
  });

  it('bỏ qua mô tả rỗng', () => {
    const transactions = [
      { id: 'tx-1', description: '   ', amount: 100_000, date: daysAgo(60) },
      { id: 'tx-2', description: '', amount: 100_000, date: daysAgo(30) },
      { id: 'tx-3', description: '  ', amount: 100_000, date: daysAgo(0) },
    ];
    expect(findRecurringCandidates(transactions)).toHaveLength(0);
  });
});

describe('forecastMonthEndSpending', () => {
  const monthStart = new Date(2026, 7, 1); // 2026-08-01
  const monthEnd = new Date(2026, 8, 1); // 2026-09-01 (exclusive) -> 31 ngày

  it('ngoại suy tuyến tính từ tốc độ chi tiêu hiện tại', () => {
    const asOf = new Date(2026, 7, 10); // đã qua 10 ngày
    const result = forecastMonthEndSpending(
      3_100_000,
      monthStart,
      monthEnd,
      asOf,
    );

    expect(result.totalDaysInMonth).toBe(31);
    expect(result.daysElapsed).toBe(10);
    expect(result.dailyAverage).toBeCloseTo(310_000, 0);
    expect(result.projectedTotal).toBeCloseTo(310_000 * 31, 0);
  });

  it('kẹp daysElapsed về tối thiểu 1 ở ngày đầu tháng (không chia cho 0)', () => {
    const result = forecastMonthEndSpending(
      50_000,
      monthStart,
      monthEnd,
      monthStart,
    );
    expect(result.daysElapsed).toBe(1);
    expect(Number.isFinite(result.projectedTotal)).toBe(true);
  });

  it('kẹp daysElapsed về tổng số ngày khi asOf đã qua hết tháng (tháng đã kết thúc)', () => {
    const afterMonth = new Date(2026, 8, 15);
    const result = forecastMonthEndSpending(
      9_300_000,
      monthStart,
      monthEnd,
      afterMonth,
    );
    expect(result.daysElapsed).toBe(31);
    expect(result.projectedTotal).toBeCloseTo(9_300_000, 0);
  });
});

describe('evaluateBudgetRisk', () => {
  it('NONE khi dự báo còn dưới hạn mức', () => {
    expect(evaluateBudgetRisk(800_000, 1_000_000)).toBe('NONE');
  });

  it('WARNING khi dự báo chạm hoặc vừa vượt hạn mức (dưới 120%)', () => {
    expect(evaluateBudgetRisk(1_050_000, 1_000_000)).toBe('WARNING');
  });

  it('CRITICAL khi dự báo vượt hạn mức từ 120% trở lên', () => {
    expect(evaluateBudgetRisk(1_300_000, 1_000_000)).toBe('CRITICAL');
  });

  it('NONE khi limit <= 0 (an toàn, không chia cho 0)', () => {
    expect(evaluateBudgetRisk(500_000, 0)).toBe('NONE');
  });
});
