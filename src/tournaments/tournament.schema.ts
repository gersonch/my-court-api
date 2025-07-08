import { Schema, Types } from 'mongoose'

export const TournamentSchema = new Schema(
  {
    name: String,
    sport: { type: String, enum: ['futbol', 'padel'], required: true },
    complexId: { type: Types.ObjectId, ref: 'Complex' },
    category: String,
    startDate: Date,
    endDate: Date,
    state: {
      type: String,
      enum: ['active', 'finished', 'cancelled', 'open', 'inactive'],
      default: 'inactive',
    },

    teams: [
      {
        name: String,
        players: [
          {
            userId: { type: Types.ObjectId, ref: 'User' },
            position: String,
            stats: {
              type: Map,
              of: Schema.Types.Mixed,
              default: {},
            },
          },
        ],
      },
    ],

    matches: [
      {
        date: Date,
        fieldId: { type: Types.ObjectId, ref: 'Field' },
        teamA: String,
        teamB: String,
        score: String,
        events: [
          {
            type: String,
            minute: Number,
            userId: { type: Types.ObjectId, ref: 'User' },
          },
        ],
      },
    ],
  },
  { timestamps: true },
)
