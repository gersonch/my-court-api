import { Type } from 'class-transformer'
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'

export class PlayerDto {
  @IsString()
  userId: string

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  stats?: Record<string, any>
}

export class TeamDto {
  @IsString()
  name: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players: PlayerDto[]
}

export class TeamsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamDto)
  teams: TeamDto[]
}
