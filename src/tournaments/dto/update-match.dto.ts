import { IsDateString, IsEnum, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator'
import { Types } from 'mongoose'

export class UpdateMatchDto {
  @IsString()
  matchId: string

  @IsOptional()
  @IsInt()
  scoreA?: number

  @IsOptional()
  @IsInt()
  scoreB?: number

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'finished'])
  status?: 'pending' | 'in_progress' | 'finished'

  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsString()
  startTime?: string

  @IsOptional()
  @IsString()
  endTime?: string

  @ValidateIf((o) => o.fieldId !== undefined)
  @IsString()
  fieldId?: string
}
