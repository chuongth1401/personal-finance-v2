import { Goal } from '../models/goal.model';

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-emergency',
    name: 'Quỹ khẩn cấp',
    targetAmount: 60_000_000,
    currentAmount: 38_500_000,
    deadline: '2026-12-31',
    color: '#0891b2',
  },
  {
    id: 'goal-motorbike',
    name: 'Mua xe máy mới',
    targetAmount: 45_000_000,
    currentAmount: 21_000_000,
    deadline: '2027-03-01',
    color: '#f97316',
  },
  {
    id: 'goal-japan-trip',
    name: 'Du lịch Nhật Bản',
    targetAmount: 35_000_000,
    currentAmount: 30_800_000,
    deadline: '2026-11-15',
    color: '#8b5cf6',
  },
  {
    id: 'goal-laptop',
    name: 'Laptop công việc mới',
    targetAmount: 28_000_000,
    currentAmount: 9_200_000,
    deadline: '2027-01-31',
    color: '#16a34a',
  },
];
