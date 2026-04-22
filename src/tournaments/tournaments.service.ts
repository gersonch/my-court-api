import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ITournament } from 'src/types/tournaments'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { User, IUserLean } from 'src/types/user'
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

  getTournamentsByComplexId = async (complexId: string): Promise<ITournament[]> => {
    // only name, id, and status = open of tournaments
    const tournaments = await this.tournamentModel.find(
      { complexId, state: 'open' },
      { name: 1, _id: 1, state: 1 },
    )
    return tournaments
  }

  getTournamentById = async (tournamentId: string): Promise<ITournament> => {
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
    userId: string,
  ): Promise<ITournament> {
    const { name, sport, tournamentType, config } = tournamentData
    if (!name || !sport) {
      throw new BadRequestException('Tournament name and sport are required')
    }

    // Validate tournamentType
    if (!tournamentType) {
      throw new BadRequestException('tournamentType is required')
    }

    // Validate: americano is ONLY for padel
    if (tournamentType === 'americano' && sport !== 'padel') {
      throw new BadRequestException('Americano tournaments are only allowed for padel')
    }

    // Validate: playoff teams must be 4, 8, or 16
    if (tournamentType === 'playoff') {
      const validTeamCounts = [4, 8, 16]
      if (!config?.teamsCount || !validTeamCounts.includes(config.teamsCount)) {
        throw new BadRequestException(
          `Playoff tournaments must have 4, 8, or 16 teams. Provided: ${config?.teamsCount}`,
        )
      }
    }

    // Validate: liga minimum 4 teams
    if (tournamentType === 'liga') {
      if (!config?.teamsCount || config.teamsCount < 4) {
        throw new BadRequestException('Liga tournaments must have at least 4 teams')
      }
    }

    // No duplicate names
    const existingTournament = await this.tournamentModel.findOne({ name })
    if (existingTournament) {
      throw new BadRequestException('Tournament with this name already exists')
    }

    const complex = await this.getComplexByOwner(userId)

    const newTournament = new this.tournamentModel({
      name,
      sport,
      tournamentType,
      config,
      complexId: complex._id.toString(),
      state: 'inactive',
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

    const { tournamentType, config } = tournament

    // Handle Americano: players are individual, not teams
    if (tournamentType === 'americano') {
      throw new BadRequestException(
        'For americano tournaments, use /tournaments/:id/add-players endpoint',
      )
    }

    // Handle Liga/Playoff: teams with players
    const processedTeams: Array<{
      name: string
      players: Array<{
        userId: string
        position: string
        stats: Record<string, any>
      }>
    }> = []

    const allUserIds: string[] = []

    // Collect all userIds first
    for (const team of teamsDto.teams) {
      // Validate players count for padel
      if (sport === 'padel' && team.players.length !== 2) {
        throw new BadRequestException('En pádel el equipo debe tener exactamente 2 jugadores.')
      }

      for (const player of team.players) {
        allUserIds.push(player.userId)
      }
    }

    // OPTIMIZATION: Single query with $in instead of N queries
    const users = (await this.userModel.find({ _id: { $in: allUserIds } }).lean()) as IUserLean[]

    // Validate all users exist
    const foundUserIds = new Set(users.map((u) => u._id.toString()))
    for (const userId of allUserIds) {
      if (!foundUserIds.has(userId)) {
        throw new BadRequestException(`Jugador con ID ${userId} no encontrado.`)
      }
    }

    // Create users map for quick lookup
    const usersMap = new Map(users.map((u) => [u._id.toString(), u]))

    // Process teams using the map
    for (const team of teamsDto.teams) {
      let teamName = team.name

      // Auto-generate name for padel
      if (sport === 'padel') {
        const playerNames = team.players.map((player) => {
          const user = usersMap.get(player.userId)
          return user?.name || 'Jugador desconocido'
        })
        teamName = `${playerNames[0]} / ${playerNames[1]}`
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

    // Validate unique players
    const uniqueUserIds = new Set(allUserIds)
    if (uniqueUserIds.size === allUserIds.length) {
      throw new BadRequestException('Los jugadores deben ser únicos en el torneo.')
    }

    // Validate teams count matches config
    if (tournamentType === 'playoff' && config?.teamsCount) {
      if (processedTeams.length !== config.teamsCount) {
        throw new BadRequestException(
          `Playoff requires exactly ${config.teamsCount} teams. Provided: ${processedTeams.length}`,
        )
      }
    }

    if (tournamentType === 'liga' && config?.teamsCount) {
      if (processedTeams.length > config.teamsCount) {
        throw new BadRequestException(
          `Liga maximum is ${config.teamsCount} teams. Provided: ${processedTeams.length}`,
        )
      }
    }

    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $push: { teams: processedTeams },
    })
  }

  // -- addPlayers (AMERICANO) -- //
  async addPlayers(
    tournamentId: string,
    playersData: { players: Array<{ userId: string; position?: string }> },
  ) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.tournamentType !== 'americano') {
      throw new BadRequestException('This endpoint is only for americano tournaments')
    }

    if (tournament.state !== 'open') {
      throw new BadRequestException('Tournament must be open to add players')
    }

    const config = tournament.config
    const players = playersData.players

    // Validate: even number of players
    if (players.length % 2 !== 0) {
      throw new BadRequestException('Americano requires an even number of players (4, 6, 8)')
    }

    // Validate: max players
    const validCounts = [4, 6, 8]
    if (!validCounts.includes(players.length)) {
      throw new BadRequestException(
        `Americano requires 4, 6, or 8 players. Provided: ${players.length}`,
      )
    }

    // Validate all users exist - OPTIMIZATION: single query with $in
    const allUserIds = players.map((p) => p.userId)
    const users = (await this.userModel.find({ _id: { $in: allUserIds } }).lean()) as IUserLean[]

    // Validate all users exist
    const foundUserIds = new Set(users.map((u) => u._id.toString()))
    for (const player of players) {
      if (!foundUserIds.has(player.userId)) {
        throw new BadRequestException(`User with ID ${player.userId} not found`)
      }
    }

    // Validate unique players
    if (new Set(allUserIds).size !== allUserIds.length) {
      throw new BadRequestException('Players must be unique')
    }

    // Create users map for quick lookup
    const usersMap = new Map(users.map((u) => [u._id.toString(), u]))

    // Store players in ranking (initial state)
    const ranking = players.map((player) => {
      const user = usersMap.get(player.userId)
      return {
        playerId: player.userId,
        playerName: user?.name || 'Unknown',
        points: 0,
        gamesPlayed: 0,
      }
    })

    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { ranking },
    })
  }

  // -- generateScheduleAmericano -- //
  async generateScheduleAmericano(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.tournamentType !== 'americano') {
      throw new BadRequestException('This method is only for americano tournaments')
    }

    if (tournament.state !== 'open') {
      throw new BadRequestException('Tournament must be open to generate schedule')
    }

    const config = tournament.config
    const ranking = tournament.ranking || []
    const courtCount = config?.courtCount || 1
    const rounds = config?.rounds || ranking.length - 1

    if (ranking.length === 0) {
      throw new BadRequestException('No players registered. Use addPlayers first.')
    }

    const playerCount = ranking.length

    // Generate schedule: round-robin (each pair vs each pair)
    // For N players, each player plays N-1 rounds
    const schedule: Array<{
      round: number
      courtNumber: number
      startTime: string
      coupleA: string[]
      coupleB: string[]
      pointsA: number
      pointsB: number
      isFinished: boolean
    }> = []

    // Round-robin algorithm for rotating pairs
    // For each round, each player pairs with another
    const players = [...Array(playerCount).keys()] // [0, 1, 2, ..., n-1]

    // Helper function: generate round-robin pairs for a round
    const generateRoundRobinPairs = (allPlayers: number[], roundNum: number): number[][] => {
      const n = allPlayers.length
      if (n % 2 !== 0) return []

      const rotated = [...allPlayers]
      // Rotate the array based on round number
      const first = rotated.shift()
      rotated.push(first!)

      const pairs: number[][] = []
      for (let i = 0; i < n / 2; i++) {
        pairs.push([rotated[i], rotated[n - 1 - i]])
      }
      return pairs
    }

    for (let round = 0; round < rounds; round++) {
      // Rotate pairs for this round
      const pairs = generateRoundRobinPairs(players, round)

      // Assign to courts (2 pairs per round = 1 match)
      let courtNumber = 1
      for (let i = 0; i < pairs.length; i += 2) {
        if (i + 1 < pairs.length) {
          const coupleA = pairs[i].map((idx: number) => ranking[idx].playerId)
          const coupleB = pairs[i + 1].map((idx: number) => ranking[idx].playerId)

          schedule.push({
            round: round + 1,
            courtNumber: courtNumber,
            startTime: `${9 + round}:00`, // Start at 9:00, 10:00, etc.
            coupleA,
            coupleB,
            pointsA: 0,
            pointsB: 0,
            isFinished: false,
          })
        }
        courtNumber++
      }
    }

    // Save schedule
    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { schedule },
    })

    return schedule
  }

  // -- getScheduleAmericano -- //
  async getScheduleAmericano(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.tournamentType !== 'americano') {
      throw new BadRequestException('This method is only for americano tournaments')
    }

    return tournament.schedule || []
  }

  // -- getRankingAmericano -- //
  async getRankingAmericano(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.tournamentType !== 'americano') {
      throw new BadRequestException('This method is only for americano tournaments')
    }

    const ranking = tournament.ranking || []

    // Sort by points descending
    return [...ranking].sort((a, b) => b.points - a.points)
  }

  // -- updateMatchAmericano -- //
  async updateMatchAmericano(
    tournamentId: string,
    matchIndex: number,
    data: { pointsA?: number; pointsB?: number; isFinished?: boolean },
  ) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.tournamentType !== 'americano') {
      throw new BadRequestException('This method is only for americano tournaments')
    }

    const schedule = tournament.schedule || []

    if (matchIndex < 0 || matchIndex >= schedule.length) {
      throw new BadRequestException('Match not found')
    }

    const match = schedule[matchIndex]

    // Update match
    if (data.pointsA !== undefined) match.pointsA = data.pointsA
    if (data.pointsB !== undefined) match.pointsB = data.pointsB
    if (data.isFinished !== undefined) match.isFinished = data.isFinished

    // If match finished, update ranking (add points to each player)
    const ranking = tournament.ranking || []

    if (data.isFinished) {
      // Add points to couple A players
      if (match.coupleA && match.pointsA !== undefined) {
        for (const playerId of match.coupleA) {
          const playerIdx = ranking.findIndex((p) => p.playerId === playerId)
          if (playerIdx !== -1) {
            ranking[playerIdx].points += match.pointsA
            ranking[playerIdx].gamesPlayed += 1
          }
        }
      }

      // Add points to couple B players
      if (match.coupleB && match.pointsB !== undefined) {
        for (const playerId of match.coupleB) {
          const playerIdx = ranking.findIndex((p) => p.playerId === playerId)
          if (playerIdx !== -1) {
            ranking[playerIdx].points += match.pointsB
            ranking[playerIdx].gamesPlayed += 1
          }
        }
      }
    }

    // Save updated schedule and ranking
    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { schedule, ranking },
    })

    return { match, ranking }
  }

  // -- subscribe (USER) -- //
  async subscribe(tournamentId: string, userId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    if (tournament.state !== 'open') {
      throw new BadRequestException('Tournament is not open for subscriptions')
    }

    const subscribers = tournament.subscribers || []

    // Check if already subscribed
    const existing = subscribers.find((s) => s.userId === userId)
    if (existing) {
      throw new BadRequestException('You are already subscribed to this tournament')
    }

    // Add new subscriber
    subscribers.push({
      userId,
      status: 'pending',
      subscribedAt: new Date(),
    })

    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { subscribers },
    })

    return { message: 'Subscription successful', status: 'pending' }
  }

  // -- getMySubscriptionStatus (USER) -- //
  async getMySubscriptionStatus(tournamentId: string, userId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    const subscribers = tournament.subscribers || []
    const subscriber = subscribers.find((s) => s.userId === userId)

    if (!subscriber) {
      return { status: null, message: 'Not subscribed' }
    }

    return subscriber
  }

  // -- getSubscribers (OWNER) -- //
  async getSubscribers(tournamentId: string) {
    const tournament = await this.getTournamentById(tournamentId)

    // Get user details for each subscriber
    const subscribers = tournament.subscribers || []

    // OPTIMIZATION: Single query with $in instead of N queries
    if (subscribers.length > 0) {
      const userIds = subscribers.map((s) => s.userId)
      const users = await this.userModel.find({ _id: { $in: userIds } }).lean()
      const usersMap = new Map(users.map((u) => [u._id.toString(), u]))

      return subscribers.map((sub) => {
        const userIdStr = sub.userId.toString()
        const user = usersMap.get(userIdStr)
        return {
          ...sub,
          userName: user?.name || 'Unknown',
          userLastname: user?.lastname || '',
        }
      })
    }

    return []
  }

  // -- approveSubscriber (OWNER) -- //
  async approveSubscriber(
    tournamentId: string,
    ownerUserId: string,
    targetUserId: string,
    action: 'approve' | 'reject',
  ) {
    // Verify owner
    await this.getComplexByOwner(ownerUserId)

    const tournament = await this.getTournamentById(tournamentId)
    const subscribers = tournament.subscribers || []

    const subscriberIndex = subscribers.findIndex((s) => s.userId === targetUserId)
    if (subscriberIndex === -1) {
      throw new BadRequestException('Subscriber not found')
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    subscribers[subscriberIndex].status = newStatus

    await this.tournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { subscribers },
    })

    return {
      message: `User ${newStatus}`,
      status: newStatus,
      userId: targetUserId,
    }
  }

  // -- addApprovedUsers (OWNER) -- //
  async addApprovedUsers(tournamentId: string, ownerUserId: string) {
    // Verify owner
    await this.getComplexByOwner(ownerUserId)

    const tournament = await this.getTournamentById(tournamentId)
    const tournamentType = tournament.tournamentType
    const subscribers = tournament.subscribers || []
    const config = tournament.config

    // Get only approved subscribers
    const approved = subscribers.filter((s) => s.status === 'approved')

    if (approved.length === 0) {
      throw new BadRequestException('No approved subscribers to add')
    }

    // For Americano: add to ranking
    if (tournamentType === 'americano') {
      const ranking = tournament.ranking || []

      // Validate: even number
      if (approved.length % 2 !== 0) {
        throw new BadRequestException('Need an even number of approved users to generate couples')
      }

      // Validate: max allowed
      const validCounts = [4, 6, 8]
      if (!validCounts.includes(approved.length)) {
        throw new BadRequestException(
          `Can only add 4, 6, or 8 approved users. Current: ${approved.length}`,
        )
      }

      // OPTIMIZATION: Single query with $in instead of N queries
      const approvedUserIds = approved.map((s) => s.userId)
      const users = await this.userModel.find({ _id: { $in: approvedUserIds } }).lean()
      const usersMap = new Map(users.map((u) => [u._id.toString(), u]))

      // Add approved users to ranking
      for (const sub of approved) {
        // Check if already in ranking
        const subUserId = sub.userId.toString()
        const alreadyExists = ranking.some((r) => r.playerId === subUserId)
        if (!alreadyExists) {
          const user = usersMap.get(subUserId)
          ranking.push({
            playerId: subUserId,
            playerName: user?.name || 'Unknown',
            points: 0,
            gamesPlayed: 0,
          })
        }
      }

      await this.tournamentModel.findByIdAndUpdate(tournamentId, {
        $set: { ranking },
      })

      return {
        message: `Added ${ranking.length} players to tournament`,
        playersAdded: ranking.length,
        ranking,
      }
    }

    // For Liga/Playoff: add to teams (future)
    throw new BadRequestException('Adding approved users to Liga/Playoff not yet implemented')
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

  async getTournamentByUserId(userId: string) {
    const userIdObject = new Types.ObjectId(userId)

    const tournaments = await this.tournamentModel.find({
      'teams.players.userId': userIdObject,
    })
    if (!tournaments || tournaments.length === 0) {
      throw new BadRequestException('No tournaments found for this user')
    }

    return tournaments
  }
}
