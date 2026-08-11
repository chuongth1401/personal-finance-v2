import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';

import { FileStorageService, SaveFileInput } from './file-storage.interface';

/**
 * Lưu file trên đĩa cục bộ của server - phù hợp cho dev/single-instance.
 * KHÔNG phù hợp khi deploy nhiều instance/container ephemeral (mỗi lần
 * restart/scale sẽ mất file, các instance không chia sẻ đĩa với nhau).
 * Xem ghi chú "hướng chuyển sang cloud storage" ở README/PR liên quan.
 */
@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly rootDir = path.join(process.cwd(), 'uploads', 'receipts');

  async save(input: SaveFileInput): Promise<string> {
    const extension = this.resolveExtension(input.originalName);
    const key = path.posix.join(input.userId, `${randomUUID()}${extension}`);
    const absolutePath = this.toAbsolutePath(key);

    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, input.buffer);

    return key;
  }

  createReadStream(key: string): Readable {
    return fs.createReadStream(this.toAbsolutePath(key));
  }

  async delete(key: string): Promise<void> {
    await fs.promises.rm(this.toAbsolutePath(key), { force: true });
  }

  private toAbsolutePath(key: string): string {
    return path.join(this.rootDir, key);
  }

  private resolveExtension(originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    return /^\.(jpe?g|png|webp)$/.test(extension) ? extension : '';
  }
}
