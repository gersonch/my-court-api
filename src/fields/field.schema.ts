import { Schema } from 'mongoose'

const PricePerDurationSchema = new Schema(
  {
    price: { type: Number, required: true },
    duration: { type: String, required: true },
  },
  { _id: false },
) // No queremos un _id para este subdocumento
const TimeBlockSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true },
    from: { type: String, required: true }, // Hora de inicio
    to: { type: String, required: true }, // Hora de fin
    prices: [PricePerDurationSchema],
  },
  { _id: false },
) // No queremos un _id para este subdocumento

export const FieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  complexId: { type: Schema.Types.ObjectId, ref: 'Complex' },
  availability: { type: [TimeBlockSchema], required: true },
})
