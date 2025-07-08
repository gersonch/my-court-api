import { Body, Controller, Delete, Param, Post } from '@nestjs/common'
import { TournamentsService } from './tournaments.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { CreateTournamentDto } from './dto/create-tournament.dto'

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Auth(Role.OWNER)
  @Post()
  createTournament(@Body() tournamentData: CreateTournamentDto, @ActiveUser() user: IUserActive) {
    return this.tournamentsService.createTournament(tournamentData, user.sub)
  }

  @Auth(Role.OWNER)
  @Delete('delete/:id')
  deleteTournament(@Param('id') tournamentId: string, @ActiveUser() user: IUserActive) {
    return this.tournamentsService.deleteTournament(tournamentId, user.sub)
  }
}
