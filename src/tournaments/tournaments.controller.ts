import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { TournamentsService } from './tournaments.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { UpdateTournamentAndOpenDto } from './dto/update-tournament-and-open.dto'
import { TeamsDto } from './dto/add-teams-and-players.dto'
import { AddPlayersDto } from './dto/add-players.dto'
import { UpdateMatchAmericanoDto } from './dto/update-match-americano.dto'
import { SubscribeDto, ApproveSubscriberDto } from './dto/subscribe.dto'

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get('complex')
  getAllTournamentsByComplexId(@Query('id') complexId: string) {
    return this.tournamentsService.getTournamentsByComplexId(complexId)
  }

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

  @Auth(Role.USER)
  @Get('user/:id')
  getTournamentByUserId(@Param('id') userId: string) {
    return this.tournamentsService.getTournamentByUserId(userId)
  }

  // ========== AMERICANO ========== //

  @Auth(Role.OWNER)
  @Post('add-players/:id')
  addPlayers(@Param('id') tournamentId: string, @Body() playersData: AddPlayersDto) {
    return this.tournamentsService.addPlayers(tournamentId, playersData)
  }

  @Auth(Role.OWNER)
  @Post('generate-schedule/:id')
  generateSchedule(@Param('id') tournamentId: string) {
    return this.tournamentsService.generateScheduleAmericano(tournamentId)
  }

  @Auth(Role.OWNER)
  @Patch('match/:id')
  updateMatch(@Param('id') tournamentId: string, @Body() matchData: UpdateMatchAmericanoDto) {
    return this.tournamentsService.updateMatchAmericano(
      tournamentId,
      matchData.matchIndex,
      matchData,
    )
  }

  @Auth(Role.USER)
  @Get('schedule/:id')
  getSchedule(@Param('id') tournamentId: string) {
    return this.tournamentsService.getScheduleAmericano(tournamentId)
  }

  @Auth(Role.USER)
  @Get('ranking/:id')
  getRanking(@Param('id') tournamentId: string) {
    return this.tournamentsService.getRankingAmericano(tournamentId)
  }

  // ========== SUBSCRIPTIONS ========== //

  @Auth(Role.USER)
  @Post('subscribe/:id')
  subscribe(
    @Param('id') tournamentId: string,
    @Body() subscribeData: SubscribeDto,
    @ActiveUser() user: IUserActive,
  ) {
    return this.tournamentsService.subscribe(tournamentId, subscribeData.userId || user.sub)
  }

  @Auth(Role.USER)
  @Get('subscribe-status/:id')
  getMySubscriptionStatus(@Param('id') tournamentId: string, @ActiveUser() user: IUserActive) {
    return this.tournamentsService.getMySubscriptionStatus(tournamentId, user.sub)
  }

  @Auth(Role.OWNER)
  @Get('subscribers/:id')
  getSubscribers(@Param('id') tournamentId: string) {
    return this.tournamentsService.getSubscribers(tournamentId)
  }

  @Auth(Role.OWNER)
  @Patch('subscribers/:id/:userId')
  manageSubscriber(
    @Param('id') tournamentId: string,
    @Param('userId') targetUserId: string,
    @Body() actionData: ApproveSubscriberDto,
    @ActiveUser() user: IUserActive,
  ) {
    return this.tournamentsService.approveSubscriber(
      tournamentId,
      user.sub,
      targetUserId,
      actionData.action,
    )
  }

  @Auth(Role.OWNER)
  @Post('add-approved-users/:id')
  addApprovedUsers(@Param('id') tournamentId: string, @ActiveUser() user: IUserActive) {
    return this.tournamentsService.addApprovedUsers(tournamentId, user.sub)
  }
}
