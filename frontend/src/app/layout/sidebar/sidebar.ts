import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideArrowLeftRight,
  LucideChartLine,
  LucideFileText,
  LucideLayoutDashboard,
  LucideSettings,
  LucideTarget,
  LucideWallet,
  LucideWalletCards,
  LucideX,
} from '@lucide/angular';

interface NavItem {
  path: string;
  label: string;
  icon: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'analytics' | 'reports' | 'settings';
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { path: '/transactions', label: 'Giao dịch', icon: 'transactions' },
  { path: '/budgets', label: 'Ngân sách', icon: 'budgets' },
  { path: '/goals', label: 'Mục tiêu', icon: 'goals' },
  { path: '/analytics', label: 'Phân tích', icon: 'analytics' },
  { path: '/reports', label: 'Báo cáo', icon: 'reports' },
  { path: '/settings', label: 'Cài đặt', icon: 'settings' },
];

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideArrowLeftRight,
    LucideWallet,
    LucideTarget,
    LucideChartLine,
    LucideFileText,
    LucideSettings,
    LucideWalletCards,
    LucideX,
  ],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:translate-x-0"
      [class.translate-x-0]="open()"
    >
      <div class="flex h-16 items-center justify-between px-5">
        <div class="flex items-center gap-2.5">
          <span class="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <svg lucideWalletCards [size]="18" />
          </span>
          <span class="text-base font-semibold tracking-tight text-slate-900">Personal Finance</span>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Đóng menu"
          (click)="closeRequested.emit()"
        >
          <svg lucideX [size]="20" />
        </button>
      </div>

      <nav class="flex flex-col gap-1 px-3 py-2" aria-label="Điều hướng chính">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-slate-900 text-white hover:bg-slate-900"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            (click)="closeRequested.emit()"
          >
            @switch (item.icon) {
              @case ('dashboard') {
                <svg lucideLayoutDashboard [size]="18" />
              }
              @case ('transactions') {
                <svg lucideArrowLeftRight [size]="18" />
              }
              @case ('budgets') {
                <svg lucideWallet [size]="18" />
              }
              @case ('goals') {
                <svg lucideTarget [size]="18" />
              }
              @case ('analytics') {
                <svg lucideChartLine [size]="18" />
              }
              @case ('reports') {
                <svg lucideFileText [size]="18" />
              }
              @case ('settings') {
                <svg lucideSettings [size]="18" />
              }
            }
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
})
export class Sidebar {
  readonly open = input<boolean>(false);
  readonly closeRequested = output<void>();

  protected readonly navItems = NAV_ITEMS;
}
