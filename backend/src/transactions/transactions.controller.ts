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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  TransactionsService,
  PaginatedTransactions,
} from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get()
  findAll(@Query() query: QueryTransactionDto): Promise<PaginatedTransactions> {
    return this.transactionsService.findAll(this.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(this.userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(this.userId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(this.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.transactionsService.remove(this.userId, id);
  }
}
