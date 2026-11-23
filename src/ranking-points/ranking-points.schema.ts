import { Schema } from 'mongoose'

export const RankingPointsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
    // _id del partido embebido en Tournament.matches.
    matchId: { type: Schema.Types.ObjectId, required: true },
    previousPoints: { type: Number, required: true },
    pointsChange: { type: Number, required: true },
    newPoints: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'rankingpoints' },
)

RankingPointsSchema.index({ tournamentId: 1, matchId: 1, userId: 1 }, { unique: true })
RankingPointsSchema.index({ userId: 1, createdAt: 1 })
