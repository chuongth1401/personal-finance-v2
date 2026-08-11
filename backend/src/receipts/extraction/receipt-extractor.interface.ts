export const RECEIPT_EXTRACTOR = Symbol('RECEIPT_EXTRACTOR');

export interface ExtractionInput {
  storageKey: string;
  mimeType: string | null;
}

export interface ExtractionResult {
  merchant: string;
  date: Date;
  totalAmount: number;
  /** Độ tin cậy 0-1. */
  confidence: number;
}

/**
 * Trừu tượng hoá bước trích xuất dữ liệu từ ảnh hoá đơn. Giai đoạn 1 dùng
 * MockReceiptExtractorService (dữ liệu giả lập). Khi tích hợp OCR/AI thật,
 * chỉ cần viết implementation mới (gọi Google Vision/Textract/LLM...) và đổi
 * provider trong ReceiptsModule - ReceiptsService không cần đổi gì.
 */
export interface ReceiptExtractor {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}
