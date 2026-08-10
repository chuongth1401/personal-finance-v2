import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string | string[];
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}

/** Chuyển lỗi HTTP từ backend NestJS (ValidationPipe/HttpException) thành thông báo dễ đọc. */
export function extractErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  const body: unknown = error.error;
  if (isApiErrorBody(body) && body.message) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }

  return `Đã xảy ra lỗi (mã ${error.status}).`;
}
