import { Schema } from 'mongoose'
import * as bcrypt from 'bcrypt'

export const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, default: 'user', required: true, enum: ['admin', 'user'] },
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
