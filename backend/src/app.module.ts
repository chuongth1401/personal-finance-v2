import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FinancialAnalysisModule } from './financial-analysis/financial-analysis.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReportsModule } from './reports/reports.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransactionsModule,
    AccountsModule,
    CategoriesModule,
    DashboardModule,
    BudgetsModule,
    SavingsGoalsModule,
    ReportsModule,
    FinancialAnalysisModule,
    ReceiptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
