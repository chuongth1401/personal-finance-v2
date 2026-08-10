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
} from 'class-validator';

import { TransactionType } from '../enums/transaction-type.enum';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  /** Chỉ dùng khi type = TRANSFER (tài khoản nhận tiền). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  toAccountId?: string;

  /** Bỏ trống với giao dịch TRANSFER. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsEnum(TransactionType, {
    message: `type phải là một trong: ${Object.values(TransactionType).join(', ')}`,
  })
  type!: TransactionType;

  /** Số tiền VND, số nguyên dương. */
  @IsInt()
  @IsPositive()
  amount!: number;

  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
