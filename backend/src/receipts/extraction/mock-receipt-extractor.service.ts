import { Injectable } from '@nestjs/common';

import {
  ExtractionInput,
  ExtractionResult,
  ReceiptExtractor,
} from './receipt-extractor.interface';

const MOCK_MERCHANTS = [
  'Circle K',
  'GS25',
  'WinMart+',
  'Bách Hoá Xanh',
  'The Coffee House',
  'Highlands Coffee',
];

/** Mô phỏng tỉ lệ OCR thật thỉnh thoảng đọc lỗi (ảnh mờ, thiếu góc...), để luồng FAILED có thể tái hiện. */
const MOCK_FAILURE_RATE = 0.1;
const MIN_AMOUNT = 20_000;
const MAX_AMOUNT = 500_000;
const MAX_DAYS_AGO = 3;
const MIN_CONFIDENCE = 0.6;

/**
 * Extractor giả lập cho giai đoạn 1 - KHÔNG đọc nội dung ảnh thật, chỉ sinh
 * dữ liệu ngẫu nhiên hợp lý để luồng upload -> draft -> confirm chạy được
 * đầu-cuối trong lúc chưa tích hợp OCR/AI. Xem ReceiptExtractor để biết cách
 * thay bằng implementation gọi OCR thật sau này.
 */
@Injectable()
export class MockReceiptExtractorService implements ReceiptExtractor {
  extract(input: ExtractionInput): Promise<ExtractionResult> {
    // Mock chưa thật sự đọc file - `input` chỉ có ý nghĩa với implementation OCR thật sau này.
    void input;

    if (Math.random() < MOCK_FAILURE_RATE) {
      return Promise.reject(
        new Error(
          'Không đọc được nội dung hoá đơn (ảnh mờ hoặc thiếu thông tin) - kết quả mô phỏng.',
        ),
      );
    }

    const merchant =
      MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)];
    const totalAmount =
      Math.round(
        (MIN_AMOUNT + Math.random() * (MAX_AMOUNT - MIN_AMOUNT)) / 1000,
      ) * 1000;
    const date = new Date();
    date.setDate(
      date.getDate() - Math.floor(Math.random() * (MAX_DAYS_AGO + 1)),
    );
    const confidence =
      Math.round(
        (MIN_CONFIDENCE + Math.random() * (1 - MIN_CONFIDENCE)) * 100,
      ) / 100;

    return Promise.resolve({ merchant, date, totalAmount, confidence });
  }
}
