import type { Readable } from 'node:stream';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface SaveFileInput {
  buffer: Buffer;
  userId: string;
  originalName: string;
}

/**
 * Trừu tượng hoá nơi lưu file, để đổi từ local disk sang cloud storage (S3,
 * Cloud Storage...) sau này chỉ cần viết thêm 1 implementation mới của
 * interface này và đổi provider trong ReceiptsModule - không đụng vào
 * ReceiptsService hay bất kỳ chỗ nào khác gọi tới nó.
 */
export interface FileStorageService {
  /** Lưu file, trả về storage key (path tương đối cho local; sẽ là object key khi dùng cloud). */
  save(input: SaveFileInput): Promise<string>;
  /** Đọc file theo storage key, dùng để phục vụ nội dung qua endpoint riêng của backend. */
  createReadStream(key: string): Readable;
  /** Xoá file theo storage key. */
  delete(key: string): Promise<void>;
}
