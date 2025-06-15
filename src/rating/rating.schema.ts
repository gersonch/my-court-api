import { Schema } from 'mongoose'

export const RatingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
)
