import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

class PlayerDataDto {
  @ApiProperty({ example: 'user-123', description: 'ID del usuario' })
  @IsString()
  userId: string

  @ApiProperty({ example: 'reves', description: 'Posición', required: false })
  @IsOptional()
  @IsString()
  position?: string
}

export class AddPlayersDto {
  @ApiProperty({ description: 'Jugadores', type: () => [PlayerDataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerDataDto)
  players: PlayerDataDto[]
}
