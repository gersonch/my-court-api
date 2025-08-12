import { Schema } from 'mongoose'

export const ReservationSchema = new Schema({
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: true },
  startTime: { type: Date, required: true },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})
