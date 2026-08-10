import { Component, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { LucideBell, LucideCircleUser, LucideMenu, LucideSearch } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [LucideMenu, LucideSearch, LucideBell, LucideCircleUser],
  template: `
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Mở menu"
          (click)="menuToggle.emit()"
        >
          <svg lucideMenu [size]="20" />
        </button>

        <h1 class="text-lg font-semibold tracking-tight text-slate-900">{{ pageTitle() }}</h1>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <label class="relative hidden sm:block">
            <span class="sr-only">Tìm kiếm</span>
            <svg lucideSearch [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Tìm giao dịch, danh mục..."
              class="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </label>

          <button
            type="button"
            class="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Thông báo"
          >
            <svg lucideBell [size]="20" />
          </button>

          <div class="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3">
            <span class="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <svg lucideCircleUser [size]="18" />
            </span>
            <span class="hidden text-sm font-medium text-slate-700 sm:block">Người dùng</span>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class Header {
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.resolveTitle()),
      startWith(this.resolveTitle()),
    ),
    { initialValue: this.resolveTitle() },
  );

  private resolveTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return (route.data['title'] as string | undefined) ?? 'Personal Finance';
  }
}
