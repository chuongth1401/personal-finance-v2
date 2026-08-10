import { Component, computed, input } from '@angular/core';

type Accent = 'default' | 'success' | 'danger' | 'info';
type TrendDirection = 'up' | 'down' | 'neutral';

const ICON_WRAP_CLASSES: Record<Accent, string> = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-600',
  danger: 'bg-rose-50 text-rose-600',
  info: 'bg-sky-50 text-sky-600',
};

const TREND_CLASSES: Record<TrendDirection, string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  neutral: 'text-slate-500',
};

@Component({
  selector: 'app-kpi-card',
  template: `
    <div
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-500">{{ label() }}</p>
          <p class="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{{ value() }}</p>
        </div>
        <div class="shrink-0 rounded-xl p-2.5" [class]="iconWrapClass()">
          <ng-content select="[icon]" />
        </div>
      </div>

      @if (trendLabel(); as trend) {
        <p class="mt-3 text-xs font-medium" [class]="trendClass()">{{ trend }}</p>
      }
    </div>
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly trendLabel = input<string>();
  readonly trendDirection = input<TrendDirection>('neutral');
  readonly accent = input<Accent>('default');

  protected readonly iconWrapClass = computed(() => ICON_WRAP_CLASSES[this.accent()]);
  protected readonly trendClass = computed(() => TREND_CLASSES[this.trendDirection()]);
}
