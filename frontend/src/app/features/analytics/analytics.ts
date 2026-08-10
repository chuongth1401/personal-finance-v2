import { Component, computed, inject } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { MockDataService } from '../../core/services/mock-data.service';
import { formatVnd, formatVndCompact } from '../../core/utils/currency';

@Component({
  selector: 'app-analytics',
  imports: [BaseChartDirective],
  templateUrl: './analytics.html',
})
export class Analytics {
  protected readonly data = inject(MockDataService);
  protected readonly formatVnd = formatVnd;

  protected readonly totalExpense = computed(() =>
    this.data.categoryBreakdown().reduce((sum, i) => sum + i.amount, 0),
  );

  protected readonly categoryBarData = computed<ChartData<'bar'>>(() => {
    const items = this.data.categoryBreakdown();
    return {
      labels: items.map((i) => i.category.name),
      datasets: [
        {
          label: 'Chi tiêu',
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.category.color),
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    };
  });

  protected readonly categoryBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { callback: (value) => formatVndCompact(Number(value)) },
        grid: { color: '#f1f5f9' },
      },
      y: { grid: { display: false } },
    },
  };

  protected shareOf(amount: number): number {
    const total = this.totalExpense();
    return total > 0 ? (amount / total) * 100 : 0;
  }
}
