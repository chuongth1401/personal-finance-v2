import { Component, inject } from '@angular/core';
import { LucideTarget } from '@lucide/angular';

import { MockDataService } from '../../core/services/mock-data.service';
import { formatVnd } from '../../core/utils/currency';

@Component({
  selector: 'app-goals',
  imports: [LucideTarget],
  templateUrl: './goals.html',
})
export class Goals {
  protected readonly data = inject(MockDataService);
  protected readonly formatVnd = formatVnd;

  protected progressRatio(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(current / target, 1);
  }

  protected daysLeft(deadline: string): number {
    const diffMs = new Date(deadline).getTime() - Date.now();
    return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
  }
}
