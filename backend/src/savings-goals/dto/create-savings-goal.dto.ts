import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
  MaxLength,
} from 'class-validator';

import { GoalStatus } from '../enums/goal-status.enum';

export class CreateSavingsGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /** Số tiền mục tiêu, VND, số nguyên dương. */
  @IsInt()
  @IsPositive()
  targetAmount!: number;

  /** Số tiền đã có sẵn, VND. Mặc định 0. */
  @IsOptional()
  @IsInt()
  @Min(0)
  currentAmount?: number;

  /** Ngày mục tiêu (ISO 8601), optional - bỏ trống nếu chưa có hạn. */
  @IsOptional()
  @Type(() => String)
  @IsISO8601()
  targetDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'color phải là mã hex dạng #rrggbb',
  })
  color?: string;

  @IsOptional()
  @IsEnum(GoalStatus, {
    message: `status phải là một trong: ${Object.values(GoalStatus).join(', ')}`,
  })
  status?: GoalStatus;
}
