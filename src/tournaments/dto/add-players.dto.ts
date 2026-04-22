import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class PlayerDataDto {
  @IsString()
  userId: string

  @IsOptional()
  @IsString()
  position?: string
}

export class AddPlayersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerDataDto)
  players: PlayerDataDto[]
}
