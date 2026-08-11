import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Account } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException(`Không tìm thấy tài khoản: ${id}`);
    }
    return account;
  }

  create(userId: string, dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<Account> {
    await this.findOne(userId, id);
    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    const [transactionCount, recurringCount] = await this.prisma.$transaction([
      this.prisma.transaction.count({
        where: { OR: [{ accountId: id }, { toAccountId: id }] },
      }),
      this.prisma.recurringTransaction.count({ where: { accountId: id } }),
    ]);

    if (transactionCount > 0 || recurringCount > 0) {
      throw new ConflictException(
        'Không thể xoá tài khoản đang có giao dịch hoặc giao dịch định kỳ liên quan.',
      );
    }

    await this.prisma.account.delete({ where: { id } });
  }
}
