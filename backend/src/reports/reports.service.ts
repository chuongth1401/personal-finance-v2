import { Injectable } from '@nestjs/common';

import { Transaction } from '../../generated/prisma/client';
import {
  calculatePercentChange,
  sumExpense,
  sumIncome,
  TypedAmount,
} from '../dashboard/dashboard.util';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import {
  CashFlowPoint,
  CategoryBreakdownItem,
  MonthlyReport,
  YearlyReport,
} from './interfaces/report.interface';
import {
  buildTransactionsCsv,
  formatMonthKey,
  monthRange,
  previousMonthKey,
  previousYearKey,
  TransactionForCsv,
  yearRange,
} from './reports.util';

const TOP_CATEGORIES_LIMIT = 5;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyReport(
    userId: string,
    month: string,
  ): Promise<MonthlyReport> {
    const { start, end } = monthRange(month);
    const previousPeriod = previousMonthKey(month);
    const { start: prevStart, end: prevEnd } = monthRange(previousPeriod);

    const [transactions, previousTransactions, categoryBreakdown] =
      await Promise.all([
        this.findTransactions(userId, start, end),
        this.findAmountsOnly(userId, prevStart, prevEnd),
        this.buildCategoryBreakdown(userId, start, end),
      ]);

    const totalIncome = sumIncome(transactions);
    const totalExpense = sumExpense(transactions);

    return {
      month,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      comparisonToPreviousPeriod: this.buildComparison(
        previousPeriod,
        totalIncome,
        totalExpense,
        previousTransactions,
      ),
      categoryBreakdown,
      topCategories: categoryBreakdown.slice(0, TOP_CATEGORIES_LIMIT),
      cashFlow: this.buildDailyCashFlow(start, end, transactions),
      transactions,
    };
  }

  async getYearlyReport(userId: string, year: string): Promise<YearlyReport> {
    const { start, end } = yearRange(year);
    const previousPeriod = previousYearKey(year);
    const { start: prevStart, end: prevEnd } = yearRange(previousPeriod);

    const [transactions, previousTransactions, categoryBreakdown] =
      await Promise.all([
        this.findTransactions(userId, start, end),
        this.findAmountsOnly(userId, prevStart, prevEnd),
        this.buildCategoryBreakdown(userId, start, end),
      ]);

    const totalIncome = sumIncome(transactions);
    const totalExpense = sumExpense(transactions);

    return {
      year,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      comparisonToPreviousPeriod: this.buildComparison(
        previousPeriod,
        totalIncome,
        totalExpense,
        previousTransactions,
      ),
      categoryBreakdown,
      topCategories: categoryBreakdown.slice(0, TOP_CATEGORIES_LIMIT),
      cashFlow: this.buildMonthlyCashFlow(start, end, transactions),
      transactions,
    };
  }

  async exportMonthlyCsv(userId: string, month: string): Promise<string> {
    const { start, end } = monthRange(month);
    const transactions: TransactionForCsv[] =
      await this.prisma.transaction.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: { date: 'asc' },
        include: { category: true, account: true, toAccount: true },
      });
    return buildTransactionsCsv(transactions);
  }

  private buildComparison(
    previousPeriod: string,
    totalIncome: number,
    totalExpense: number,
    previousTransactions: TypedAmount[],
  ): MonthlyReport['comparisonToPreviousPeriod'] {
    return {
      previousPeriod,
      incomeChangePercent: calculatePercentChange(
        totalIncome,
        sumIncome(previousTransactions),
      ),
      expenseChangePercent: calculatePercentChange(
        totalExpense,
        sumExpense(previousTransactions),
      ),
    };
  }

  private findTransactions(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    });
  }

  private findAmountsOnly(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<TypedAmount[]> {
    return this.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true },
    });
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

  private buildDailyCashFlow(
    start: Date,
    end: Date,
    transactions: (TypedAmount & { date: Date })[],
  ): CashFlowPoint[] {
    return this.buildCashFlow(
      start,
      end,
      transactions,
      (date) => date.toISOString().slice(0, 10),
      (cursor) => cursor.setDate(cursor.getDate() + 1),
    );
  }

  private buildMonthlyCashFlow(
    start: Date,
    end: Date,
    transactions: (TypedAmount & { date: Date })[],
  ): CashFlowPoint[] {
    return this.buildCashFlow(
      start,
      end,
      transactions,
      formatMonthKey,
      (cursor) => cursor.setMonth(cursor.getMonth() + 1),
    );
  }

  private buildCashFlow(
    start: Date,
    end: Date,
    transactions: (TypedAmount & { date: Date })[],
    keyOf: (date: Date) => string,
    advance: (cursor: Date) => void,
  ): CashFlowPoint[] {
    const byPeriod = new Map<string, CashFlowPoint>();

    for (const cursor = new Date(start); cursor < end; advance(cursor)) {
      const key = keyOf(cursor);
      byPeriod.set(key, { period: key, income: 0, expense: 0 });
    }

    for (const t of transactions) {
      const point = byPeriod.get(keyOf(t.date));
      if (!point) continue;
      if (t.type === (TransactionType.INCOME as string))
        point.income += t.amount;
      else if (t.type === (TransactionType.EXPENSE as string))
        point.expense += t.amount;
    }

    return [...byPeriod.values()];
  }
}
