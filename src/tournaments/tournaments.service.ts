import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ITournament } from 'src/types/tournaments'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { User } from 'src/types/user'
import { Complex } from 'src/types/complexes'
import { UpdateTournamentAndOpenDto } from './dto/update-tournament-and-open.dto'
import { TeamsDto } from './dto/add-teams-and-players.dto'

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel('Tournament') private tournamentModel: Model<ITournament>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Complex') private complexModel: Model<Complex>,
  ) {}

  getTournamentById = async (tournamentId: string) => {
    const tournament = await this.tournamentModel.findById(tournamentId)
    if (!tournament) {
      throw new BadRequestException('Tournament not found')
    }
    return tournament
  }

  // -- getComplexByOwner -- //
  private getComplexByOwner = async (userId: string) => {
    const getComplexIdByOwner = await this.complexModel.findOne({ owner: userId })
    if (!getComplexIdByOwner) {
      throw new BadRequestException('User does not own a complex')
    }
    return getComplexIdByOwner
  }

  // -- getTournamentsByComplex -- //
  getTournamentsByComplex = async (complexId: string) => {
    const tournaments = await this.tournamentModel.find({ complexId })
    if (!tournaments || tournaments.length === 0) {
      throw new BadRequestException('No tournaments found for this complex')
    }
    return tournaments
  }
  // -- createTournament -- //
  async createTournament(
    tournamentData: CreateTournamentDto,
    userId: string, //d
  ): Promise<ITournament> {
    const { name, sport } = tournamentData
    if (!name || !sport) {
      throw new BadRequestException('Tournament name and sport are required')
    }
    // no nombres duplicados
    const existingTournament = await this.tournamentModel.findOne({ name })
    if (existingTournament) {
      throw new BadRequestException('Tournament with this name already exists')
    }

    const getComplexByOwner = await this.getComplexByOwner(userId)

    const newTournament = new this.tournamentModel({
      name,
      sport,
      complexId: getComplexByOwner._id.toString(),
    })
    return newTournament.save()
  }
  // -- deleteTournament -- //
  async deleteTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const complex = await this.getComplexByOwner(userId)
    if (!complex) {
      throw new BadRequestException('User does not own a complex')
    }

    const tournament = await this.tournamentModel.findOne({ complexId: complex._id })
    if (!tournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }
    if (tournament.state !== 'inactive') {
      throw new BadRequestException('Tournament must be inactive to delete')
    }

    const deletedTournament = await this.tournamentModel.findOneAndDelete({
      _id: tournamentId,
    })
    if (!deletedTournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }
    return deletedTournament
  }
  // -- Update and Open Tournament --//
  async updateAndOpenTournament(
    tournamentId: string,
    userId: string,
    data: UpdateTournamentAndOpenDto,
  ): Promise<UpdateTournamentAndOpenDto> {
    const complex = await this.getComplexByOwner(userId)
    const tournament = await this.tournamentModel.findOne({ complexId: complex._id })

    if (!tournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }

    if (tournament.state !== 'inactive') {
      throw new BadRequestException('Tournament must be inactive to update and open')
    }

    const updatedTournament = await this.tournamentModel.findOneAndUpdate(
      { _id: tournamentId, complexId: complex._id },
      {
        ...data,
        state: 'open', // Ensure the state is set to 'open'
      },
      { new: true, runValidators: true },
    )

    // Assuming UpdateTournamentAndOpenDto matches the tournament document structure
    return updatedTournament as unknown as UpdateTournamentAndOpenDto
  }

  async createTeams(tournamentId: string, sport: string, teamsDto: TeamsDto) {
    const tournament = await this.getTournamentById(tournamentId)
    if (tournament.state !== 'open') {
      throw new BadRequestException('Tournament must be open to add teams')
    }
    const processedTeams: Array<{
      name: string
      players: Array<{
        userId: string
        position: string
        stats: Record<string, any>
      }>
    }> = []

    const allUserIds: string[] = []

    for (const team of teamsDto.teams) {
      // Validar cantidad de jugadores según deporte
      if (sport === 'padel' && team.players.length !== 2) {
        throw new BadRequestException('En pádel el equipo debe tener exactamente 2 jugadores.')
      }

      let teamName = team.name

      // Generar nombre automático en pádel
      if (sport === 'padel') {
        const playerNames = await Promise.all(
          team.players.map(async (player) => {
            const user = (await this.userModel.findById(player.userId).exec()) as User | null
            if (!user) {
              throw new BadRequestException(`Jugador con ID ${player.userId} no encontrado.`)
            }

            return user?.name || 'Jugador desconocido'
          }),
        )

        teamName = `${playerNames[0]} / ${playerNames[1]}`
      }

      for (const player of team.players) {
        const user = await this.userModel.findById(player.userId).exec()
        if (!user) {
          throw new BadRequestException(`Jugador con ID ${player.userId} no encontrado.`)
        }
        allUserIds.push(player.userId)
      }

      processedTeams.push({
        name: teamName,
        players: team.players.map((player) => ({
          userId: player.userId,
          position: player.position || '',
          stats: this.defaultStatsForSport(sport),
        })),
      })
    }

    const uniqueUserIds = new Set(allUserIds)
    if (uniqueUserIds.size === allUserIds.length) {
      throw new BadRequestException('Los jugadores deben ser únicos en el torneo.')
    }

    console.log('All User IDs:', allUserIds)
    console.log('Unique User IDs:', uniqueUserIds)
    // Aquí haces el update al torneo
    // Por ejemplo usando Mongoose directamente:
    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $push: { teams: processedTeams },
    })
  }

  private defaultStatsForSport(sport: string): Record<string, any> {
    if (sport === 'futbol') {
      return { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
    }

    if (sport === 'padel') {
      return { aces: 0, doubleFaults: 0, winners: 0 }
    }

    return {}
  }

  async getTeamsForTournament(tournamentId: string) {
    const tournament = await this.tournamentModel.findById(tournamentId)
    if (!tournament) {
      throw new BadRequestException('Tournament not found')
    }
    if (!tournament.teams || tournament.teams.length === 0) {
      throw new BadRequestException('No teams found for this tournament')
    }
    return tournament.teams
  }
}
