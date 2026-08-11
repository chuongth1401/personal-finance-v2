import { Controller, Get, Query } from '@nestjs/common';

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
import { DashboardService } from './dashboard.service';
import { QueryDashboardSummaryDto } from './dto/query-dashboard-summary.dto';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get('summary')
  getSummary(
    @Query() query: QueryDashboardSummaryDto,
  ): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(this.userId, query.month);
  }
}
