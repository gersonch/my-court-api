import { Types } from 'mongoose'

export interface ITournament extends Document {
  _id?: Types.ObjectId
  name: string
  sport: 'futbol' | 'padel'
  complexId: Types.ObjectId
  category?: string
  startDate?: Date
  endDate?: Date
  state: 'active' | 'finished' | 'cancelled' | 'open' | 'inactive'
  teams: Array<{
    name: string
    players: Array<{
      userId: Types.ObjectId
      position?: string
      stats?: Record<string, any>
    }>
  }>
  matches: Array<{
    date?: Date
    fieldId?: Types.ObjectId
    teamA?: string
    teamB?: string
    score?: string
    events?: Array<{
      type?: string
      minute?: number
      userId?: Types.ObjectId
    }>
  }>
  createdAt?: Date
  updatedAt?: Date
}
