import { Schema } from 'mongoose'

export const ReservationSchema = new Schema(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: true },
    startTime: { type: Date, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'canceled'], default: 'confirmed' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

// Índices para optimizar queries frecuentes
ReservationSchema.index({ fieldId: 1, startTime: 1 }) // Para verificar disponibilidad de canchas
ReservationSchema.index({ userId: 1, startTime: 1 }) // Para reservas por usuario desde fecha
ReservationSchema.index({ userId: 1, status: 1 }) // Para historial de usuario
ReservationSchema.index({ complexId: 1 }) // Para reservas por complejo
