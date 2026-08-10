import { Budget } from '../models/budget.model';

const PERIOD = '2026-08';

export const MOCK_BUDGETS: Budget[] = [
  { id: 'bud-food', categoryId: 'cat-food', limit: 2_500_000, period: PERIOD },
  { id: 'bud-housing', categoryId: 'cat-housing', limit: 6_000_000, period: PERIOD },
  { id: 'bud-transport', categoryId: 'cat-transport', limit: 1_000_000, period: PERIOD },
  { id: 'bud-entertainment', categoryId: 'cat-entertainment', limit: 500_000, period: PERIOD },
  { id: 'bud-health', categoryId: 'cat-health', limit: 800_000, period: PERIOD },
  { id: 'bud-shopping', categoryId: 'cat-shopping', limit: 2_000_000, period: PERIOD },
  { id: 'bud-bills', categoryId: 'cat-bills', limit: 1_200_000, period: PERIOD },
];
