import { IsEnum, IsInt, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class ConfigDto {
  @IsInt()
  teamsCount: number

  @ValidateIf((o) => o.tipoTorneo === 'americano')
  @IsInt()
  @IsOptional()
  rounds?: number

  @ValidateIf((o) => o.tipoTorneo === 'americano')
  @IsInt()
  @IsOptional()
  courtCount?: number

  @ValidateIf((o) => o.tipoTorneo === 'playoff')
  @IsInt()
  @IsOptional()
  playoffsRounds?: number
}

export class CreateTournamentDto {
  @IsString()
  name: string

  @IsEnum(['futbol', 'padel'])
  sport: 'futbol' | 'padel'

  @IsEnum(['liga', 'playoff', 'americano'])
  tipoTorneo: 'liga' | 'playoff' | 'americano'

  @ValidateNested()
  @Type(() => ConfigDto)
  config: ConfigDto

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  startDate?: Date

  @IsOptional()
  endDate?: Date
}
