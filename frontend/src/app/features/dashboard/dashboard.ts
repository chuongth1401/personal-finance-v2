import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucideChartPie,
  LucideDollarSign,
  LucidePiggyBank,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideTriangleAlert,
} from '@lucide/angular';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { MockDataService } from '../../core/services/mock-data.service';
import { formatVnd, formatVndCompact } from '../../core/utils/currency';
import { Badge } from '../../shared/badge/badge';
import { KpiCard } from '../../shared/kpi-card/kpi-card';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    KpiCard,
    Badge,
    BaseChartDirective,
    LucideDollarSign,
    LucideTrendingUp,
    LucideTrendingDown,
    LucidePiggyBank,
    LucideChartPie,
    LucideTriangleAlert,
    LucideArrowUpRight,
    LucideArrowDownRight,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly data = inject(MockDataService);

  protected readonly formatVnd = formatVnd;

  protected readonly balanceLabel = computed(() => formatVnd(this.data.totalBalance()));
  protected readonly incomeLabel = computed(() => formatVnd(this.data.monthlyIncome()));
  protected readonly expenseLabel = computed(() => formatVnd(this.data.monthlyExpense()));
  protected readonly savingsRateLabel = computed(() => `${this.data.savingsRate()}%`);

  protected readonly cashFlowChartData = computed<ChartData<'line'>>(() => {
    const series = this.data.cashFlowSeries();
    return {
      labels: series.map((s) => s.label),
      datasets: [
        {
          label: 'Thu nhập',
          data: series.map((s) => s.income),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
        {
          label: 'Chi tiêu',
          data: series.map((s) => s.expense),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
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
      x: { grid: { display: false } },
    },
  };

  protected readonly categoryChartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.data.categoryBreakdown();
    return {
      labels: items.map((i) => i.category.name),
      datasets: [
        {
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.category.color),
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
