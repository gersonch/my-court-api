import { Schema, Types } from 'mongoose'

export const TournamentSchema = new Schema(
  {
    name: String,
    sport: { type: String, enum: ['futbol', 'padel'], required: true },
    tipoTorneo: {
      type: String,
      enum: ['liga', 'playoff', 'americano'],
      required: true,
    },
    complexId: { type: Types.ObjectId, ref: 'Complex' },
    category: {
      type: String,
      enum: [
        'Primera división',
        'Segunda división',
        'Tercera división',
        'Cuarta división',
        'Quinta división',
      ],
    },
    startDate: Date,
    endDate: Date,
    state: {
      type: String,
      enum: ['inactive', 'open', 'in_progress', 'finished', 'cancelled'],
      default: 'inactive',
    },

    // Configuration based on tournament type
    config: {
      teamsCount: Number,
      rounds: Number, // americano
      courtCount: Number, // americano
      playoffsRounds: Number, // playoff: 2 (4 teams), 3 (8), 4 (16)
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
        matchId: { type: String, default: () => crypto.randomUUID() },
        date: Date,
        startTime: String,
        endTime: String,
        fieldId: { type: Types.ObjectId, ref: 'Field' },
        teamA: String,
        teamB: String,
        scoreA: Number,
        scoreB: Number,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'finished'],
          default: 'pending',
        },
        roundNumber: Number, // playoff
        matchNumber: Number, // playoff: 1, 2, 3...
        events: [
          {
            type: { type: String, enum: ['goal', 'yellow_card', 'red_card'] },
            minute: Number,
            userId: { type: Types.ObjectId, ref: 'User' },
            team: { type: String, enum: ['A', 'B'] },
          },
        ],
      },
    ],

    // Standings (liga)
    standings: [
      {
        teamId: String,
        teamName: String,
        pts: { type: Number, default: 0 },
        pj: { type: Number, default: 0 },
        pg: { type: Number, default: 0 },
        pe: { type: Number, default: 0 },
        pp: { type: Number, default: 0 },
        gf: { type: Number, default: 0 },
        gc: { type: Number, default: 0 },
        diff: { type: Number, default: 0 },
      },
    ],

    // Brackets (playoff)
    brackets: [
      {
        round: Number, // 1=quarters, 2=semis, 3=final
        matchNumber: Number,
        teamA: String,
        teamB: String,
        scoreA: Number,
        scoreB: Number,
        winner: String,
        nextMatchId: String,
      },
    ],

    // Schedule (americano)
    schedule: [
      {
        round: Number,
        courtNumber: Number,
        startTime: String,
        coupleA: [String], // [player1, player2]
        coupleB: [String],
        scoreA: Number,
        scoreB: Number,
      },
    ],

    // Ranking (americano - final)
    ranking: [
      {
        playerId: String,
        coupleName: String,
        wins: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
)
