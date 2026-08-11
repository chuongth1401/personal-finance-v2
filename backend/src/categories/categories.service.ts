import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Category, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục: ${id}`);
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: {
          userId,
          name: dto.name,
          kind: dto.kind,
          color: dto.color,
          icon: dto.icon,
        },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findOne(userId, id);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          kind: dto.kind,
          color: dto.color,
          icon: dto.icon,
        },
      });
    } catch (error) {
      throw this.mapPrismaError(error, dto.name);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    const [transactionCount, budgetCount, recurringCount, insightCount] =
      await this.prisma.$transaction([
        this.prisma.transaction.count({ where: { categoryId: id } }),
        this.prisma.budget.count({ where: { categoryId: id } }),
        this.prisma.recurringTransaction.count({ where: { categoryId: id } }),
        this.prisma.financialInsight.count({ where: { categoryId: id } }),
      ]);

    if (transactionCount + budgetCount + recurringCount + insightCount > 0) {
      throw new ConflictException(
        'Không thể xoá danh mục đang có giao dịch, ngân sách hoặc dữ liệu liên quan.',
      );
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private mapPrismaError(error: unknown, name?: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(`Danh mục "${name}" đã tồn tại.`);
    }
    return error as Error;
  }
}
