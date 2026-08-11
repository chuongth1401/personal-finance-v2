import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        data: { title: 'Tổng quan' },
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions').then((m) => m.Transactions),
        data: { title: 'Giao dịch' },
      },
      {
        path: 'receipts',
        loadComponent: () => import('./features/receipts/receipts').then((m) => m.Receipts),
        data: { title: 'Quét hoá đơn' },
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets').then((m) => m.Budgets),
        data: { title: 'Ngân sách' },
      },
      {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals').then((m) => m.Goals),
        data: { title: 'Mục tiêu' },
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
        data: { title: 'Phân tích' },
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
        data: { title: 'Báo cáo' },
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
        data: { title: 'Cài đặt' },
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
