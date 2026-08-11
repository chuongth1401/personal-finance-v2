import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
import { QueryReportsMonthlyDto } from './dto/query-reports-monthly.dto';
import { QueryReportsYearlyDto } from './dto/query-reports-yearly.dto';
import { MonthlyReport, YearlyReport } from './interfaces/report.interface';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get('monthly')
  getMonthly(@Query() query: QueryReportsMonthlyDto): Promise<MonthlyReport> {
    return this.reportsService.getMonthlyReport(this.userId, query.month);
  }

  @Get('yearly')
  getYearly(@Query() query: QueryReportsYearlyDto): Promise<YearlyReport> {
    return this.reportsService.getYearlyReport(this.userId, query.year);
  }

  @Get('export/csv')
  async exportCsv(
    @Query() query: QueryReportsMonthlyDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.reportsService.exportMonthlyCsv(
      this.userId,
      query.month,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-giao-dich-${query.month}.csv"`,
    );
    res.send(csv);
  }
}
