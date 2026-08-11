import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryReportsMonthlyDto } from './dto/query-reports-monthly.dto';
import { QueryReportsYearlyDto } from './dto/query-reports-yearly.dto';
import { MonthlyReport, YearlyReport } from './interfaces/report.interface';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  getMonthly(
    @CurrentUser() userId: string,
    @Query() query: QueryReportsMonthlyDto,
  ): Promise<MonthlyReport> {
    return this.reportsService.getMonthlyReport(userId, query.month);
  }

  @Get('yearly')
  getYearly(
    @CurrentUser() userId: string,
    @Query() query: QueryReportsYearlyDto,
  ): Promise<YearlyReport> {
    return this.reportsService.getYearlyReport(userId, query.year);
  }

  @Get('export/csv')
  async exportCsv(
    @CurrentUser() userId: string,
    @Query() query: QueryReportsMonthlyDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.reportsService.exportMonthlyCsv(userId, query.month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-giao-dich-${query.month}.csv"`,
    );
    res.send(csv);
  }
}
