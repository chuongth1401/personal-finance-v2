import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import {
  SavingsGoalResponse,
  SavingsGoalWithProgress,
} from './interfaces/savings-goal-response.interface';
import { SavingsGoalsService } from './savings-goals.service';

@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get()
  findAll(@CurrentUser() userId: string): Promise<SavingsGoalWithProgress[]> {
    return this.savingsGoalsService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateSavingsGoalDto,
  ): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavingsGoalDto,
  ): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.savingsGoalsService.remove(userId, id);
  }
}
