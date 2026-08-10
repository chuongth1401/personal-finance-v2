import { Category } from '../models/category.model';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Lương', kind: 'income', color: '#16a34a' },
  { id: 'cat-bonus', name: 'Thưởng', kind: 'income', color: '#0d9488' },
  { id: 'cat-invest', name: 'Đầu tư', kind: 'income', color: '#0891b2' },
  { id: 'cat-other-income', name: 'Thu nhập khác', kind: 'income', color: '#65a30d' },

  { id: 'cat-food', name: 'Ăn uống', kind: 'expense', color: '#f97316' },
  { id: 'cat-transport', name: 'Di chuyển', kind: 'expense', color: '#eab308' },
  { id: 'cat-housing', name: 'Nhà ở', kind: 'expense', color: '#8b5cf6' },
  { id: 'cat-shopping', name: 'Mua sắm', kind: 'expense', color: '#ec4899' },
  { id: 'cat-entertainment', name: 'Giải trí', kind: 'expense', color: '#06b6d4' },
  { id: 'cat-bills', name: 'Hóa đơn & Tiện ích', kind: 'expense', color: '#ef4444' },
  { id: 'cat-health', name: 'Sức khỏe', kind: 'expense', color: '#14b8a6' },
  { id: 'cat-education', name: 'Giáo dục', kind: 'expense', color: '#6366f1' },
  { id: 'cat-other-expense', name: 'Khác', kind: 'expense', color: '#94a3b8' },
];
