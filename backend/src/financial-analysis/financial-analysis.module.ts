import { Module } from '@nestjs/common';

import { FinancialAnalysisController } from './financial-analysis.controller';
import { FinancialAnalysisService } from './financial-analysis.service';

@Module({
  controllers: [FinancialAnalysisController],
  providers: [FinancialAnalysisService],
})
export class FinancialAnalysisModule {}
