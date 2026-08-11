import { IsOptional, Matches } from 'class-validator';

export class QueryInsightsDto {
  /** Định dạng YYYY-MM, optional - bỏ trống để xem insight của mọi kỳ. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month phải có định dạng YYYY-MM',
  })
  month?: string;
}
