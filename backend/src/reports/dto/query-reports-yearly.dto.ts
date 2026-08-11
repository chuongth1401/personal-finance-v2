import { IsNotEmpty, Matches } from 'class-validator';

export class QueryReportsYearlyDto {
  /** Định dạng YYYY, bắt buộc. */
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'year phải có định dạng YYYY' })
  year!: string;
}
