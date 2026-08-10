import { Component, inject } from '@angular/core';
import { LucideTriangleAlert } from '@lucide/angular';

import { MockDataService } from '../../core/services/mock-data.service';
import { formatVnd } from '../../core/utils/currency';

@Component({
  selector: 'app-budgets',
  imports: [LucideTriangleAlert],
  templateUrl: './budgets.html',
})
export class Budgets {
  protected readonly data = inject(MockDataService);
  protected readonly formatVnd = formatVnd;

  protected barClass(ratio: number): string {
    if (ratio >= 1) return 'bg-rose-500';
    if (ratio >= 0.8) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  protected percentClass(ratio: number): string {
    if (ratio >= 1) return 'text-rose-600';
    if (ratio >= 0.8) return 'text-amber-600';
    return 'text-emerald-600';
  }
}
