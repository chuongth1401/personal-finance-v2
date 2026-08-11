import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

/** Mọi trường đều optional - chỉ các trường có mặt trong body mới được cập nhật. */
export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month phải có định dạng YYYY-MM',
  })
  month?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  limitAmount?: number;
}
