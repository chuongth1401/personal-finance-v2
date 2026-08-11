import { ReceiptStatus } from '../enums/receipt-status.enum';

export interface ReceiptResponse {
  id: string;
  userId: string;
  transactionId: string | null;
  /** Đường dẫn API để tải/xem file (`GET /receipts/:id/file`) - không phải đường dẫn đĩa nội bộ. */
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: ReceiptStatus;
  /** Dữ liệu draft do extractor trích xuất - chỉ mang tính tham khảo cho đến khi confirm. */
  merchantName: string | null;
  amount: number | null;
  issuedAt: Date | null;
  confidence: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
