import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { AccountType } from '../enums/account-type.enum';

/** Mọi trường đều optional - chỉ các trường có mặt trong body mới được cập nhật. */
export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(AccountType, {
    message: `type phải là một trong: ${Object.values(AccountType).join(', ')}`,
  })
  type?: AccountType;

  @IsOptional()
  @IsInt()
  balance?: number;
}
