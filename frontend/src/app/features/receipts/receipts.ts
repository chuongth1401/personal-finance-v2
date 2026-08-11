import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideCheck,
  LucideCircleCheck,
  LucideFileImage,
  LucideLoaderCircle,
  LucideRotateCcw,
  LucideTriangleAlert,
  LucideUpload,
  LucideX,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { AccountsApiService } from '../../core/api/accounts-api.service';
import { CategoriesApiService } from '../../core/api/categories-api.service';
import { extractErrorMessage } from '../../core/api/http-error.util';
import { AmountInputDirective } from '../../core/directives/amount-input.directive';
import { Account } from '../../core/api/models/account.model';
import { Category } from '../../core/api/models/category.model';
import { ConfirmReceiptRequest, Receipt } from '../../core/api/models/receipt.model';
import { ReceiptsApiService } from '../../core/api/receipts-api.service';
import { formatVnd } from '../../core/utils/currency';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ReviewFormControls {
  accountId: FormControl<string>;
  categoryId: FormControl<string | null>;
  merchant: FormControl<string>;
  amount: FormControl<number | null>;
  date: FormControl<string>;
  note: FormControl<string>;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-receipts',
  imports: [
    ReactiveFormsModule,
    AmountInputDirective,
    RouterLink,
    LucideUpload,
    LucideFileImage,
    LucideX,
    LucideLoaderCircle,
    LucideTriangleAlert,
    LucideCheck,
    LucideCircleCheck,
    LucideRotateCcw,
  ],
  templateUrl: './receipts.html',
})
export class Receipts implements OnInit, OnDestroy {
  private readonly receiptsApi = inject(ReceiptsApiService);
  private readonly accountsApi = inject(AccountsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  protected readonly formatVnd = formatVnd;

  protected readonly accounts = signal<Account[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly referenceDataError = signal<string | null>(null);

  protected readonly expenseCategories = computed(() =>
    this.categories().filter((c) => c.kind === 'EXPENSE'),
  );

  protected readonly dragOver = signal(false);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly fileError = signal<string | null>(null);

  protected readonly uploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly receipt = signal<Receipt | null>(null);

  protected readonly discarding = signal(false);
  protected readonly confirming = signal(false);
  protected readonly confirmError = signal<string | null>(null);
  protected readonly confirmedReceipt = signal<Receipt | null>(null);

  protected readonly form = new FormGroup<ReviewFormControls>({
    accountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoryId: new FormControl<string | null>(null),
    merchant: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    date: new FormControl(todayDateString(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    note: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadReferenceData();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private loadReferenceData(): void {
    this.referenceDataError.set(null);
    forkJoin([this.accountsApi.list(), this.categoriesApi.list()]).subscribe({
      next: ([accounts, categories]) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
        if (accounts.length > 0) {
          this.form.controls.accountId.setValue(accounts[0].id);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.referenceDataError.set(extractErrorMessage(error));
      },
    });
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.handleSelectedFile(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleSelectedFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void {
    this.dragOver.set(false);
  }

  private handleSelectedFile(file: File): void {
    this.fileError.set(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fileError.set('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      this.fileError.set(`Dung lượng ảnh (${sizeMb} MB) vượt quá giới hạn cho phép là 5 MB.`);
      return;
    }

    this.resetAll();
    this.previewUrl.set(URL.createObjectURL(file));
    this.upload(file);
  }

  private upload(file: File): void {
    this.uploading.set(true);
    this.uploadError.set(null);
    this.receiptsApi.upload(file).subscribe({
      next: (receipt) => {
        this.uploading.set(false);
        this.receipt.set(receipt);
        if (receipt.status === 'COMPLETED') {
          this.initReviewForm(receipt);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadError.set(extractErrorMessage(error));
      },
    });
  }

  private initReviewForm(receipt: Receipt): void {
    this.form.reset({
      accountId: this.accounts()[0]?.id ?? '',
      categoryId: null,
      merchant: receipt.merchantName ?? '',
      amount: receipt.amount,
      date: receipt.issuedAt ? receipt.issuedAt.slice(0, 10) : todayDateString(),
      note: '',
    });
  }

  protected submitConfirm(): void {
    const receipt = this.receipt();
    if (!receipt || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: ConfirmReceiptRequest = {
      accountId: value.accountId,
      categoryId: value.categoryId ?? undefined,
      amount: value.amount ?? undefined,
      description: value.merchant,
      date: new Date(value.date).toISOString(),
      note: value.note || undefined,
    };

    this.confirming.set(true);
    this.confirmError.set(null);
    this.receiptsApi.confirm(receipt.id, request).subscribe({
      next: (confirmed) => {
        this.confirming.set(false);
        this.confirmedReceipt.set(confirmed);
      },
      error: (error: HttpErrorResponse) => {
        this.confirming.set(false);
        this.confirmError.set(extractErrorMessage(error));
      },
    });
  }

  /** Bỏ hoá đơn hiện tại (chưa xác nhận) và xoá khỏi server để không tồn đọng bản nháp. */
  protected discard(): void {
    const receipt = this.receipt();
    if (!receipt) {
      this.resetAll();
      return;
    }
    this.discarding.set(true);
    this.receiptsApi.remove(receipt.id).subscribe({
      next: () => {
        this.discarding.set(false);
        this.resetAll();
      },
      error: (error: HttpErrorResponse) => {
        this.discarding.set(false);
        this.uploadError.set(extractErrorMessage(error));
      },
    });
  }

  protected scanAnother(): void {
    this.resetAll();
  }

  private resetAll(): void {
    this.revokePreview();
    this.previewUrl.set(null);
    this.fileError.set(null);
    this.uploadError.set(null);
    this.receipt.set(null);
    this.confirmError.set(null);
    this.confirmedReceipt.set(null);
    this.form.reset({
      accountId: this.accounts()[0]?.id ?? '',
      categoryId: null,
      merchant: '',
      amount: null,
      date: todayDateString(),
      note: '',
    });
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
