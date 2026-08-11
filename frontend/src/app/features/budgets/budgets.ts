import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideCalendar,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { BudgetsApiService } from '../../core/api/budgets-api.service';
import { AmountInputDirective } from '../../core/directives/amount-input.directive';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import { extractErrorMessage } from '../../core/api/http-error.util';
import {
  BudgetStatus,
  BudgetWithUsage,
  CreateBudgetRequest,
} from '../../core/api/models/budget.model';
import { Category } from '../../core/api/models/category.model';
import { currentPeriodKey } from '../../core/utils/period';
import { formatVnd } from '../../core/utils/currency';

interface BudgetFormControls {
  categoryId: FormControl<string>;
  month: FormControl<string>;
  limitAmount: FormControl<number | null>;
}

const BAR_CLASS: Record<BudgetStatus, string> = {
  NORMAL: 'bg-emerald-500',
  WARNING: 'bg-amber-500',
  EXCEEDED: 'bg-rose-500',
};

const TEXT_CLASS: Record<BudgetStatus, string> = {
  NORMAL: 'text-emerald-600',
  WARNING: 'text-amber-600',
  EXCEEDED: 'text-rose-600',
};

const STATUS_LABEL: Record<BudgetStatus, string> = {
  NORMAL: 'Trong hạn mức',
  WARNING: 'Gần vượt hạn mức',
  EXCEEDED: 'Đã vượt hạn mức',
};

function integerAmountValidator(
  control: FormControl<number | null>,
): Record<string, boolean> | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Number.isInteger(value) ? null : { notInteger: true };
}

@Component({
  selector: 'app-budgets',
  imports: [
    ReactiveFormsModule,
    AmountInputDirective,
    LucideTriangleAlert,
    LucideCalendar,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './budgets.html',
})
export class Budgets implements OnInit {
  private readonly budgetsApi = inject(BudgetsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  protected readonly formatVnd = formatVnd;
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly selectedMonth = signal(currentPeriodKey());
  protected readonly budgets = signal<BudgetWithUsage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesError = signal<string | null>(null);

  protected readonly expenseCategories = computed(() =>
    this.categories().filter((c) => c.kind === 'EXPENSE'),
  );

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly form = new FormGroup<BudgetFormControls>({
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    month: new FormControl(currentPeriodKey(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    limitAmount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      integerAmountValidator,
    ]),
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadBudgets();
  }

  private loadCategories(): void {
    this.categoriesError.set(null);
    this.categoriesApi.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error: HttpErrorResponse) => this.categoriesError.set(extractErrorMessage(error)),
    });
  }

  protected loadBudgets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.budgetsApi.list(this.selectedMonth()).subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
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
    this.loadBudgets();
  }

  protected barClass(status: BudgetStatus): string {
    return BAR_CLASS[status];
  }

  protected textClass(status: BudgetStatus): string {
    return TEXT_CLASS[status];
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.form.reset({
      categoryId: this.expenseCategories()[0]?.id ?? '',
      month: this.selectedMonth(),
      limitAmount: null,
    });
    this.formOpen.set(true);
  }

  protected openEditForm(budget: BudgetWithUsage): void {
    this.editingId.set(budget.id);
    this.formError.set(null);
    this.form.reset({
      categoryId: budget.categoryId,
      month: budget.month,
      limitAmount: budget.limitAmount,
    });
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateBudgetRequest = {
      categoryId: value.categoryId,
      month: value.month,
      limitAmount: value.limitAmount ?? 0,
    };
    const editingId = this.editingId();

    this.submitting.set(true);
    this.formError.set(null);

    const request$ = editingId
      ? this.budgetsApi.update(editingId, request)
      : this.budgetsApi.create(request);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.formOpen.set(false);
        this.loadBudgets();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.formError.set(extractErrorMessage(error));
      },
    });
  }

  protected deleteBudget(budget: BudgetWithUsage): void {
    if (!confirm(`Xóa ngân sách "${budget.categoryName}" tháng ${budget.month}?`)) return;

    this.deletingId.set(budget.id);
    this.error.set(null);
    this.budgetsApi.remove(budget.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadBudgets();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.error.set(extractErrorMessage(error));
      },
    });
  }
}
