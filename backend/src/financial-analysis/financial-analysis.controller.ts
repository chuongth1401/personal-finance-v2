import {
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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryInsightsDto } from './dto/query-insights.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';
import { FinancialAnalysisService } from './financial-analysis.service';
import { InsightResponse } from './interfaces/insight.interface';

@Controller('financial-analysis')
export class FinancialAnalysisController {
  constructor(
    private readonly financialAnalysisService: FinancialAnalysisService,
  ) {}

  /** Chạy phân tích cho một tháng (quy tắc thuần, không gọi AI) và lưu lại kết quả. */
  @Post('run')
  run(
    @CurrentUser() userId: string,
    @Query() query: RunAnalysisDto,
  ): Promise<InsightResponse[]> {
    return this.financialAnalysisService.runAnalysis(userId, query.month);
  }

  /** Danh sách insight đã lưu; bỏ trống `month` để xem toàn bộ. */
  @Get('insights')
  findInsights(
    @CurrentUser() userId: string,
    @Query() query: QueryInsightsDto,
  ): Promise<InsightResponse[]> {
    return this.financialAnalysisService.findInsights(userId, query.month);
  }

  @Patch('insights/:id/read')
  markAsRead(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<InsightResponse> {
    return this.financialAnalysisService.markAsRead(userId, id);
  }

  /** Ẩn insight khỏi danh sách. */
  @Delete('insights/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  hide(@CurrentUser() userId: string, @Param('id') id: string): Promise<void> {
    return this.financialAnalysisService.hideInsight(userId, id);
  }
}
