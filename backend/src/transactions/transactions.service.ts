import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Transaction } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';

export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedTransactions> {
    const { dateFrom, dateTo, type, accountId, categoryId, page, pageSize } =
      query;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(type && { type }),
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...((dateFrom || dateTo) && {
        date: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch: ${id}`);
    }
    return transaction;
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    await this.assertAccountOwnership(userId, dto.accountId);

    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.toAccountId) {
        throw new BadRequestException('Giao dịch TRANSFER cần có toAccountId.');
      }
      if (dto.toAccountId === dto.accountId) {
        throw new BadRequestException('toAccountId phải khác accountId.');
      }
      await this.assertAccountOwnership(userId, dto.toAccountId);
    } else if (dto.toAccountId) {
      throw new BadRequestException(
        'toAccountId chỉ dùng cho giao dịch TRANSFER.',
      );
    }

    if (dto.categoryId) {
      await this.assertCategoryOwnership(userId, dto.categoryId);
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        toAccountId: dto.toAccountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        date: dto.date,
        description: dto.description,
        note: dto.note,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const existing = await this.findOne(userId, id);

    const nextType = dto.type ?? (existing.type as TransactionType);
    const nextAccountId = dto.accountId ?? existing.accountId;
    const nextToAccountId =
      dto.toAccountId !== undefined ? dto.toAccountId : existing.toAccountId;
    const nextCategoryId =
      dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;

    if (dto.accountId) {
      await this.assertAccountOwnership(userId, dto.accountId);
    }

    if (nextType === TransactionType.TRANSFER) {
      if (!nextToAccountId) {
        throw new BadRequestException('Giao dịch TRANSFER cần có toAccountId.');
      }
      if (nextToAccountId === nextAccountId) {
        throw new BadRequestException('toAccountId phải khác accountId.');
      }
      await this.assertAccountOwnership(userId, nextToAccountId);
    } else if (nextToAccountId) {
      throw new BadRequestException(
        'toAccountId chỉ dùng cho giao dịch TRANSFER.',
      );
    }

    if (nextCategoryId) {
      await this.assertCategoryOwnership(userId, nextCategoryId);
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        accountId: dto.accountId,
        toAccountId: dto.toAccountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        date: dto.date,
        description: dto.description,
        note: dto.note,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
  }

  private async assertAccountOwnership(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new BadRequestException(
        `Tài khoản không tồn tại hoặc không thuộc về bạn: ${accountId}`,
      );
    }
  }

  private async assertCategoryOwnership(
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
  }
}
