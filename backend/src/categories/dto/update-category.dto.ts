import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { CategoryKind } from '../enums/category-kind.enum';

/** Mọi trường đều optional - chỉ các trường có mặt trong body mới được cập nhật. */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(CategoryKind, {
    message: `kind phải là một trong: ${Object.values(CategoryKind).join(', ')}`,
  })
  kind?: CategoryKind;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'color phải là mã hex dạng #rrggbb',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
