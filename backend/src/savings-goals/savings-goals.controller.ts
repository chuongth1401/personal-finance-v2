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

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
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

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get()
  findAll(): Promise<SavingsGoalWithProgress[]> {
    return this.savingsGoalsService.findAll(this.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSavingsGoalDto): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.create(this.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSavingsGoalDto,
  ): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.update(this.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.savingsGoalsService.remove(this.userId, id);
  }
}
