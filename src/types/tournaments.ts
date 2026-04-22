import { Types } from 'mongoose'

// Tipos separados para usar en el service (evita errores any en callbacks)
export interface ISubscriber {
  userId: Types.ObjectId | string
  status: 'pending' | 'approved' | 'rejected'
  subscribedAt: Date
}

export interface IRankingPlayer {
  playerId: string
  playerName: string
  points: number
  gamesPlayed: number
}

export interface ITournament extends Document {
  _id?: Types.ObjectId
  name: string
  sport: 'futbol' | 'padel'
  tournamentType: 'liga' | 'playoff' | 'americano'
  complexId: Types.ObjectId
  category?: string
  startDate?: Date
  endDate?: Date
  state: 'inactive' | 'open' | 'in_progress' | 'finished' | 'cancelled'

  config?: {
    teamsCount?: number
    rounds?: number // americano
    courtCount?: number // americano
    playoffsRounds?: number // playoff: 2 (4 teams), 3 (8), 4 (16)
  }

  teams?: Array<{
    name: string
    players: Array<{
      userId: Types.ObjectId
      position?: string
      stats?: Record<string, any>
    }>
  }>

  matches?: Array<{
    matchId?: string
    date?: Date
    startTime?: string
    endTime?: string
    fieldId?: Types.ObjectId
    teamA?: string
    teamB?: string
    scoreA?: number
    scoreB?: number
    status?: 'pending' | 'in_progress' | 'finished'
    roundNumber?: number // playoff
    matchNumber?: number // playoff
    events?: Array<{
      type?: 'goal' | 'yellow_card' | 'red_card'
      minute?: number
      userId?: Types.ObjectId
      team?: 'A' | 'B'
    }>
  }>

  // Standings (liga)
  standings?: Array<{
    teamId: string
    teamName: string
    pts: number
    pj: number
    pg: number
    pe: number
    pp: number
    gf: number
    gc: number
    diff: number
  }>

  // Brackets (playoff)
  brackets?: Array<{
    round: number // 1=quarters, 2=semis, 3=final
    matchNumber: number
    teamA?: string
    teamB?: string
    scoreA?: number
    scoreB?: number
    winner?: string
    nextMatchId?: string
  }>

  // Schedule (americano)
  schedule?: Array<{
    round: number
    courtNumber: number
    startTime: string
    coupleA: string[] // [player1, player2]
    coupleB: string[]
    pointsA: number
    pointsB: number
    isFinished: boolean
  }>

  // Ranking (americano)
  ranking?: Array<IRankingPlayer>

  // Subscribers (usuarios que desean participar)
  subscribers?: Array<ISubscriber>

  createdAt?: Date
  updatedAt?: Date
}
