import { Schema } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { Role } from '../common/guards/enums/rol.enum'

export const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
  role: { type: 'string', default: Role.USER, required: true, enum: Object.values(Role) },
  refreshToken: { type: String, required: false },
})

import type { CallbackError } from 'mongoose'

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as CallbackError)
  }
})
