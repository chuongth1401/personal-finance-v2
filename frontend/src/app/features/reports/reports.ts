import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucideCalendar,
  LucideChartPie,
  LucideDownload,
  LucidePiggyBank,
  LucideWallet,
} from '@lucide/angular';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Observable } from 'rxjs';

import { extractErrorMessage } from '../../core/api/http-error.util';
import { CashFlowPoint, MonthlyReport, YearlyReport } from '../../core/api/models/report.model';
import { ReportsApiService } from '../../core/api/reports-api.service';
import { formatVnd, formatVndCompact } from '../../core/utils/currency';
import { currentPeriodKey } from '../../core/utils/period';
import { KpiCard } from '../../shared/kpi-card/kpi-card';

type ReportMode = 'monthly' | 'yearly';
type TrendDirection = 'up' | 'down' | 'neutral';
type Report = MonthlyReport | YearlyReport;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - 4 + i));

function cashFlowLabel(mode: ReportMode, point: CashFlowPoint): string {
  if (mode === 'monthly') return point.period.slice(8, 10);
  return `Th ${Number(point.period.slice(5, 7))}`;
}

@Component({
  selector: 'app-reports',
  imports: [
    KpiCard,
    BaseChartDirective,
    LucideWallet,
    LucideArrowUpRight,
    LucideArrowDownRight,
    LucidePiggyBank,
    LucideChartPie,
    LucideCalendar,
    LucideDownload,
  ],
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);

  protected readonly formatVnd = formatVnd;
  protected readonly yearOptions = YEAR_OPTIONS;

  protected readonly mode = signal<ReportMode>('monthly');
  protected readonly selectedMonth = signal(currentPeriodKey());
  protected readonly selectedYear = signal(String(CURRENT_YEAR));

  protected readonly report = signal<Report | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly isEmpty = computed(() => {
    const r = this.report();
    return (
      r !== null && r.totalIncome === 0 && r.totalExpense === 0 && r.categoryBreakdown.length === 0
    );
  });

  protected readonly csvExportUrl = computed(() =>
    this.reportsApi.exportCsvUrl(this.selectedMonth()),
  );

  ngOnInit(): void {
    this.loadReport();
  }

  protected loadReport(): void {
    this.loading.set(true);
    this.error.set(null);

    const request$: Observable<Report> =
      this.mode() === 'monthly'
        ? this.reportsApi.getMonthly(this.selectedMonth())
        : this.reportsApi.getYearly(this.selectedYear());

    request$.subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected setMode(mode: ReportMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.loadReport();
  }

  protected onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedMonth.set(value);
    this.loadReport();
  }

  protected onYearChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedYear.set(value);
    this.loadReport();
  }

  protected trendDirection(percent: number | null, higherIsBetter: boolean): TrendDirection {
    if (percent === null || percent === 0) return 'neutral';
    const isIncrease = percent > 0;
    return isIncrease === higherIsBetter ? 'up' : 'down';
  }

  protected trendLabel(percent: number | null): string {
    if (percent === null) return 'Chưa có dữ liệu kỳ trước để so sánh';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}% so với kỳ trước`;
  }

  protected topCategoryBarWidth(amount: number): number {
    const top = this.report()?.topCategories[0]?.amount ?? 0;
    if (top <= 0) return 0;
    return (amount / top) * 100;
  }

  protected categoryPercentOfExpense(amount: number): number {
    const totalExpense = this.report()?.totalExpense ?? 0;
    if (totalExpense <= 0) return 0;
    return (amount / totalExpense) * 100;
  }

  protected readonly cashFlowChartData = computed<ChartData<'line'>>(() => {
    const report = this.report();
    const mode = this.mode();
    const cashFlow = report?.cashFlow ?? [];
    return {
      labels: cashFlow.map((p) => cashFlowLabel(mode, p)),
      datasets: [
        {
          label: 'Thu nhập',
          data: cashFlow.map((p) => p.income),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: mode === 'yearly' ? 3 : 0,
        },
        {
          label: 'Chi tiêu',
          data: cashFlow.map((p) => p.expense),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: mode === 'yearly' ? 3 : 0,
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
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
    },
  };

  protected readonly categoryChartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.report()?.categoryBreakdown ?? [];
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
}
