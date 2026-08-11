import { toSignal } from '@angular/core/rxjs-interop';
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
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucidePlus,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { AccountsApiService } from '../../core/api/accounts-api.service';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import { extractErrorMessage } from '../../core/api/http-error.util';
import { Account } from '../../core/api/models/account.model';
import { Category } from '../../core/api/models/category.model';
import {
  PaginationMeta,
  Transaction,
  TransactionType,
} from '../../core/api/models/transaction.model';
import { TransactionsApiService } from '../../core/api/transactions-api.service';
import { formatVnd } from '../../core/utils/currency';

interface TransactionFormControls {
  accountId: FormControl<string>;
  categoryId: FormControl<string | null>;
  type: FormControl<TransactionType>;
  amount: FormControl<number | null>;
  date: FormControl<string>;
  description: FormControl<string>;
  note: FormControl<string>;
}

const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Chi tiêu' },
  { value: 'INCOME', label: 'Thu nhập' },
  { value: 'TRANSFER', label: 'Chuyển khoản' },
];

function integerAmountValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { notInteger: true };
}

function crossFieldValidator(group: AbstractControl): ValidationErrors | null {
  const type = group.get('type')?.value as TransactionType;
  const categoryId = group.get('categoryId')?.value as string | null;

  // TRANSFER chưa được hỗ trợ lưu - nút Lưu sẽ bị khoá riêng, không cần validate thêm ở đây.
  if (type === 'TRANSFER') return null;
  if (!categoryId) return { categoryRequired: true };
  return null;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-transactions',
  imports: [
    ReactiveFormsModule,
    LucidePlus,
    LucideX,
    LucideTrash2,
    LucideArrowUpRight,
    LucideArrowDownRight,
  ],
  templateUrl: './transactions.html',
})
export class Transactions implements OnInit {
  private readonly transactionsApi = inject(TransactionsApiService);
  private readonly accountsApi = inject(AccountsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  protected readonly formatVnd = formatVnd;
  protected readonly typeOptions = TRANSACTION_TYPE_OPTIONS;

  protected readonly accounts = signal<Account[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly referenceDataError = signal<string | null>(null);

  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly meta = signal<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  protected readonly loading = signal(false);
  protected readonly listError = signal<string | null>(null);

  protected readonly filterType = signal<TransactionType | ''>('');
  protected readonly filterAccountId = signal<string>('');
  protected readonly filterCategoryId = signal<string>('');
  protected readonly filterDateFrom = signal<string>('');
  protected readonly filterDateTo = signal<string>('');
  protected readonly filterSearch = signal<string>('');
  private readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly form = new FormGroup<TransactionFormControls>(
    {
      accountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      categoryId: new FormControl<string | null>(null),
      type: new FormControl<TransactionType>('EXPENSE', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      amount: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1),
        integerAmountValidator,
      ]),
      date: new FormControl(todayDateString(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(255)],
      }),
      note: new FormControl('', { nonNullable: true }),
    },
    { validators: crossFieldValidator },
  );

  private readonly selectedType = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  protected readonly availableCategories = computed(() => {
    const kind = this.selectedType() === 'INCOME' ? 'INCOME' : 'EXPENSE';
    return this.categories().filter((c) => c.kind === kind);
  });

  protected readonly isTransferSelected = computed(() => this.selectedType() === 'TRANSFER');

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadTransactions();
  }

  private loadReferenceData(): void {
    this.referenceDataError.set(null);
    forkJoin([this.accountsApi.list(), this.categoriesApi.list()]).subscribe({
      next: ([accounts, categories]) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
      },
      error: (error: HttpErrorResponse) => {
        this.referenceDataError.set(extractErrorMessage(error));
      },
    });
  }

  protected loadTransactions(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.transactionsApi
      .list({
        type: this.filterType() || undefined,
        accountId: this.filterAccountId() || undefined,
        categoryId: this.filterCategoryId() || undefined,
        dateFrom: this.filterDateFrom() || undefined,
        dateTo: this.filterDateTo() || undefined,
        search: this.filterSearch().trim() || undefined,
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (result) => {
          this.transactions.set(result.data);
          this.meta.set(result.meta);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.listError.set(extractErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected onTypeFilterChange(event: Event): void {
    this.filterType.set((event.target as HTMLSelectElement).value as TransactionType | '');
  }

  protected onAccountFilterChange(event: Event): void {
    this.filterAccountId.set((event.target as HTMLSelectElement).value);
  }

  protected onCategoryFilterChange(event: Event): void {
    this.filterCategoryId.set((event.target as HTMLSelectElement).value);
  }

  protected onDateFromChange(event: Event): void {
    this.filterDateFrom.set((event.target as HTMLInputElement).value);
  }

  protected onDateToChange(event: Event): void {
    this.filterDateTo.set((event.target as HTMLInputElement).value);
  }

  protected onSearchChange(event: Event): void {
    this.filterSearch.set((event.target as HTMLInputElement).value);
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.loadTransactions();
  }

  protected resetFilters(): void {
    this.filterType.set('');
    this.filterAccountId.set('');
    this.filterCategoryId.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterSearch.set('');
    this.page.set(1);
    this.loadTransactions();
  }

  protected goToPage(target: number): void {
    if (target < 1 || target > this.meta().totalPages) return;
    this.page.set(target);
    this.loadTransactions();
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.form.reset({
      accountId: this.accounts()[0]?.id ?? '',
      categoryId: null,
      type: 'EXPENSE',
      amount: null,
      date: todayDateString(),
      description: '',
      note: '',
    });
    this.formOpen.set(true);
  }

  protected openEditForm(transaction: Transaction): void {
    this.editingId.set(transaction.id);
    this.formError.set(null);
    this.form.reset({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      description: transaction.description,
      note: transaction.note ?? '',
    });
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected submitForm(): void {
    if (this.isTransferSelected()) {
      // Nút Lưu đã bị khoá trong template cho trường hợp này; kiểm tra lại cho chắc chắn.
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const isoDate = new Date(value.date).toISOString();
    const editingId = this.editingId();

    this.submitting.set(true);
    this.formError.set(null);

    const request$ = editingId
      ? this.transactionsApi.update(editingId, {
          accountId: value.accountId,
          categoryId: value.categoryId,
          type: value.type,
          amount: value.amount ?? 0,
          date: isoDate,
          description: value.description,
          note: value.note || undefined,
        })
      : this.transactionsApi.create({
          accountId: value.accountId,
          categoryId: value.categoryId ?? undefined,
          type: value.type,
          amount: value.amount ?? 0,
          date: isoDate,
          description: value.description,
          note: value.note || undefined,
        });

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.formOpen.set(false);
        this.loadTransactions();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.formError.set(extractErrorMessage(error));
      },
    });
  }

  protected deleteTransaction(transaction: Transaction): void {
    if (!confirm(`Xóa giao dịch "${transaction.description}"?`)) return;

    this.deletingId.set(transaction.id);
    this.transactionsApi.remove(transaction.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        const isLastRowOnPage = this.transactions().length === 1 && this.page() > 1;
        if (isLastRowOnPage) {
          this.page.update((p) => p - 1);
        }
        this.loadTransactions();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.listError.set(extractErrorMessage(error));
      },
    });
  }

  protected accountName(accountId: string): string {
    return this.accounts().find((a) => a.id === accountId)?.name ?? '—';
  }

  protected categoryName(categoryId: string | null): string {
    if (!categoryId) return '—';
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }
}
