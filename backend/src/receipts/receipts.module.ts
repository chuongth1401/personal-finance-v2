import { Module } from '@nestjs/common';

import { TransactionsModule } from '../transactions/transactions.module';
import { MockReceiptExtractorService } from './extraction/mock-receipt-extractor.service';
import { RECEIPT_EXTRACTOR } from './extraction/receipt-extractor.interface';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { FILE_STORAGE } from './storage/file-storage.interface';
import { LocalFileStorageService } from './storage/local-file-storage.service';

@Module({
  imports: [TransactionsModule],
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    { provide: FILE_STORAGE, useClass: LocalFileStorageService },
    { provide: RECEIPT_EXTRACTOR, useClass: MockReceiptExtractorService },
  ],
})
export class ReceiptsModule {}
