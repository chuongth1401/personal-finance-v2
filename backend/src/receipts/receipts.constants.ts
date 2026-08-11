/** Giới hạn dung lượng file hoá đơn: 5 MB. */
export const MAX_RECEIPT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Chỉ chấp nhận ảnh JPG, PNG hoặc WebP. */
export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_RECEIPT_MIME_REGEX = /^image\/(jpeg|png|webp)$/;
