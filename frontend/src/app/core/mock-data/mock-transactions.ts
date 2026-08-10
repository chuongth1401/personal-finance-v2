import { Transaction } from '../models/transaction.model';

const VCB = 'acc-vcb';
const CASH = 'acc-cash';
const MOMO = 'acc-momo';
const VIB = 'acc-vib';

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Tháng 3/2026
  { id: 't-2603-01', date: '2026-03-05', description: 'Lương tháng 3', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2603-02', date: '2026-03-07', description: 'Tiền chợ, siêu thị', amount: 2_100_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2603-03', date: '2026-03-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2603-04', date: '2026-03-14', description: 'Đổ xăng', amount: 450_000, type: 'expense', categoryId: 'cat-transport', accountId: CASH },
  { id: 't-2603-05', date: '2026-03-18', description: 'Xem phim CGV', amount: 320_000, type: 'expense', categoryId: 'cat-entertainment', accountId: MOMO },
  { id: 't-2603-06', date: '2026-03-22', description: 'Hóa đơn điện nước', amount: 980_000, type: 'expense', categoryId: 'cat-bills', accountId: VCB },
  { id: 't-2603-07', date: '2026-03-27', description: 'Mua quần áo', amount: 1_250_000, type: 'expense', categoryId: 'cat-shopping', accountId: VIB },

  // Tháng 4/2026
  { id: 't-2604-01', date: '2026-04-05', description: 'Lương tháng 4', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2604-02', date: '2026-04-06', description: 'Cổ tức quỹ đầu tư', amount: 900_000, type: 'income', categoryId: 'cat-invest', accountId: VCB },
  { id: 't-2604-03', date: '2026-04-08', description: 'Tiền chợ, siêu thị', amount: 2_350_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2604-04', date: '2026-04-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2604-05', date: '2026-04-15', description: 'Khám răng định kỳ', amount: 700_000, type: 'expense', categoryId: 'cat-health', accountId: MOMO },
  { id: 't-2604-06', date: '2026-04-19', description: 'Grab đi lại', amount: 380_000, type: 'expense', categoryId: 'cat-transport', accountId: MOMO },
  { id: 't-2604-07', date: '2026-04-24', description: 'Khóa học online', amount: 1_500_000, type: 'expense', categoryId: 'cat-education', accountId: VIB },

  // Tháng 5/2026
  { id: 't-2605-01', date: '2026-05-05', description: 'Lương tháng 5', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2605-02', date: '2026-05-09', description: 'Tiền chợ, siêu thị', amount: 2_480_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2605-03', date: '2026-05-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2605-04', date: '2026-05-13', description: 'Hóa đơn điện nước', amount: 1_120_000, type: 'expense', categoryId: 'cat-bills', accountId: VCB },
  { id: 't-2605-05', date: '2026-05-20', description: 'Mua giày thể thao', amount: 1_850_000, type: 'expense', categoryId: 'cat-shopping', accountId: VIB },
  { id: 't-2605-06', date: '2026-05-25', description: 'Cà phê, ăn ngoài', amount: 640_000, type: 'expense', categoryId: 'cat-food', accountId: MOMO },
  { id: 't-2605-07', date: '2026-05-28', description: 'Đổ xăng', amount: 470_000, type: 'expense', categoryId: 'cat-transport', accountId: CASH },

  // Tháng 6/2026
  { id: 't-2606-01', date: '2026-06-05', description: 'Lương tháng 6', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2606-02', date: '2026-06-06', description: 'Thưởng dự án', amount: 3_500_000, type: 'income', categoryId: 'cat-bonus', accountId: VCB },
  { id: 't-2606-03', date: '2026-06-08', description: 'Tiền chợ, siêu thị', amount: 2_600_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2606-04', date: '2026-06-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2606-05', date: '2026-06-16', description: 'Du lịch cuối tuần', amount: 2_900_000, type: 'expense', categoryId: 'cat-entertainment', accountId: VIB },
  { id: 't-2606-06', date: '2026-06-21', description: 'Hóa đơn điện nước', amount: 1_340_000, type: 'expense', categoryId: 'cat-bills', accountId: VCB },
  { id: 't-2606-07', date: '2026-06-29', description: 'Khám sức khỏe tổng quát', amount: 1_600_000, type: 'expense', categoryId: 'cat-health', accountId: MOMO },

  // Tháng 7/2026
  { id: 't-2607-01', date: '2026-07-05', description: 'Lương tháng 7', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2607-02', date: '2026-07-08', description: 'Tiền chợ, siêu thị', amount: 2_250_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2607-03', date: '2026-07-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2607-04', date: '2026-07-12', description: 'Mua sách, dụng cụ học tập', amount: 620_000, type: 'expense', categoryId: 'cat-education', accountId: VIB },
  { id: 't-2607-05', date: '2026-07-17', description: 'Grab đi lại', amount: 410_000, type: 'expense', categoryId: 'cat-transport', accountId: MOMO },
  { id: 't-2607-06', date: '2026-07-23', description: 'Mua đồ gia dụng', amount: 1_780_000, type: 'expense', categoryId: 'cat-shopping', accountId: VIB },
  { id: 't-2607-07', date: '2026-07-26', description: 'Hóa đơn điện nước', amount: 1_050_000, type: 'expense', categoryId: 'cat-bills', accountId: VCB },
  { id: 't-2607-08', date: '2026-07-30', description: 'Sinh nhật bạn bè', amount: 500_000, type: 'expense', categoryId: 'cat-other-expense', accountId: CASH },

  // Tháng 8/2026 (đến 10/8)
  { id: 't-2608-01', date: '2026-08-05', description: 'Lương tháng 8', amount: 18_500_000, type: 'income', categoryId: 'cat-salary', accountId: VCB },
  { id: 't-2608-02', date: '2026-08-06', description: 'Lãi tiết kiệm', amount: 620_000, type: 'income', categoryId: 'cat-invest', accountId: VCB },
  { id: 't-2608-03', date: '2026-08-07', description: 'Tiền chợ, siêu thị', amount: 1_480_000, type: 'expense', categoryId: 'cat-food', accountId: CASH },
  { id: 't-2608-04', date: '2026-08-08', description: 'Ăn ngoài cuối tuần', amount: 560_000, type: 'expense', categoryId: 'cat-food', accountId: MOMO },
  { id: 't-2608-05', date: '2026-08-09', description: 'Đổ xăng', amount: 420_000, type: 'expense', categoryId: 'cat-transport', accountId: CASH },
  { id: 't-2608-06', date: '2026-08-10', description: 'Tiền thuê nhà', amount: 6_000_000, type: 'expense', categoryId: 'cat-housing', accountId: VCB },
  { id: 't-2608-07', date: '2026-08-10', description: 'Netflix, Spotify', amount: 260_000, type: 'expense', categoryId: 'cat-entertainment', accountId: VIB },
  { id: 't-2608-08', date: '2026-08-10', description: 'Mua thuốc, vitamin', amount: 340_000, type: 'expense', categoryId: 'cat-health', accountId: MOMO },
];
