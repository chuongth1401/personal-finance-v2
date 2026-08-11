import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LucidePencil, LucidePlus, LucideTrash2, LucideX } from '@lucide/angular';

import { extractErrorMessage } from '../../core/api/http-error.util';
import {
  CreateSavingsGoalRequest,
  GoalStatus,
  SavingsGoalWithProgress,
} from '../../core/api/models/savings-goal.model';
import { SavingsGoalsApiService } from '../../core/api/savings-goals-api.service';
import { CATEGORY_ICON_OPTIONS, CategoryIconKey } from '../../core/utils/category-icons';
import { formatVnd } from '../../core/utils/currency';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface GoalFormControls {
  name: FormControl<string>;
  targetAmount: FormControl<number | null>;
  currentAmount: FormControl<number | null>;
  targetDate: FormControl<string>;
  icon: FormControl<CategoryIconKey>;
  color: FormControl<string>;
  status: FormControl<GoalStatus>;
}

type StatusFilter = 'ACTIVE' | 'COMPLETED' | 'ALL';

interface PaceLabel {
  text: string;
  class: string;
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'ALL', label: 'Tất cả' },
];

const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const DEFAULT_COLOR = '#0ea5e9';

function integerAmountValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { notInteger: true };
}

@Component({
  selector: 'app-goals',
  imports: [ReactiveFormsModule, CategoryIcon, LucidePlus, LucidePencil, LucideTrash2, LucideX],
  templateUrl: './goals.html',
})
export class Goals implements OnInit {
  private readonly goalsApi = inject(SavingsGoalsApiService);

  protected readonly formatVnd = formatVnd;
  protected readonly statusFilterOptions = STATUS_FILTER_OPTIONS;
  protected readonly goalStatusOptions = GOAL_STATUS_OPTIONS;
  protected readonly iconOptions = CATEGORY_ICON_OPTIONS;

  protected readonly goals = signal<SavingsGoalWithProgress[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly statusFilter = signal<StatusFilter>('ACTIVE');

  protected readonly filteredGoals = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'ALL') return this.goals();
    return this.goals().filter((g) => g.status === filter);
  });

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly form = new FormGroup<GoalFormControls>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    targetAmount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      integerAmountValidator,
    ]),
    currentAmount: new FormControl<number | null>(0, [Validators.min(0), integerAmountValidator]),
    targetDate: new FormControl('', { nonNullable: true }),
    icon: new FormControl<CategoryIconKey>('tag', { nonNullable: true }),
    color: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
    status: new FormControl<GoalStatus>('ACTIVE', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadGoals();
  }

  protected loadGoals(): void {
    this.loading.set(true);
    this.error.set(null);
    this.goalsApi.list().subscribe({
      next: (goals) => {
        this.goals.set(goals);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  protected progressPercent(goal: SavingsGoalWithProgress): number {
    return Math.min(goal.progressPercentage, 100);
  }

  protected paceLabel(goal: SavingsGoalWithProgress): PaceLabel {
    if (goal.status === 'COMPLETED' || goal.progressPercentage >= 100) {
      return { text: 'Đã hoàn thành', class: 'bg-emerald-50 text-emerald-700' };
    }
    if (!goal.targetDate) {
      return { text: 'Đúng tiến độ', class: 'bg-sky-50 text-sky-700' };
    }
    if (!goal.projectedCompletionDate) {
      return { text: 'Cần tăng tiết kiệm', class: 'bg-amber-50 text-amber-700' };
    }
    const isBehindSchedule = new Date(goal.projectedCompletionDate) > new Date(goal.targetDate);
    return isBehindSchedule
      ? { text: 'Cần tăng tiết kiệm', class: 'bg-amber-50 text-amber-700' }
      : { text: 'Đúng tiến độ', class: 'bg-sky-50 text-sky-700' };
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.form.reset({
      name: '',
      targetAmount: null,
      currentAmount: 0,
      targetDate: '',
      icon: 'tag',
      color: DEFAULT_COLOR,
      status: 'ACTIVE',
    });
    this.formOpen.set(true);
  }

  protected openEditForm(goal: SavingsGoalWithProgress): void {
    this.editingId.set(goal.id);
    this.formError.set(null);
    this.form.reset({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
      icon: (goal.icon as CategoryIconKey | null) ?? 'tag',
      color: goal.color ?? DEFAULT_COLOR,
      status: goal.status,
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
    const request: CreateSavingsGoalRequest = {
      name: value.name,
      targetAmount: value.targetAmount ?? 0,
      currentAmount: value.currentAmount ?? 0,
      targetDate: value.targetDate ? new Date(value.targetDate).toISOString() : undefined,
      icon: value.icon,
      color: value.color,
      status: value.status,
    };
    const editingId = this.editingId();

    this.submitting.set(true);
    this.formError.set(null);

    const request$ = editingId
      ? this.goalsApi.update(editingId, {
          ...request,
          targetDate: value.targetDate ? new Date(value.targetDate).toISOString() : null,
        })
      : this.goalsApi.create(request);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.formOpen.set(false);
        this.loadGoals();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.formError.set(extractErrorMessage(error));
      },
    });
  }

  protected deleteGoal(goal: SavingsGoalWithProgress): void {
    if (!confirm(`Xóa mục tiêu "${goal.name}"?`)) return;

    this.deletingId.set(goal.id);
    this.error.set(null);
    this.goalsApi.remove(goal.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadGoals();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.error.set(extractErrorMessage(error));
      },
    });
  }
}
