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
  ValidateIf,
} from 'class-validator';

import { GoalStatus } from '../enums/goal-status.enum';

/**
 * Mọi trường đều optional - chỉ các trường có mặt trong body mới được cập nhật.
 * targetDate chấp nhận `null` tường minh để xoá hạn mục tiêu hiện có.
 */
export class UpdateSavingsGoalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  targetAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  targetDate?: string | null;

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
