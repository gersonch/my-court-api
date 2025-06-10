import { Schema, Document, model } from 'mongoose'
import * as bcrypt from 'bcrypt'

export interface IAdmin extends Document {
  name: string
  email: string
  password: string
  comparePassword(candidate: string): Promise<boolean>
}

export const AdminSchema = new Schema<IAdmin>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
})

// Pre-save hook: hashear contraseña solo si ha sido modificada
AdminSchema.pre<IAdmin>('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(error)
    } else {
      next(new Error('Unknown error during password hashing'))
    }
  }
})

// Método para comparar contraseñas
AdminSchema.methods.comparePassword = async function (this: IAdmin, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const Admin = model<IAdmin>('Admin', AdminSchema)
