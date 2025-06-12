import { Schema } from 'mongoose'

export const FieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  complexId: { type: Schema.Types.ObjectId, ref: 'Complex' },

  schedule: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }],
  },
})
