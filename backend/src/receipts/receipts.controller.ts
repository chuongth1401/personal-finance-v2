import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfirmReceiptDto } from './dto/confirm-receipt.dto';
import { QueryReceiptsDto } from './dto/query-receipts.dto';
import {
  ALLOWED_RECEIPT_MIME_REGEX,
  MAX_RECEIPT_FILE_SIZE_BYTES,
} from './receipts.constants';
import { ReceiptsService } from './receipts.service';
import { ReceiptResponse } from './interfaces/receipt-response.interface';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_RECEIPT_FILE_SIZE_BYTES },
    }),
  )
  upload(
    @CurrentUser() userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: ALLOWED_RECEIPT_MIME_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_RECEIPT_FILE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ): Promise<ReceiptResponse> {
    return this.receiptsService.upload(userId, file);
  }

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query() query: QueryReceiptsDto,
  ): Promise<ReceiptResponse[]> {
    return this.receiptsService.findAll(userId, query.status);
  }

  @Get(':id')
  findOne(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<ReceiptResponse> {
    return this.receiptsService.findOne(userId, id);
  }

  @Get(':id/file')
  async getFile(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, mimeType, fileName } =
      await this.receiptsService.getFileStream(userId, id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    });
    return new StreamableFile(stream);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmReceiptDto,
  ): Promise<ReceiptResponse> {
    return this.receiptsService.confirm(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.receiptsService.remove(userId, id);
  }
}
