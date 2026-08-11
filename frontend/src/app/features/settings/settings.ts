import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LucidePencil, LucidePlus, LucideTrash2, LucideX } from '@lucide/angular';

import { AccountsApiService } from '../../core/api/accounts-api.service';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import { extractErrorMessage } from '../../core/api/http-error.util';
import { Account, AccountType, CreateAccountRequest } from '../../core/api/models/account.model';
import {
  Category,
  CategoryKind,
  CreateCategoryRequest,
} from '../../core/api/models/category.model';
import { CATEGORY_ICON_OPTIONS, CategoryIconKey } from '../../core/utils/category-icons';
import { formatVnd } from '../../core/utils/currency';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface AccountFormControls {
  name: FormControl<string>;
  type: FormControl<AccountType>;
  balance: FormControl<number | null>;
}

interface CategoryFormControls {
  name: FormControl<string>;
  kind: FormControl<CategoryKind>;
  color: FormControl<string>;
  icon: FormControl<CategoryIconKey>;
}

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK', label: 'Ngân hàng' },
  { value: 'EWALLET', label: 'Ví điện tử' },
  { value: 'CREDIT', label: 'Thẻ tín dụng' },
];

const CATEGORY_KIND_OPTIONS: { value: CategoryKind; label: string }[] = [
  { value: 'EXPENSE', label: 'Chi tiêu' },
  { value: 'INCOME', label: 'Thu nhập' },
];

const DEFAULT_CATEGORY_COLOR = '#64748b';

function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { notInteger: true };
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, CategoryIcon, LucidePlus, LucidePencil, LucideTrash2, LucideX],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly accountsApi = inject(AccountsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  protected readonly formatVnd = formatVnd;
  protected readonly accountTypeOptions = ACCOUNT_TYPE_OPTIONS;
  protected readonly categoryKindOptions = CATEGORY_KIND_OPTIONS;
  protected readonly iconOptions = CATEGORY_ICON_OPTIONS;

  // --- Tài khoản ---
  protected readonly accounts = signal<Account[]>([]);
  protected readonly accountsLoading = signal(false);
  protected readonly accountsError = signal<string | null>(null);

  protected readonly accountFormOpen = signal(false);
  protected readonly editingAccountId = signal<string | null>(null);
  protected readonly accountSubmitting = signal(false);
  protected readonly accountFormError = signal<string | null>(null);
  protected readonly deletingAccountId = signal<string | null>(null);

  protected readonly accountForm = new FormGroup<AccountFormControls>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    type: new FormControl<AccountType>('CASH', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    balance: new FormControl<number | null>(0, [Validators.required, integerValidator]),
  });

  // --- Danh mục ---
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesError = signal<string | null>(null);

  protected readonly categoryFormOpen = signal(false);
  protected readonly editingCategoryId = signal<string | null>(null);
  protected readonly categorySubmitting = signal(false);
  protected readonly categoryFormError = signal<string | null>(null);
  protected readonly deletingCategoryId = signal<string | null>(null);

  protected readonly categoryForm = new FormGroup<CategoryFormControls>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    kind: new FormControl<CategoryKind>('EXPENSE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    color: new FormControl(DEFAULT_CATEGORY_COLOR, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    }),
    icon: new FormControl<CategoryIconKey>('tag', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadAccounts();
    this.loadCategories();
  }

  // --- Tài khoản: CRUD ---

  protected loadAccounts(): void {
    this.accountsLoading.set(true);
    this.accountsError.set(null);
    this.accountsApi.list().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.accountsLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.accountsError.set(extractErrorMessage(error));
        this.accountsLoading.set(false);
      },
    });
  }

  protected openCreateAccountForm(): void {
    this.editingAccountId.set(null);
    this.accountFormError.set(null);
    this.accountForm.reset({ name: '', type: 'CASH', balance: 0 });
    this.accountFormOpen.set(true);
  }

  protected openEditAccountForm(account: Account): void {
    this.editingAccountId.set(account.id);
    this.accountFormError.set(null);
    this.accountForm.reset({ name: account.name, type: account.type, balance: account.balance });
    this.accountFormOpen.set(true);
  }

  protected closeAccountForm(): void {
    this.accountFormOpen.set(false);
  }

  protected submitAccountForm(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const value = this.accountForm.getRawValue();
    const request: CreateAccountRequest = {
      name: value.name,
      type: value.type,
      balance: value.balance ?? 0,
    };
    const editingId = this.editingAccountId();

    this.accountSubmitting.set(true);
    this.accountFormError.set(null);

    const request$ = editingId
      ? this.accountsApi.update(editingId, request)
      : this.accountsApi.create(request);

    request$.subscribe({
      next: () => {
        this.accountSubmitting.set(false);
        this.accountFormOpen.set(false);
        this.loadAccounts();
      },
      error: (error: HttpErrorResponse) => {
        this.accountSubmitting.set(false);
        this.accountFormError.set(extractErrorMessage(error));
      },
    });
  }

  protected deleteAccount(account: Account): void {
    if (!confirm(`Xóa tài khoản "${account.name}"?`)) return;

    this.deletingAccountId.set(account.id);
    this.accountsError.set(null);
    this.accountsApi.remove(account.id).subscribe({
      next: () => {
        this.deletingAccountId.set(null);
        this.loadAccounts();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingAccountId.set(null);
        this.accountsError.set(extractErrorMessage(error));
      },
    });
  }

  // --- Danh mục: CRUD ---

  protected loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesError.set(null);
    this.categoriesApi.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.categoriesError.set(extractErrorMessage(error));
        this.categoriesLoading.set(false);
      },
    });
  }

  protected openCreateCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.categoryFormError.set(null);
    this.categoryForm.reset({
      name: '',
      kind: 'EXPENSE',
      color: DEFAULT_CATEGORY_COLOR,
      icon: 'tag',
    });
    this.categoryFormOpen.set(true);
  }

  protected openEditCategoryForm(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryFormError.set(null);
    this.categoryForm.reset({
      name: category.name,
      kind: category.kind,
      color: category.color,
      icon: (category.icon as CategoryIconKey | null) ?? 'tag',
    });
    this.categoryFormOpen.set(true);
  }

  protected closeCategoryForm(): void {
    this.categoryFormOpen.set(false);
  }

  protected submitCategoryForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    const request: CreateCategoryRequest = {
      name: value.name,
      kind: value.kind,
      color: value.color,
      icon: value.icon,
    };
    const editingId = this.editingCategoryId();

    this.categorySubmitting.set(true);
    this.categoryFormError.set(null);

    const request$ = editingId
      ? this.categoriesApi.update(editingId, request)
      : this.categoriesApi.create(request);

    request$.subscribe({
      next: () => {
        this.categorySubmitting.set(false);
        this.categoryFormOpen.set(false);
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.categorySubmitting.set(false);
        this.categoryFormError.set(extractErrorMessage(error));
      },
    });
  }

  protected deleteCategory(category: Category): void {
    if (!confirm(`Xóa danh mục "${category.name}"?`)) return;

    this.deletingCategoryId.set(category.id);
    this.categoriesError.set(null);
    this.categoriesApi.remove(category.id).subscribe({
      next: () => {
        this.deletingCategoryId.set(null);
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingCategoryId.set(null);
        this.categoriesError.set(extractErrorMessage(error));
      },
    });
  }

  protected accountTypeLabel(type: AccountType): string {
    return this.accountTypeOptions.find((opt) => opt.value === type)?.label ?? type;
  }
}
