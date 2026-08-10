import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { TransactionType } from '../enums/transaction-type.enum';

/**
 * Mọi trường đều optional - chỉ các trường có mặt trong body mới được cập nhật.
 * toAccountId/categoryId chấp nhận `null` tường minh để xoá quan hệ hiện có
 * (vd. đổi type từ TRANSFER sang EXPENSE thì cần xoá toAccountId).
 */
export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  toAccountId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  categoryId?: string | null;

  @IsOptional()
  @IsEnum(TransactionType, {
    message: `type phải là một trong: ${Object.values(TransactionType).join(', ')}`,
  })
  type?: TransactionType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
