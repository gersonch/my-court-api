import { Schema } from 'mongoose'

export const ComplexSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    image_url: { type: [String], default: [] },
    region: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    stars: { type: Number, default: 0, min: 0, max: 5 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    sports: {
      type: [String],
      enum: ['futbol', 'tenis', 'padel'],
      default: [],
    },

    fieldsNumber: { type: Number, default: 0, min: 0 },

    equipment: {
      futbol: { type: Boolean, default: false },
      tenis: { type: Boolean, default: false },
      padel: { type: Boolean, default: false },
    },

    facilities: {
      parking: { type: Boolean, default: false },
      bar: { type: Boolean, default: false },
      restaurant: { type: Boolean, default: false },
      changingRooms: { type: Boolean, default: false },
      showers: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
)
