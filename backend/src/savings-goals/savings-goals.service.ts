import { Injectable, NotFoundException } from '@nestjs/common';

import { SavingsGoal } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { GoalStatus } from './enums/goal-status.enum';
import {
  SavingsGoalResponse,
  SavingsGoalWithProgress,
} from './interfaces/savings-goal-response.interface';
import {
  calculateMonthlyContributionNeeded,
  calculateProgressPercentage,
  calculateProjectedCompletionDate,
} from './savings-goals.util';

@Injectable()
export class SavingsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<SavingsGoalWithProgress[]> {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return goals.map((goal) => this.toWithProgress(goal, now));
  }

  async create(
    userId: string,
    dto: CreateSavingsGoalDto,
  ): Promise<SavingsGoalResponse> {
    const goal = await this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? 0,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        icon: dto.icon,
        color: dto.color,
        status: dto.status ?? GoalStatus.ACTIVE,
      },
    });
    return this.toResponse(goal);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSavingsGoalDto,
  ): Promise<SavingsGoalResponse> {
    await this.findOwned(userId, id);

    const goal = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount,
        targetDate:
          dto.targetDate === undefined
            ? undefined
            : dto.targetDate
              ? new Date(dto.targetDate)
              : null,
        icon: dto.icon,
        color: dto.color,
        status: dto.status,
      },
    });
    return this.toResponse(goal);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.savingsGoal.delete({ where: { id } });
  }

  private async findOwned(userId: string, id: string): Promise<SavingsGoal> {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException(`Không tìm thấy mục tiêu tiết kiệm: ${id}`);
    }
    return goal;
  }

  private toResponse(goal: SavingsGoal): SavingsGoalResponse {
    return {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      icon: goal.icon,
      color: goal.color,
      status: goal.status as GoalStatus,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }

  private toWithProgress(
    goal: SavingsGoal,
    now: Date,
  ): SavingsGoalWithProgress {
    return {
      ...this.toResponse(goal),
      progressPercentage: calculateProgressPercentage(
        goal.currentAmount,
        goal.targetAmount,
      ),
      monthlyContributionNeeded: calculateMonthlyContributionNeeded(
        goal.currentAmount,
        goal.targetAmount,
        goal.targetDate,
        now,
      ),
      projectedCompletionDate: calculateProjectedCompletionDate(
        goal.currentAmount,
        goal.targetAmount,
        goal.createdAt,
        now,
      ),
    };
  }
}
