import { Schema } from 'mongoose'

export const FieldsSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: false },
})
