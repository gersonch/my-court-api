import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { TournamentsService } from './tournaments.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { UpdateTournamentAndOpenDto } from './dto/update-tournament-and-open.dto'
import { TeamsDto } from './dto/add-teams-and-players.dto'

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

  @Auth(Role.OWNER)
  @Patch('open/:id')
  openTournament(
    @Param('id') tournamentId: string,
    @ActiveUser() user: IUserActive,
    @Body() updateTournamentDto: UpdateTournamentAndOpenDto,
  ) {
    return this.tournamentsService.updateAndOpenTournament(
      tournamentId,
      user.sub, //
      updateTournamentDto,
    )
  }

  @Auth(Role.OWNER)
  @Patch('add-teams/:id')
  async createTeams(@Param('id') tournamentId: string, @Body() teamsDto: TeamsDto) {
    const tournament = await this.tournamentsService.getTournamentById(tournamentId)
    const sport = tournament.sport
    return this.tournamentsService.createTeams(tournamentId, sport, teamsDto)
  }

  @Auth(Role.OWNER)
  @Get('teams/:id')
  async getTeams(@Param('id') tournamentId: string) {
    return this.tournamentsService.getTeamsForTournament(tournamentId)
  }
}
