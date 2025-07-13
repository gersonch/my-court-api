import { Schema } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { Role } from '../common/guards/enums/rol.enum'

const image_url =
  'https://res.cloudinary.com/dsm9c4emg/image/upload/v1751077004/icono-perfil-usuario-estilo-plano-ilustracion-vector-avatar-miembro-sobre-fondo-aislado-concepto-negocio-signo-permiso-humano_157943-15752_ewx5pm.avif'

export const UserSchema = new Schema({
  name: String,
  lastName: { type: String, required: false, default: '' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: false, unique: true, default: '' },
  country: { type: String, required: false, default: '' },
  address: { type: String, required: false, default: '' },
  city: { type: String, required: false, default: '' },
  createdAt: { type: Date, default: Date.now },
  role: { type: 'string', default: Role.USER, required: true, enum: Object.values(Role) },
  refreshToken: { type: String, required: false },
  image_url: { type: String, required: false, default: image_url },
  rut: { type: String, required: true, unique: true },
})

import type { CallbackError } from 'mongoose'

UserSchema.pre('save', async function (next) {
  // Solo hashear la contraseña si fue modificada
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as CallbackError)
  }
})
