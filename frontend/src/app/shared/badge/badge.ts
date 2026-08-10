import { Component, computed, input } from '@angular/core';

import { hexWithAlpha } from '../../core/utils/color';

@Component({
  selector: 'app-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      [style.background-color]="bgColor()"
      [style.color]="color()"
    >
      {{ label() }}
    </span>
  `,
})
export class Badge {
  readonly label = input.required<string>();
  readonly color = input<string>('#64748b');

  protected readonly bgColor = computed(() => hexWithAlpha(this.color(), 0.12));
}
