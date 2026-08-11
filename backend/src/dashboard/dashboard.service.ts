import { Injectable } from '@nestjs/common';

import { Transaction } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import {
  calculatePercentChange,
  sumExpense,
  sumIncome,
  TypedAmount,
} from './dashboard.util';
import {
  BudgetNearLimit,
  CashFlowDay,
  CategoryBreakdownItem,
  DashboardSummary,
} from './interfaces/dashboard-summary.interface';

/** Ngân sách được coi là "gần vượt" khi đã dùng từ 80% hạn mức trở lên. */
const BUDGET_ALERT_THRESHOLD_PERCENT = 80;

const RECENT_TRANSACTIONS_LIMIT = 5;

interface MonthRange {
  monthKey: string;
  start: Date;
  end: Date;
  prevMonthKey: string;
  prevStart: Date;
  prevEnd: Date;
}

interface MonthTransaction extends TypedAmount {
  date: Date;
  categoryId: string | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, month?: string): Promise<DashboardSummary> {
    const range = this.resolveMonthRange(month);

    const [
      totalBalance,
      monthTransactions,
      previousMonthTransactions,
      recentTransactions,
    ] = await Promise.all([
      this.calculateTotalBalance(userId),
      this.findMonthTransactions(userId, range.start, range.end),
      this.findMonthTransactions(userId, range.prevStart, range.prevEnd),
      this.findRecentTransactions(userId, range.start, range.end),
    ]);

    const monthlyIncome = sumIncome(monthTransactions);
    const monthlyExpense = sumExpense(monthTransactions);
    const previousIncome = sumIncome(previousMonthTransactions);
    const previousExpense = sumExpense(previousMonthTransactions);

    const [categoryBreakdown, budgetsNearLimit] = await Promise.all([
      this.buildCategoryBreakdown(userId, range.start, range.end),
      this.findBudgetsNearLimit(userId, range.monthKey, monthTransactions),
    ]);

    return {
      month: range.monthKey,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings: monthlyIncome - monthlyExpense,
      comparisonToPreviousMonth: {
        previousMonth: range.prevMonthKey,
        incomeChangePercent: calculatePercentChange(
          monthlyIncome,
          previousIncome,
        ),
        expenseChangePercent: calculatePercentChange(
          monthlyExpense,
          previousExpense,
        ),
      },
      cashFlow: this.buildCashFlowSeries(
        range.start,
        range.end,
        monthTransactions,
      ),
      categoryBreakdown,
      recentTransactions,
      budgetsNearLimit,
    };
  }

  private resolveMonthRange(month?: string): MonthRange {
    const now = new Date();
    const [year, monthNumber] = month
      ? month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const monthIndex = monthNumber - 1;
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);
    const prevStart = new Date(year, monthIndex - 1, 1);
    const prevEnd = start;

    return {
      monthKey: this.formatMonthKey(start),
      start,
      end,
      prevMonthKey: this.formatMonthKey(prevStart),
      prevStart,
      prevEnd,
    };
  }

  private formatMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private async calculateTotalBalance(userId: string): Promise<number> {
    const result = await this.prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    return result._sum.balance ?? 0;
  }

  private findMonthTransactions(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<MonthTransaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true, date: true, categoryId: true },
    });
  }

  private findRecentTransactions(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: RECENT_TRANSACTIONS_LIMIT,
    });
  }

  private buildCashFlowSeries(
    start: Date,
    end: Date,
    transactions: MonthTransaction[],
  ): CashFlowDay[] {
    const byDate = new Map<string, CashFlowDay>();

    for (
      const cursor = new Date(start);
      cursor < end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const key = cursor.toISOString().slice(0, 10);
      byDate.set(key, { date: key, income: 0, expense: 0 });
    }

    for (const t of transactions) {
      const key = t.date.toISOString().slice(0, 10);
      const day = byDate.get(key);
      if (!day) continue;
      if (t.type === (TransactionType.INCOME as string)) day.income += t.amount;
      else if (t.type === (TransactionType.EXPENSE as string))
        day.expense += t.amount;
    }

    return [...byDate.values()];
  }

  private async buildCategoryBreakdown(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<CategoryBreakdownItem[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lt: end },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return [];

    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    return grouped
      .map((g) => {
        const category = g.categoryId
          ? categoryById.get(g.categoryId)
          : undefined;
        return {
          categoryId: g.categoryId ?? '',
          name: category?.name ?? 'Không xác định',
          color: category?.color ?? '#64748b',
          icon: category?.icon ?? null,
          amount: g._sum.amount ?? 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private async findBudgetsNearLimit(
    userId: string,
    monthKey: string,
    monthTransactions: MonthTransaction[],
  ): Promise<BudgetNearLimit[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, period: monthKey },
      include: { category: true },
    });

    if (budgets.length === 0) return [];

    const spentByCategory = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.type !== (TransactionType.EXPENSE as string) || !t.categoryId)
        continue;
      spentByCategory.set(
        t.categoryId,
        (spentByCategory.get(t.categoryId) ?? 0) + t.amount,
      );
    }

    return budgets
      .map((budget) => {
        const spent = spentByCategory.get(budget.categoryId) ?? 0;
        const usagePercent =
          budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        return {
          budgetId: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          limit: budget.limit,
          spent,
          usagePercent,
        };
      })
      .filter((b) => b.usagePercent >= BUDGET_ALERT_THRESHOLD_PERCENT)
      .sort((a, b) => b.usagePercent - a.usagePercent);
  }
}
