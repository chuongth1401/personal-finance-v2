import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Budget, Category, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetStatus } from './enums/budget-status.enum';
import {
  BudgetResponse,
  BudgetWithUsage,
} from './interfaces/budget-response.interface';

/** Ngân sách chuyển sang WARNING khi đã dùng từ 80% hạn mức trở lên. */
const WARNING_THRESHOLD_PERCENT = 80;

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: QueryBudgetDto,
  ): Promise<BudgetWithUsage[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, period: query.month },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });

    if (budgets.length === 0) return [];

    const { start, end } = this.monthRange(query.month);
    const categoryIds = budgets.map((b) => b.categoryId);
    const spentByCategory = await this.sumExpenseByCategory(
      userId,
      categoryIds,
      start,
      end,
    );

    return budgets.map((budget) =>
      this.toBudgetWithUsage(
        budget,
        spentByCategory.get(budget.categoryId) ?? 0,
      ),
    );
  }

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetResponse> {
    await this.assertExpenseCategory(userId, dto.categoryId);

    try {
      const budget = await this.prisma.budget.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          period: dto.month,
          limit: dto.limitAmount,
        },
      });
      return this.toBudgetResponse(budget);
    } catch (error) {
      throw this.mapConflict(error, dto.month);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponse> {
    const existing = await this.findOwned(userId, id);

    if (dto.categoryId) {
      await this.assertExpenseCategory(userId, dto.categoryId);
    }

    try {
      const budget = await this.prisma.budget.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          period: dto.month,
          limit: dto.limitAmount,
        },
      });
      return this.toBudgetResponse(budget);
    } catch (error) {
      throw this.mapConflict(error, dto.month ?? existing.period);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.budget.delete({ where: { id } });
  }

  private async findOwned(userId: string, id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });
    if (!budget) {
      throw new NotFoundException(`Không tìm thấy ngân sách: ${id}`);
    }
    return budget;
  }

  private async assertExpenseCategory(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new BadRequestException(
        `Danh mục không tồn tại hoặc không thuộc về bạn: ${categoryId}`,
      );
    }
    if (category.kind !== 'EXPENSE') {
      throw new BadRequestException(
        `Ngân sách chỉ áp dụng cho danh mục chi tiêu, "${category.name}" là danh mục thu nhập.`,
      );
    }
  }

  private monthRange(month: string): { start: Date; end: Date } {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(year, monthNumber - 1, 1);
    const end = new Date(year, monthNumber, 1);
    return { start, end };
  }

  private async sumExpenseByCategory(
    userId: string,
    categoryIds: string[],
    start: Date,
    end: Date,
  ): Promise<Map<string, number>> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        categoryId: { in: categoryIds },
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const spentByCategory = new Map<string, number>();
    for (const g of grouped) {
      if (g.categoryId) spentByCategory.set(g.categoryId, g._sum.amount ?? 0);
    }
    return spentByCategory;
  }

  private toBudgetResponse(budget: Budget): BudgetResponse {
    return {
      id: budget.id,
      userId: budget.userId,
      categoryId: budget.categoryId,
      month: budget.period,
      limitAmount: budget.limit,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }

  private toBudgetWithUsage(
    budget: Budget & { category: Category },
    spentAmount: number,
  ): BudgetWithUsage {
    const percentageUsed =
      budget.limit > 0 ? (spentAmount / budget.limit) * 100 : 0;
    return {
      ...this.toBudgetResponse(budget),
      categoryName: budget.category.name,
      categoryColor: budget.category.color,
      spentAmount,
      remainingAmount: budget.limit - spentAmount,
      percentageUsed,
      status: this.resolveStatus(percentageUsed),
    };
  }

  private resolveStatus(percentageUsed: number): BudgetStatus {
    if (percentageUsed >= 100) return BudgetStatus.EXCEEDED;
    if (percentageUsed >= WARNING_THRESHOLD_PERCENT)
      return BudgetStatus.WARNING;
    return BudgetStatus.NORMAL;
  }

  private mapConflict(error: unknown, month: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `Đã tồn tại ngân sách cho danh mục này trong tháng ${month}.`,
      );
    }
    return error as Error;
  }
}
