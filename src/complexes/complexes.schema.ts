import { Schema } from 'mongoose'

export const ComplexSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  image_url: String,
  city: String,
  country: String,
  address: String,
  owner: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
})
