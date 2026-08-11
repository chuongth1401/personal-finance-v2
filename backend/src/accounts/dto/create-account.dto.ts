import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { AccountType } from '../enums/account-type.enum';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(AccountType, {
    message: `type phải là một trong: ${Object.values(AccountType).join(', ')}`,
  })
  type!: AccountType;

  /** Số dư ban đầu, VND. Có thể âm với thẻ tín dụng đang nợ. */
  @IsOptional()
  @IsInt()
  balance?: number;
}
