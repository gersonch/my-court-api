import { IsString } from 'class-validator'

export class CreateTournamentDto {
  @IsString()
  name: string

  @IsString()
  sport: 'futbol' | 'padel'
}
