import { IsNotEmpty, Matches } from 'class-validator';

export class QueryBudgetDto {
  /** Định dạng YYYY-MM, bắt buộc - dùng để tính spentAmount trong tháng. */
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month phải có định dạng YYYY-MM',
  })
  month!: string;
}
