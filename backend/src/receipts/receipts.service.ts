import type { Readable } from 'node:stream';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Receipt } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { TransactionsService } from '../transactions/transactions.service';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';
import { ReceiptStatus } from './enums/receipt-status.enum';
import { RECEIPT_EXTRACTOR } from './extraction/receipt-extractor.interface';
import type { ReceiptExtractor } from './extraction/receipt-extractor.interface';
import { ReceiptResponse } from './interfaces/receipt-response.interface';
import { FILE_STORAGE } from './storage/file-storage.interface';
import type { FileStorageService } from './storage/file-storage.interface';

export interface ReceiptFileStream {
  stream: Readable;
  mimeType: string;
  fileName: string;
}

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageService,
    @Inject(RECEIPT_EXTRACTOR) private readonly extractor: ReceiptExtractor,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ReceiptResponse> {
    const key = await this.fileStorage.save({
      buffer: file.buffer,
      userId,
      originalName: file.originalname,
    });

    const receipt = await this.prisma.receipt.create({
      data: {
        userId,
        fileUrl: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: ReceiptStatus.UPLOADED,
      },
    });

    // Giai đoạn 1: xử lý ngay đồng bộ bằng mock extractor. Khi có OCR/AI thật
    // và cần xử lý lâu hơn, đây là chỗ để đẩy job vào hàng đợi (BullMQ...)
    // thay vì await trực tiếp trong request - state machine UPLOADED ->
    // PROCESSING -> COMPLETED/FAILED đã sẵn sàng cho việc đó.
    return this.processReceipt(receipt.id);
  }

  async findAll(
    userId: string,
    status?: ReceiptStatus,
  ): Promise<ReceiptResponse[]> {
    const receipts = await this.prisma.receipt.findMany({
      where: { userId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
    });
    return receipts.map((r) => this.toResponse(r));
  }

  async findOne(userId: string, id: string): Promise<ReceiptResponse> {
    return this.toResponse(await this.findOwned(userId, id));
  }

  async getFileStream(userId: string, id: string): Promise<ReceiptFileStream> {
    const receipt = await this.findOwned(userId, id);
    return {
      stream: this.fileStorage.createReadStream(receipt.fileUrl),
      mimeType: receipt.mimeType ?? 'application/octet-stream',
      fileName: receipt.fileName ?? `${receipt.id}`,
    };
  }

  /**
   * Xác nhận hoá đơn thành giao dịch chính thức. Tái dùng
   * TransactionsService.create() để có đầy đủ validate account/category có
   * sẵn, tránh lặp lại logic. Chỉ tạo Transaction tại đây - không có chỗ nào
   * khác trong ReceiptModule tự ý tạo/sửa Transaction.
   */
  async confirm(
    userId: string,
    id: string,
    dto: ConfirmReceiptDto,
  ): Promise<ReceiptResponse> {
    const receipt = await this.findOwned(userId, id);

    if (receipt.status === (ReceiptStatus.CONFIRMED as string)) {
      throw new ConflictException(
        'Hoá đơn này đã được xác nhận thành giao dịch trước đó.',
      );
    }
    if (receipt.status !== (ReceiptStatus.COMPLETED as string)) {
      throw new BadRequestException(
        `Chỉ có thể xác nhận hoá đơn ở trạng thái COMPLETED (hiện tại: ${receipt.status}).`,
      );
    }

    const amount = dto.amount ?? receipt.amount;
    if (!amount) {
      throw new BadRequestException(
        'Không có số tiền để tạo giao dịch - vui lòng nhập amount.',
      );
    }

    const transaction = await this.transactionsService.create(userId, {
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      type: TransactionType.EXPENSE,
      amount,
      date: dto.date ?? receipt.issuedAt ?? new Date(),
      description:
        dto.description ?? receipt.merchantName ?? 'Giao dịch từ hoá đơn',
      note: dto.note,
    });

    const updated = await this.prisma.receipt.update({
      where: { id },
      data: { transactionId: transaction.id, status: ReceiptStatus.CONFIRMED },
    });

    return this.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const receipt = await this.findOwned(userId, id);
    await this.fileStorage.delete(receipt.fileUrl);
    await this.prisma.receipt.delete({ where: { id } });
  }

  private async processReceipt(id: string): Promise<ReceiptResponse> {
    const processing = await this.prisma.receipt.update({
      where: { id },
      data: { status: ReceiptStatus.PROCESSING },
    });

    try {
      const result = await this.extractor.extract({
        storageKey: processing.fileUrl,
        mimeType: processing.mimeType,
      });
      const completed = await this.prisma.receipt.update({
        where: { id },
        data: {
          status: ReceiptStatus.COMPLETED,
          merchantName: result.merchant,
          issuedAt: result.date,
          amount: result.totalAmount,
          confidence: result.confidence,
          errorMessage: null,
        },
      });
      return this.toResponse(completed);
    } catch (error) {
      const failed = await this.prisma.receipt.update({
        where: { id },
        data: {
          status: ReceiptStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : 'Không thể xử lý hoá đơn.',
        },
      });
      return this.toResponse(failed);
    }
  }

  private async findOwned(userId: string, id: string): Promise<Receipt> {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, userId },
    });
    if (!receipt) {
      throw new NotFoundException(`Không tìm thấy hoá đơn: ${id}`);
    }
    return receipt;
  }

  private toResponse(receipt: Receipt): ReceiptResponse {
    return {
      id: receipt.id,
      userId: receipt.userId,
      transactionId: receipt.transactionId,
      fileUrl: `/receipts/${receipt.id}/file`,
      fileName: receipt.fileName,
      mimeType: receipt.mimeType,
      fileSize: receipt.fileSize,
      status: receipt.status as ReceiptStatus,
      merchantName: receipt.merchantName,
      amount: receipt.amount,
      issuedAt: receipt.issuedAt,
      confidence: receipt.confidence,
      errorMessage: receipt.errorMessage,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
    };
  }
}
