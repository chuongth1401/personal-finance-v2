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
  Query,
} from '@nestjs/common';

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import {
  BudgetResponse,
  BudgetWithUsage,
} from './interfaces/budget-response.interface';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get()
  findAll(@Query() query: QueryBudgetDto): Promise<BudgetWithUsage[]> {
    return this.budgetsService.findAll(this.userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBudgetDto): Promise<BudgetResponse> {
    return this.budgetsService.create(this.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponse> {
    return this.budgetsService.update(this.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.budgetsService.remove(this.userId, id);
  }
}
