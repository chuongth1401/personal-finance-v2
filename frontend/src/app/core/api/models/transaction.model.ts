export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  type: TransactionType;
  /** Số nguyên VND, luôn dương; dấu +/- suy ra từ `type`. */
  amount: number;
  /** ISO 8601 datetime. */
  date: string;
  description: string;
  note: string | null;
  recurringTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  /** ISO 8601 datetime. */
  date: string;
  description: string;
  note?: string;
}

export interface UpdateTransactionRequest {
  accountId?: string;
  /** `null` để xoá quan hệ (vd. đổi type từ TRANSFER sang EXPENSE). */
  toAccountId?: string | null;
  categoryId?: string | null;
  type?: TransactionType;
  amount?: number;
  date?: string;
  description?: string;
  note?: string;
}

export interface TransactionQuery {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
