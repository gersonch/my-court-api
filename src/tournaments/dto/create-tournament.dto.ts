import { IsEnum, IsInt, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

class ConfigDto {
  @ApiProperty({ example: 4, description: 'Cantidad de equipos' })
  @IsInt()
  teamsCount: number

  @ApiProperty({ example: 3, description: 'Rondas (americano)', required: false })
  @ValidateIf((o) => o.tournamentType === 'americano')
  @IsInt()
  @IsOptional()
  rounds?: number

  @ApiProperty({ example: 1, description: 'Canchas (americano)', required: false })
  @ValidateIf((o) => o.tournamentType === 'americano')
  @IsInt()
  @IsOptional()
  courtCount?: number

  @ApiProperty({ example: 3, description: 'Playoff rounds (2=4, 3=8, 4=16)', required: false })
  @ValidateIf((o) => o.tournamentType === 'playoff')
  @IsInt()
  @IsOptional()
  playoffsRounds?: number
}

export class CreateTournamentDto {
  @ApiProperty({ example: 'Torneo Americano Weekend', description: 'Nombre del torneo' })
  @IsString()
  name: string

  @ApiProperty({ example: 'padel', description: 'Deporte', enum: ['futbol', 'padel'] })
  @IsEnum(['futbol', 'padel'])
  sport: 'futbol' | 'padel'

  @ApiProperty({
    example: 'americano',
    description: 'Tipo',
    enum: ['liga', 'playoff', 'americano'],
  })
  @IsEnum(['liga', 'playoff', 'americano'])
  tournamentType: 'liga' | 'playoff' | 'americano'

  @ApiProperty({ description: 'Config', type: ConfigDto, required: false })
  @ValidateNested()
  @Type(() => ConfigDto)
  config?: ConfigDto

  @ApiProperty({ example: 'Primera división', description: 'Categoría', required: false })
  @IsOptional()
  @IsString()
  category?: string

  @ApiProperty({ example: '2026-05-01', description: 'Fecha inicio', required: false })
  @IsOptional()
  startDate?: Date

  @ApiProperty({ example: '2026-05-15', description: 'Fecha fin', required: false })
  @IsOptional()
  endDate?: Date
}
