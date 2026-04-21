import { Schema } from 'mongoose'

export const ReservationSchema = new Schema(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: true },
    startTime: { type: Date, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'canceled', 'pending'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

// -----------------------------------------------------------------------------
// @section Unique Index para Race Condition Prevention
// @description
// - Índice único compuesto: fieldId + startTime + status
// - partialFilterExpression: solo aplica la restricción cuando status = 'confirmed'
// - Esto permite tener múltiples reservas "canceled" para el mismo slot
// - Pero solo UNA reserva "confirmed" por slot (previene reservas duplicadas)
// -----------------------------------------------------------------------------
ReservationSchema.index(
  { fieldId: 1, startTime: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
    name: 'unique_confirmed_slot', // nombre explícito para debug
  },
)

// Índices para optimizar queries frecuentes (ya existían)
ReservationSchema.index({ fieldId: 1, startTime: 1 }) // Para verificar disponibilidad de canchas
ReservationSchema.index({ userId: 1, startTime: 1 }) // Para reservas por usuario desde fecha
ReservationSchema.index({ userId: 1, status: 1 }) // Para historial de usuario
ReservationSchema.index({ complexId: 1 }) // Para reservas por complejo
