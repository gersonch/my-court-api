import { Schema } from 'mongoose'

export const ReservationSchema = new Schema({
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})
