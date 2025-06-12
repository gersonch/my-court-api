import { ObjectId } from 'mongodb'

export interface IUserActive {
  sub: string
  userId: string
  email: string
  role: string
}
