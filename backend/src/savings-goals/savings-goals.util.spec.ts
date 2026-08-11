import {
  calculateMonthlyContributionNeeded,
  calculateProgressPercentage,
  calculateProjectedCompletionDate,
} from './savings-goals.util';

describe('calculateMonthlyContributionNeeded', () => {
  const now = new Date(2026, 7, 11); // 2026-08-11

  it('chia đều phần còn thiếu cho số tháng còn lại (làm tròn lên)', () => {
    // Còn thiếu 10.000.000, còn 4 tháng (tháng 12) -> 2.500.000/tháng
    const targetDate = new Date(2026, 11, 1);
    expect(
      calculateMonthlyContributionNeeded(
        20_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(2_500_000);
  });

  it('làm tròn lên khi chia không hết', () => {
    // Còn thiếu 10.000.000, còn 3 tháng -> 3.333.334 (ceil)
    const targetDate = new Date(2026, 10, 1);
    expect(
      calculateMonthlyContributionNeeded(
        20_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(3_333_334);
  });

  it('trả về 0 khi đã đạt targetAmount', () => {
    const targetDate = new Date(2026, 11, 1);
    expect(
      calculateMonthlyContributionNeeded(
        30_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(0);
  });

  it('trả về 0 khi đã vượt targetAmount', () => {
    const targetDate = new Date(2026, 11, 1);
    expect(
      calculateMonthlyContributionNeeded(
        35_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(0);
  });

  it('trả về null khi không có targetDate', () => {
    expect(
      calculateMonthlyContributionNeeded(20_000_000, 30_000_000, null, now),
    ).toBeNull();
  });

  it('trả về null khi targetAmount = 0', () => {
    const targetDate = new Date(2026, 11, 1);
    expect(
      calculateMonthlyContributionNeeded(0, 0, targetDate, now),
    ).toBeNull();
  });

  it('trả về null khi targetAmount âm', () => {
    const targetDate = new Date(2026, 11, 1);
    expect(
      calculateMonthlyContributionNeeded(0, -1000, targetDate, now),
    ).toBeNull();
  });

  it('dồn hết vào tháng hiện tại khi targetDate đã qua (không chia cho số âm)', () => {
    const targetDate = new Date(2026, 0, 1); // đã qua so với `now`
    expect(
      calculateMonthlyContributionNeeded(
        20_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(10_000_000);
  });

  it('dồn hết vào tháng hiện tại khi targetDate là tháng này (0 tháng còn lại)', () => {
    const targetDate = new Date(2026, 7, 25); // cùng tháng 8/2026 với `now`
    expect(
      calculateMonthlyContributionNeeded(
        20_000_000,
        30_000_000,
        targetDate,
        now,
      ),
    ).toBe(10_000_000);
  });
});

describe('calculateProgressPercentage (an toàn khi targetAmount = 0)', () => {
  it('tính đúng % tiến độ bình thường', () => {
    expect(calculateProgressPercentage(25, 100)).toBe(25);
  });

  it('trả về 0 khi targetAmount = 0 thay vì chia cho 0', () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
    expect(calculateProgressPercentage(500, 0)).toBe(0);
  });
});

describe('calculateProjectedCompletionDate (an toàn khi thiếu dữ liệu)', () => {
  const now = new Date(2026, 7, 11);

  it('trả về null khi targetAmount = 0', () => {
    expect(
      calculateProjectedCompletionDate(0, 0, new Date(2026, 0, 1), now),
    ).toBeNull();
  });

  it('trả về null khi chưa có khoản tiết kiệm nào (không thể ước tính tốc độ)', () => {
    expect(
      calculateProjectedCompletionDate(
        0,
        30_000_000,
        new Date(2026, 6, 1),
        now,
      ),
    ).toBeNull();
  });

  it('trả về thời điểm hiện tại khi đã đạt mục tiêu', () => {
    expect(
      calculateProjectedCompletionDate(
        30_000_000,
        30_000_000,
        new Date(2026, 0, 1),
        now,
      ),
    ).toEqual(now);
  });
});
