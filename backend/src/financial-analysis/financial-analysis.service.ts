import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialInsight } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { InsightSeverity } from './enums/insight-severity.enum';
import { InsightType } from './enums/insight-type.enum';
import {
  anomalySeverity,
  detectAnomalousTransactions,
  evaluateBudgetRisk,
  findRecurringCandidates,
  forecastMonthEndSpending,
} from './financial-analysis.util';
import { InsightResponse } from './interfaces/insight.interface';

/** Số tháng lịch sử dùng làm nền so sánh cho phát hiện bất thường/định kỳ. */
const HISTORY_LOOKBACK_MONTHS = 6;
/** Giới hạn số insight ANOMALY sinh ra mỗi lần chạy, tránh spam khi có quá nhiều giao dịch lệch. */
const MAX_ANOMALY_INSIGHTS = 5;

const ANALYSIS_INSIGHT_TYPES = [
  InsightType.ANOMALY,
  InsightType.RECURRING_CANDIDATE,
  InsightType.BUDGET_RISK,
  InsightType.FORECAST,
];

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
}

interface InsightDraft {
  categoryId: string | null;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  relatedTransactionIds: string[];
}

@Injectable()
export class FinancialAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chạy toàn bộ 4 thuật toán cho một tháng, thay thế các insight phân tích
   * cũ của cùng kỳ (idempotent - chạy lại nhiều lần không bị tích luỹ trùng).
   * Chỉ đọc Transaction/Budget/Category, không tạo/sửa giao dịch nào.
   */
  async runAnalysis(userId: string, month: string): Promise<InsightResponse[]> {
    const { start: monthStart, end: monthEnd } = this.monthRange(month);
    const historyStart = new Date(monthStart);
    historyStart.setMonth(historyStart.getMonth() - HISTORY_LOOKBACK_MONTHS);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: historyStart, lt: monthEnd } },
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        description: true,
        categoryId: true,
      },
      orderBy: { date: 'asc' },
    });

    const currentMonthTx = transactions.filter(
      (t) => t.date >= monthStart && t.date < monthEnd,
    );
    const historicalTx = transactions.filter((t) => t.date < monthStart);
    const asOf = this.resolveAsOf(monthStart, monthEnd);

    const drafts: InsightDraft[] = [
      ...(await this.buildAnomalyInsights(currentMonthTx, historicalTx)),
      ...this.buildRecurringInsights(transactions),
      this.buildForecastInsight(
        month,
        currentMonthTx,
        monthStart,
        monthEnd,
        asOf,
      ),
      ...(await this.buildBudgetRiskInsights(
        userId,
        month,
        currentMonthTx,
        monthStart,
        monthEnd,
        asOf,
      )),
    ];

    await this.prisma.financialInsight.deleteMany({
      where: {
        userId,
        periodStart: monthStart,
        periodEnd: monthEnd,
        type: { in: ANALYSIS_INSIGHT_TYPES },
      },
    });

    const created = await this.prisma.$transaction(
      drafts.map((draft) =>
        this.prisma.financialInsight.create({
          data: {
            userId,
            categoryId: draft.categoryId,
            type: draft.type,
            severity: draft.severity,
            title: draft.title,
            description: draft.description,
            relatedTransactionIds: JSON.stringify(draft.relatedTransactionIds),
            periodStart: monthStart,
            periodEnd: monthEnd,
          },
        }),
      ),
    );

    return created.map((insight) => this.toResponse(insight));
  }

  async findInsights(
    userId: string,
    month?: string,
  ): Promise<InsightResponse[]> {
    const range = month ? this.monthRange(month) : null;
    const insights = await this.prisma.financialInsight.findMany({
      where: {
        userId,
        ...(range && { periodStart: range.start, periodEnd: range.end }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return insights.map((insight) => this.toResponse(insight));
  }

  async markAsRead(userId: string, id: string): Promise<InsightResponse> {
    await this.findOwned(userId, id);
    const updated = await this.prisma.financialInsight.update({
      where: { id },
      data: { isRead: true },
    });
    return this.toResponse(updated);
  }

  /** "Ẩn" insight - xoá hẳn khỏi danh sách. Lần chạy phân tích tiếp theo có thể sinh lại nếu vẫn còn đúng. */
  async hideInsight(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.financialInsight.delete({ where: { id } });
  }

  private async findOwned(
    userId: string,
    id: string,
  ): Promise<FinancialInsight> {
    const insight = await this.prisma.financialInsight.findFirst({
      where: { id, userId },
    });
    if (!insight) {
      throw new NotFoundException(`Không tìm thấy insight: ${id}`);
    }
    return insight;
  }

  private async buildAnomalyInsights(
    currentMonthTx: TransactionRow[],
    historicalTx: TransactionRow[],
  ): Promise<InsightDraft[]> {
    const historyByCategory = new Map<string, number[]>();
    for (const t of historicalTx) {
      if (t.type !== (TransactionType.EXPENSE as string) || !t.categoryId)
        continue;
      const list = historyByCategory.get(t.categoryId) ?? [];
      list.push(t.amount);
      historyByCategory.set(t.categoryId, list);
    }

    const candidates = currentMonthTx.filter(
      (t) => t.type === (TransactionType.EXPENSE as string),
    );
    const anomalies = detectAnomalousTransactions(
      candidates,
      historyByCategory,
    ).slice(0, MAX_ANOMALY_INSIGHTS);
    if (anomalies.length === 0) return [];

    const categoryIds = [...new Set(anomalies.map((a) => a.categoryId))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    return anomalies.map((a) => {
      const categoryName =
        categoryNameById.get(a.categoryId) ?? 'Không xác định';
      const ratio = a.categoryMean > 0 ? a.amount / a.categoryMean : null;
      const description =
        ratio === null
          ? `Giao dịch ${formatVnd(a.amount)} cao bất thường so với mức bạn thường chi cho danh mục "${categoryName}" (trung bình ${formatVnd(a.categoryMean)}).`
          : `Giao dịch ${formatVnd(a.amount)} cao hơn nhiều so với mức bạn thường chi cho danh mục "${categoryName}" (trung bình ${formatVnd(a.categoryMean)}) - gấp khoảng ${ratio.toFixed(1)} lần.`;

      return {
        categoryId: a.categoryId,
        type: InsightType.ANOMALY,
        severity: anomalySeverity(a.zScore),
        title: `Giao dịch bất thường trong danh mục "${categoryName}"`,
        description,
        relatedTransactionIds: [a.transactionId],
      };
    });
  }

  private buildRecurringInsights(
    transactions: TransactionRow[],
  ): InsightDraft[] {
    const pool = transactions.filter(
      (t) => t.type !== (TransactionType.TRANSFER as string),
    );
    const groups = findRecurringCandidates(pool);

    return groups.map((g) => ({
      categoryId: null,
      type: InsightType.RECURRING_CANDIDATE,
      severity: InsightSeverity.INFO,
      title: `Có thể là khoản định kỳ: "${g.description}"`,
      description: `Phát hiện ${g.occurrenceCount} giao dịch tương tự "${g.description}" với số tiền trung bình ${formatVnd(g.averageAmount)}, lặp lại khoảng mỗi ${Math.round(g.averageIntervalDays)} ngày.`,
      relatedTransactionIds: g.transactionIds,
    }));
  }

  private buildForecastInsight(
    month: string,
    currentMonthTx: TransactionRow[],
    monthStart: Date,
    monthEnd: Date,
    asOf: Date,
  ): InsightDraft {
    const expenseTx = currentMonthTx.filter(
      (t) => t.type === (TransactionType.EXPENSE as string),
    );
    const spentSoFar = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const forecast = forecastMonthEndSpending(
      spentSoFar,
      monthStart,
      monthEnd,
      asOf,
    );

    return {
      categoryId: null,
      type: InsightType.FORECAST,
      severity: InsightSeverity.INFO,
      title: `Dự báo chi tiêu tháng ${month}`,
      description: `Trung bình chi ${formatVnd(Math.round(forecast.dailyAverage))}/ngày trong ${forecast.daysElapsed}/${forecast.totalDaysInMonth} ngày đã qua. Dự kiến tổng chi tiêu đến cuối tháng khoảng ${formatVnd(Math.round(forecast.projectedTotal))}.`,
      relatedTransactionIds: expenseTx.map((t) => t.id),
    };
  }

  private async buildBudgetRiskInsights(
    userId: string,
    month: string,
    currentMonthTx: TransactionRow[],
    monthStart: Date,
    monthEnd: Date,
    asOf: Date,
  ): Promise<InsightDraft[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, period: month },
      include: { category: true },
    });
    if (budgets.length === 0) return [];

    const drafts: InsightDraft[] = [];
    for (const budget of budgets) {
      const categoryTx = currentMonthTx.filter(
        (t) =>
          t.type === (TransactionType.EXPENSE as string) &&
          t.categoryId === budget.categoryId,
      );
      const categorySpent = categoryTx.reduce((sum, t) => sum + t.amount, 0);
      const forecast = forecastMonthEndSpending(
        categorySpent,
        monthStart,
        monthEnd,
        asOf,
      );
      const risk = evaluateBudgetRisk(forecast.projectedTotal, budget.limit);
      if (risk === 'NONE') continue;

      drafts.push({
        categoryId: budget.categoryId,
        type: InsightType.BUDGET_RISK,
        severity:
          risk === 'CRITICAL'
            ? InsightSeverity.CRITICAL
            : InsightSeverity.WARNING,
        title: `Có nguy cơ vượt ngân sách danh mục "${budget.category.name}"`,
        description: `Dự kiến chi ${formatVnd(Math.round(forecast.projectedTotal))} đến cuối tháng, vượt hạn mức ${formatVnd(budget.limit)} (đã chi ${formatVnd(categorySpent)} trong ${forecast.daysElapsed}/${forecast.totalDaysInMonth} ngày).`,
        relatedTransactionIds: categoryTx.map((t) => t.id),
      });
    }
    return drafts;
  }

  /**
   * Nếu tháng đang xét là tháng hiện tại thì dùng ngày hôm nay; nếu là tháng
   * đã qua thì coi như đã có đủ dữ liệu cả tháng; nếu là tháng tương lai thì
   * dùng đầu tháng (forecastMonthEndSpending sẽ tự kẹp daysElapsed >= 1).
   */
  private resolveAsOf(monthStart: Date, monthEnd: Date): Date {
    const now = new Date();
    if (now >= monthStart && now < monthEnd) return now;
    if (now >= monthEnd) return new Date(monthEnd.getTime() - 1);
    return monthStart;
  }

  private monthRange(month: string): { start: Date; end: Date } {
    const [year, monthNumber] = month.split('-').map(Number);
    return {
      start: new Date(year, monthNumber - 1, 1),
      end: new Date(year, monthNumber, 1),
    };
  }

  private toResponse(insight: FinancialInsight): InsightResponse {
    return {
      id: insight.id,
      userId: insight.userId,
      categoryId: insight.categoryId,
      type: insight.type as InsightType,
      severity: insight.severity as InsightSeverity,
      title: insight.title,
      description: insight.description,
      relatedTransactionIds: JSON.parse(
        insight.relatedTransactionIds,
      ) as string[],
      periodStart: insight.periodStart,
      periodEnd: insight.periodEnd,
      isRead: insight.isRead,
      createdAt: insight.createdAt,
    };
  }
}

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  categoryId: string | null;
}
