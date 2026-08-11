import { IsOptional, Matches } from 'class-validator';

export class QueryDashboardSummaryDto {
  /** Định dạng YYYY-MM. Bỏ trống thì mặc định lấy tháng hiện tại. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month phải có định dạng YYYY-MM',
  })
  month?: string;
}
