import { Injectable, computed, signal } from '@angular/core';

import { Account } from '../models/account.model';
import { Budget } from '../models/budget.model';
import { Category } from '../models/category.model';
import { Goal } from '../models/goal.model';
import { Transaction } from '../models/transaction.model';
import { MOCK_ACCOUNTS } from '../mock-data/mock-accounts';
import { MOCK_BUDGETS } from '../mock-data/mock-budgets';
import { MOCK_CATEGORIES } from '../mock-data/mock-categories';
import { MOCK_GOALS } from '../mock-data/mock-goals';
import { MOCK_TRANSACTIONS } from '../mock-data/mock-transactions';
import { currentPeriodKey, lastMonths } from '../utils/period';

export interface CategoryBreakdownItem {
  category: Category;
  amount: number;
}

export interface CashFlowPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface BudgetStatus {
  budget: Budget;
  category: Category;
  spent: number;
  ratio: number;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly accounts = signal<Account[]>(MOCK_ACCOUNTS);
  readonly categories = signal<Category[]>(MOCK_CATEGORIES);
  readonly transactions = signal<Transaction[]>(MOCK_TRANSACTIONS);
  readonly budgets = signal<Budget[]>(MOCK_BUDGETS);
  readonly goals = signal<Goal[]>(MOCK_GOALS);

  readonly totalBalance = computed(() => this.accounts().reduce((sum, a) => sum + a.balance, 0));

  private readonly currentPeriod = computed(() => currentPeriodKey());

  readonly currentMonthTransactions = computed(() =>
    this.transactions().filter((t) => t.date.startsWith(this.currentPeriod())),
  );

  readonly monthlyIncome = computed(() =>
    this.currentMonthTransactions()
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly monthlyExpense = computed(() =>
    this.currentMonthTransactions()
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly savingsRate = computed(() => {
    const income = this.monthlyIncome();
    if (income === 0) return 0;
    return Math.round(((income - this.monthlyExpense()) / income) * 100);
  });

  readonly recentTransactions = computed(() =>
    [...this.transactions()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
  );

  readonly categoryBreakdown = computed<CategoryBreakdownItem[]>(() => {
    const totals = new Map<string, number>();
    for (const t of this.currentMonthTransactions()) {
      if (t.type !== 'expense') continue;
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...totals.entries()]
      .map(([categoryId, amount]) => ({ category: this.categoryById(categoryId), amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly cashFlowSeries = computed<CashFlowPoint[]>(() => {
    const months = lastMonths(6);
    const transactions = this.transactions();
    return months.map(({ key, label }) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(key));
      return {
        key,
        label,
        income: monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });
  });

  readonly budgetStatuses = computed<BudgetStatus[]>(() =>
    this.budgets()
      .filter((b) => b.period === this.currentPeriod())
      .map((budget) => {
        const spent = this.currentMonthTransactions()
          .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          budget,
          category: this.categoryById(budget.categoryId),
          spent,
          ratio: budget.limit > 0 ? spent / budget.limit : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio),
  );

  readonly budgetAlerts = computed(() => this.budgetStatuses().filter((s) => s.ratio >= 0.8));

  categoryById(id: string): Category {
    const category = this.categories().find((c) => c.id === id);
    if (!category) {
      throw new Error(`Không tìm thấy danh mục: ${id}`);
    }
    return category;
  }

  accountById(id: string): Account {
    const account = this.accounts().find((a) => a.id === id);
    if (!account) {
      throw new Error(`Không tìm thấy tài khoản: ${id}`);
    }
    return account;
  }
}
