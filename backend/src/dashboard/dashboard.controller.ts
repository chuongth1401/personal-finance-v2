import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { QueryDashboardSummaryDto } from './dto/query-dashboard-summary.dto';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() userId: string,
    @Query() query: QueryDashboardSummaryDto,
  ): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(userId, query.month);
  }
}
