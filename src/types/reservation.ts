import { Types } from 'mongoose'

export interface IReservation {
  fieldId: Types.ObjectId

  userId: Types.ObjectId

  complexId: Types.ObjectId

  startTime: Date

  duration: string

  price: number

  status?: 'confirmed' | 'canceled'

  createdAt?: Date
}
