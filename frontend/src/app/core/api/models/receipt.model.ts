export type ReceiptStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CONFIRMED';

export interface Receipt {
  id: string;
  userId: string;
  transactionId: string | null;
  /** Đường dẫn API để xem lại file (`GET /receipts/:id/file`, cần token) - không dùng trực tiếp trong <img src>. */
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: ReceiptStatus;
  /** Dữ liệu draft do extractor trích xuất - chỉ mang tính tham khảo cho đến khi confirm. */
  merchantName: string | null;
  amount: number | null;
  /** ISO 8601 datetime. */
  issuedAt: string | null;
  /** Độ tin cậy 0-1. */
  confidence: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmReceiptRequest {
  accountId: string;
  categoryId?: string;
  amount?: number;
  description?: string;
  /** ISO 8601 datetime. */
  date?: string;
  note?: string;
}
