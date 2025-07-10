import { IsDate, IsString } from 'class-validator'

export class UpdateTournamentAndOpenDto {
  @IsString()
  category: string

  @IsDate()
  startDate: Date

  @IsDate()
  endDate: Date
}
