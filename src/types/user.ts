import { Types, Document } from 'mongoose'

export interface User extends Document {
  _id: Types.ObjectId
  name?: string
  lastname?: string
  email: string
  password: string
  role: string
  avatar?: string
  phone?: string
  dni?: string
  createdAt?: Date
  updatedAt?: Date
}

// Interface para objetos returned por .lean() - sin metodos de Mongoose
export interface IUserLean {
  _id: Types.ObjectId
  name?: string
  lastname?: string
  email?: string
  role?: string
  avatar?: string
}
