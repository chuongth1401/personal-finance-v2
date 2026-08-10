import { Component, computed, inject } from '@angular/core';
import { LucideDownload } from '@lucide/angular';

import { MockDataService } from '../../core/services/mock-data.service';
import { formatVnd } from '../../core/utils/currency';

@Component({
  selector: 'app-reports',
  imports: [LucideDownload],
  templateUrl: './reports.html',
})
export class Reports {
  protected readonly data = inject(MockDataService);
  protected readonly formatVnd = formatVnd;

  protected readonly monthlySummary = computed(() =>
    this.data.cashFlowSeries().map((point) => ({
      ...point,
      net: point.income - point.expense,
    })),
  );
}
