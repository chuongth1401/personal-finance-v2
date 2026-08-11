import { IsEnum, IsOptional } from 'class-validator';

import { ReceiptStatus } from '../enums/receipt-status.enum';

export class QueryReceiptsDto {
  @IsOptional()
  @IsEnum(ReceiptStatus, {
    message: `status phải là một trong: ${Object.values(ReceiptStatus).join(', ')}`,
  })
  status?: ReceiptStatus;
}
