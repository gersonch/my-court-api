import { Schema } from 'mongoose'

export const ComplexSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  image_url: String,
  region: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  stars: { type: Number, default: 0, min: 0, max: 5 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
})
