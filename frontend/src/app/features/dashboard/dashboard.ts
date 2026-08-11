import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucideCalendar,
  LucideChartPie,
  LucideDollarSign,
  LucidePiggyBank,
  LucideTriangleAlert,
  LucideWallet,
} from '@lucide/angular';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';

import { AccountsApiService } from '../../core/api/accounts-api.service';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { extractErrorMessage } from '../../core/api/http-error.util';
import { Account } from '../../core/api/models/account.model';
import { Category } from '../../core/api/models/category.model';
import { DashboardSummary } from '../../core/api/models/dashboard.model';
import { currentPeriodKey } from '../../core/utils/period';
import { formatVnd, formatVndCompact } from '../../core/utils/currency';
import { Badge } from '../../shared/badge/badge';
import { KpiCard } from '../../shared/kpi-card/kpi-card';

type TrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-dashboard',
  imports: [
    KpiCard,
    Badge,
    BaseChartDirective,
    LucideDollarSign,
    LucideWallet,
    LucidePiggyBank,
    LucideChartPie,
    LucideTriangleAlert,
    LucideArrowUpRight,
    LucideArrowDownRight,
    LucideCalendar,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly accountsApi = inject(AccountsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  protected readonly formatVnd = formatVnd;

  protected readonly selectedMonth = signal(currentPeriodKey());
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly accounts = signal<Account[]>([]);
  protected readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadSummary();
  }

  private loadReferenceData(): void {
    forkJoin([this.accountsApi.list(), this.categoriesApi.list()]).subscribe({
      next: ([accounts, categories]) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
      },
    });
  }

  protected loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardApi.getSummary(this.selectedMonth()).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedMonth.set(value);
    this.loadSummary();
  }

  protected accountName(accountId: string): string {
    return this.accounts().find((a) => a.id === accountId)?.name ?? '—';
  }

  protected categoryOf(categoryId: string | null): Category | undefined {
    if (!categoryId) return undefined;
    return this.categories().find((c) => c.id === categoryId);
  }

  protected readonly cashFlowChartData = computed<ChartData<'line'>>(() => {
    const cashFlow = this.summary()?.cashFlow ?? [];
    return {
      labels: cashFlow.map((d) => d.date.slice(8, 10)),
      datasets: [
        {
          label: 'Thu nhập',
          data: cashFlow.map((d) => d.income),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Chi tiêu',
          data: cashFlow.map((d) => d.expense),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 0,
        },
      ],
    };
  });

  protected readonly cashFlowChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
    },
    scales: {
      y: {
        ticks: { callback: (value) => formatVndCompact(Number(value)) },
        grid: { color: '#f1f5f9' },
      },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
    },
  };

  protected readonly categoryChartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.summary()?.categoryBreakdown ?? [];
    return {
      labels: items.map((i) => i.name),
      datasets: [
        {
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.color),
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly categoryChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12 } },
    },
  };

  /** higherIsBetter=true cho thu nhập (tăng là tốt), false cho chi tiêu (tăng là xấu). */
  protected trendDirection(percent: number | null, higherIsBetter: boolean): TrendDirection {
    if (percent === null || percent === 0) return 'neutral';
    const isIncrease = percent > 0;
    return isIncrease === higherIsBetter ? 'up' : 'down';
  }

  protected trendLabel(percent: number | null): string {
    if (percent === null) return 'Chưa có dữ liệu tháng trước để so sánh';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}% so với tháng trước`;
  }
}
