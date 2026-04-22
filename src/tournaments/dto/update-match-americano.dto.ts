import { IsBoolean, IsInt, IsOptional } from 'class-validator'

export class UpdateMatchAmericanoDto {
  @IsInt()
  matchIndex: number

  @IsOptional()
  @IsInt()
  pointsA?: number

  @IsOptional()
  @IsInt()
  pointsB?: number

  @IsOptional()
  @IsBoolean()
  isFinished?: boolean
}
