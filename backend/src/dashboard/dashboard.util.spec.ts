import {
  calculatePercentChange,
  sumExpense,
  sumIncome,
  TypedAmount,
} from './dashboard.util';

describe('dashboard.util', () => {
  describe('sumIncome', () => {
    it('cộng dồn đúng các giao dịch INCOME và bỏ qua EXPENSE/TRANSFER', () => {
      const transactions: TypedAmount[] = [
        { type: 'INCOME', amount: 15_000_000 },
        { type: 'EXPENSE', amount: 50_000 },
        { type: 'INCOME', amount: 2_000_000 },
        { type: 'TRANSFER', amount: 1_000_000 },
      ];

      expect(sumIncome(transactions)).toBe(17_000_000);
    });

    it('trả về 0 khi không có giao dịch INCOME nào', () => {
      const transactions: TypedAmount[] = [
        { type: 'EXPENSE', amount: 100_000 },
      ];

      expect(sumIncome(transactions)).toBe(0);
    });

    it('trả về 0 với danh sách rỗng', () => {
      expect(sumIncome([])).toBe(0);
    });
  });

  describe('sumExpense', () => {
    it('cộng dồn đúng các giao dịch EXPENSE và bỏ qua INCOME/TRANSFER', () => {
      const transactions: TypedAmount[] = [
        { type: 'EXPENSE', amount: 50_000 },
        { type: 'INCOME', amount: 15_000_000 },
        { type: 'EXPENSE', amount: 200_000 },
        { type: 'TRANSFER', amount: 500_000 },
      ];

      expect(sumExpense(transactions)).toBe(250_000);
    });

    it('trả về 0 khi không có giao dịch EXPENSE nào', () => {
      const transactions: TypedAmount[] = [{ type: 'INCOME', amount: 100_000 }];

      expect(sumExpense(transactions)).toBe(0);
    });
  });

  describe('calculatePercentChange', () => {
    it('tính đúng % tăng so với kỳ trước', () => {
      expect(calculatePercentChange(120, 100)).toBe(20);
    });

    it('tính đúng % giảm so với kỳ trước', () => {
      expect(calculatePercentChange(80, 100)).toBe(-20);
    });

    it('trả về 0 khi cả hai kỳ đều bằng 0', () => {
      expect(calculatePercentChange(0, 0)).toBe(0);
    });

    it('trả về null khi kỳ trước = 0 nhưng kỳ này > 0 (không có tỷ lệ % hữu hạn)', () => {
      expect(calculatePercentChange(500_000, 0)).toBeNull();
    });

    it('không đổi thì trả về 0%', () => {
      expect(calculatePercentChange(1_000_000, 1_000_000)).toBe(0);
    });
  });
});
