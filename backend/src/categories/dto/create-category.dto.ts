import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { CategoryKind } from '../enums/category-kind.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(CategoryKind, {
    message: `kind phải là một trong: ${Object.values(CategoryKind).join(', ')}`,
  })
  kind!: CategoryKind;

  /** Mã màu hex, dùng để hiển thị badge/biểu đồ. */
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'color phải là mã hex dạng #rrggbb',
  })
  color!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
