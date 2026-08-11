import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  /** Định dạng YYYY-MM. */
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month phải có định dạng YYYY-MM',
  })
  month!: string;

  /** Hạn mức VND, số nguyên dương. */
  @IsInt()
  @IsPositive()
  limitAmount!: number;
}
