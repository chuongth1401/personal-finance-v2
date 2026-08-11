import { Account, Category, Transaction } from '../../generated/prisma/client';

export interface DateRange {
  start: Date;
  end: Date;
}

export function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** [start, end) cho tháng `month` (định dạng YYYY-MM). */
export function monthRange(month: string): DateRange {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 1);
  return { start, end };
}

/** Tháng liền trước `month` (định dạng YYYY-MM), dạng chuỗi YYYY-MM. */
export function previousMonthKey(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return formatMonthKey(new Date(year, monthNumber - 2, 1));
}

/** [start, end) cho năm `year` (định dạng YYYY). */
export function yearRange(year: string): DateRange {
  const y = Number(year);
  return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
}

export function previousYearKey(year: string): string {
  return String(Number(year) - 1);
}

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi tiêu',
  TRANSFER: 'Chuyển khoản',
};

const CSV_HEADER = [
  'Ngày',
  'Loại',
  'Mô tả',
  'Danh mục',
  'Tài khoản',
  'Tài khoản đích',
  'Số tiền (VND)',
  'Ghi chú',
];

/** BOM UTF-8, cần thiết để Excel nhận diện đúng font/encoding tiếng Việt. */
export const CSV_UTF8_BOM = '﻿';

/** Bọc trong dấu ngoặc kép và escape dấu ngoặc kép nếu field chứa `,`, `"` hoặc xuống dòng. */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type TransactionForCsv = Transaction & {
  category: Category | null;
  account: Account;
  toAccount: Account | null;
};

/** Sinh nội dung CSV (kèm BOM UTF-8) từ danh sách giao dịch, dùng dòng CRLF cho Excel. */
export function buildTransactionsCsv(
  transactions: TransactionForCsv[],
): string {
  const rows = transactions.map((t) =>
    [
      t.date.toISOString().slice(0, 10),
      TRANSACTION_TYPE_LABEL[t.type] ?? t.type,
      t.description,
      t.category?.name ?? '',
      t.account.name,
      t.toAccount?.name ?? '',
      String(t.amount),
      t.note ?? '',
    ]
      .map(escapeCsvField)
      .join(','),
  );

  return CSV_UTF8_BOM + [CSV_HEADER.join(','), ...rows].join('\r\n');
}
