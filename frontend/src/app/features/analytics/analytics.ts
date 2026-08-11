import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideCalendar,
  LucideCheck,
  LucideEyeOff,
  LucideRefreshCw,
  LucideRepeat,
  LucideSparkles,
  LucideTrendingUp,
  LucideTriangleAlert,
} from '@lucide/angular';

import { extractErrorMessage } from '../../core/api/http-error.util';
import { FinancialAnalysisApiService } from '../../core/api/financial-analysis-api.service';
import { FinancialInsight, InsightSeverity } from '../../core/api/models/financial-insight.model';
import { currentPeriodKey } from '../../core/utils/period';

const SEVERITY_BADGE_CLASS: Record<InsightSeverity, string> = {
  INFO: 'bg-sky-50 text-sky-700',
  WARNING: 'bg-amber-50 text-amber-700',
  CRITICAL: 'bg-rose-50 text-rose-700',
};

const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  INFO: 'Thông tin',
  WARNING: 'Cần lưu ý',
  CRITICAL: 'Quan trọng',
};

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

const MAX_HIGHLIGHTED = 5;

@Component({
  selector: 'app-analytics',
  imports: [
    LucideCalendar,
    LucideRefreshCw,
    LucideSparkles,
    LucideTriangleAlert,
    LucideRepeat,
    LucideTrendingUp,
    LucideCheck,
    LucideEyeOff,
  ],
  templateUrl: './analytics.html',
})
export class Analytics implements OnInit {
  private readonly analysisApi = inject(FinancialAnalysisApiService);

  protected readonly severityBadgeClass = SEVERITY_BADGE_CLASS;
  protected readonly severityLabel = SEVERITY_LABEL;

  protected readonly selectedMonth = signal(currentPeriodKey());
  protected readonly insights = signal<FinancialInsight[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly running = signal(false);
  protected readonly pendingId = signal<string | null>(null);

  protected readonly highlighted = computed(() =>
    [...this.insights()]
      .filter((i) => i.severity !== 'INFO')
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .slice(0, MAX_HIGHLIGHTED),
  );

  protected readonly anomalies = computed(() =>
    this.insights().filter((i) => i.type === 'ANOMALY'),
  );

  protected readonly recurringCandidates = computed(() =>
    this.insights().filter((i) => i.type === 'RECURRING_CANDIDATE'),
  );

  protected readonly forecast = computed(
    () => this.insights().find((i) => i.type === 'FORECAST') ?? null,
  );

  ngOnInit(): void {
    this.loadInsights();
  }

  protected loadInsights(): void {
    this.loading.set(true);
    this.error.set(null);
    this.analysisApi.list(this.selectedMonth()).subscribe({
      next: (insights) => {
        this.insights.set(insights);
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
    this.loadInsights();
  }

  protected runAnalysis(): void {
    this.running.set(true);
    this.error.set(null);
    this.analysisApi.run(this.selectedMonth()).subscribe({
      next: () => {
        this.running.set(false);
        this.loadInsights();
      },
      error: (error: HttpErrorResponse) => {
        this.running.set(false);
        this.error.set(extractErrorMessage(error));
      },
    });
  }

  protected markAsRead(insight: FinancialInsight): void {
    if (insight.isRead) return;
    this.pendingId.set(insight.id);
    this.analysisApi.markAsRead(insight.id).subscribe({
      next: (updated) => {
        this.pendingId.set(null);
        this.insights.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      },
      error: (error: HttpErrorResponse) => {
        this.pendingId.set(null);
        this.error.set(extractErrorMessage(error));
      },
    });
  }

  protected hide(insight: FinancialInsight): void {
    this.pendingId.set(insight.id);
    this.analysisApi.hide(insight.id).subscribe({
      next: () => {
        this.pendingId.set(null);
        this.insights.update((list) => list.filter((i) => i.id !== insight.id));
      },
      error: (error: HttpErrorResponse) => {
        this.pendingId.set(null);
        this.error.set(extractErrorMessage(error));
      },
    });
  }
}
