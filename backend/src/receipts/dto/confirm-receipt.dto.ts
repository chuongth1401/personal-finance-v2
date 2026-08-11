import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Xác nhận hoá đơn thành giao dịch chính thức (luôn là EXPENSE - hoá đơn
 * mặc nhiên là một khoản chi). Các trường optional dùng để người dùng sửa
 * lại dữ liệu draft do extractor trích xuất trước khi lưu chính thức.
 */
export class ConfirmReceiptDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  /** Ghi đè amount trích xuất được, nếu người dùng chỉnh sửa trước khi xác nhận. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  /** Ghi đè description, mặc định lấy từ merchantName trích xuất được. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  /** Ghi đè ngày giao dịch, mặc định lấy từ issuedAt trích xuất được. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
