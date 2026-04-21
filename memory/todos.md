# TODO - Torneos v2.0

> Tournament system: Liga, Playoff, Americans.

---

## PHASE 1: Base Structure

### Schema Updates ✅ COMPLETED

- [x] **1.1** Add `tipoTorneo` field: `liga` | `playoff` | `americano` (required)
- [x] **1.2** Add `config` subdocument:
  - teamsCount: number
  - rounds?: number (americano)
  - courtCount?: number (americano)
  - playoffsRounds?: number (playoff)
- [x] **1.3** Extend `matches` array:
  - Change `score` (String) → `scoreA`, `scoreB` (Number)
  - Add: `startTime`, `endTime`
  - Add: `status` (pending/in_progress/finished)
  - Add: `roundNumber` (playoff)
  - Add: `matchNumber` (playoff)
- [x] **1.4** Add `standings` array (liga):
  - teamId, teamName, pts, pj, pg, pe, pp, gf, gc, diff
- [x] **1.5** Add `brackets` array (playoff):
  - round, matchNumber, teamA, teamB, scoreA, scoreB, winner, nextMatchId
- [x] **1.6** Add `schedule` array (americano):
  - round, courtNumber, startTime, coupleA, coupleB, scoreA, scoreB
- [x] **1.7** Add `ranking` array (americano final):
  - playerId, coupleName, wins, gamesPlayed

### Validation

- [ ] **1.8** Validate: americano ONLY for padel
- [ ] **1.9** Validate: playoff teams must be 4, 8, or 16
- [x] **1.10** Update state enum: add `in_progress`, `cancelled`

---

## PHASE 1: COMPLETED ✅

### DTOs ✅ COMPLETED

- [x] **1.11** Update CreateTournamentDto with tipoTorneo
- [x] **1.12** Update CreateTournamentDto with config fields
- [x] **1.13** Create UpdateMatchDto for score updates

---

## PHASE 2: Liga Mode

- [ ] **2.1** Generate automatic fixture (all vs all)
- [ ] **2.2** Calculate standings (pts, gf, gc, diff)
- [ ] **2.3** Endpoint: update result → recalculate standings
- [ ] **2.4** Handle: draws, penalty shootout (count as win)
- [ ] **2.5** Scoring system: 3 pts win, 1 pt draw, 0 loss

---

## PHASE 3: Playoff Mode

- [ ] **3.1** Generate brackets (quarters → semis → final)
- [ ] **3.2** Determine seeding (ranking or random)
- [ ] **3.3** Auto-advance winner when result is set
- [ ] **3.4** Support single elimination
- [ ] **3.5** Support 4, 8, or 16 teams

---

## PHASE 4: Americans Mode (Couples - Padel Only)

- [ ] **4.1** Validate: ONLY padel allowed
- [ ] **4.2** Rotating couples system
- [ ] **4.3** Generate match table (each couple vs each couple)
- [ ] **4.4** Score per couple
- [ ] **4.5** Final ranking by wins
- [ ] **4.6** Scheduling: by hour, uses available courts from complex

---

## PHASE 5: Results & Visibility

- [ ] **5.1** Endpoint: view standings (liga)
- [ ] **5.2** Endpoint: view brackets (playoff)
- [ ] **5.3** Endpoint: view ranking (americanos)
- [ ] **5.4** Endpoint: fixture/list of matches by date
- [ ] **5.5** Public endpoint: tournament results (no auth)
- [ ] **5.6** Endpoint: view specific match details

---

## PHASE 6: WebSockets (Real-Time)

- [ ] **6.1** Install @nestjs/websockets + socket.io
- [ ] **6.2** Create gateway for tournaments
- [ ] **6.3** Event: `match_result_updated` → notify subscribers
- [ ] **6.4** Owner updates score → clients see live update

---

## PHASE 7: Extras

- [ ] **7.1** Match change history
- [ ] **7.2** Player goals/events stats
- [ ] **7.3** Export results (PDF)
- [ ] **7.4** Push notifications on match finish
- [ ] **7.5** Validate court availability when creating matches

---

## Notes

- **Liga Scoring**: 3 pts win, 1 pt draw, 0 loss
- **Playoff**: Single elimination (8 teams default)
- **Americans**: By hour, number of courts based on complex
- **WebSockets**: Implemented AFTER base logic is done

---

## Dependencies to Add

```json
{
  "@nestjs/websockets": "^11.x",
  "@nestjs/platform-socket.io": "^11.x",
  "socket.io": "^4.x"
}
```

---

## Updated Schema

```typescript
{
  name: String,
  sport: { type: String, enum: ['futbol', 'padel'], required: true },
  tipoTorneo: {
    type: String,
    enum: ['liga', 'playoff', 'americano'],
    required: true
  },
  complexId: { type: Types.ObjectId, ref: 'Complex' },
  category: { enum: ['Primera', ..., 'Quinta'] },
  startDate: Date,
  endDate: Date,
  state: {
    type: String,
    enum: ['inactive', 'open', 'in_progress', 'finished', 'cancelled'],
    default: 'inactive',
  },

  config: {
    teamsCount: Number,
    rounds: Number,        // americano
    courtCount: Number,  // americano
    playoffsRounds: Number // playoff: 2, 3, 4
  },

  teams: [{ name: String, players: [...] }],

  matches: [
    {
      matchId: String,
      date: Date,
      startTime: String,
      endTime: String,
      fieldId: { type: Types.ObjectId, ref: 'Field' },
      teamA: String,
      teamB: String,
      scoreA: Number,
      scoreB: Number,
      status: { enum: ['pending', 'in_progress', 'finished'] },
      roundNumber: Number,    // playoff
      matchNumber: Number,  // playoff: 1, 2, 3...
      events: [...]
    }
  ],

  standings: [    // Liga
    {
      teamId: String,
      teamName: String,
      pts: Number,
      pj: Number,
      pg: Number,
      pe: Number,
      pp: Number,
      gf: Number,
      gc: Number,
      diff: Number
    }
  ],

  brackets: [    // Playoff
    {
      round: Number,       // 1=cuartos, 2=semis, 3=final
      matchNumber: Number,
      teamA: String,
      teamB: String,
      scoreA: Number,
      scoreB: Number,
      winner: String,
      nextMatchId: String
    }
  ],

  schedule: [    // Americano
    {
      round: Number,
      courtNumber: Number,
      startTime: String,
      coupleA: [String],  // [player1, player2]
      coupleB: [String],
      scoreA: Number,
      scoreB: Number
    }
  ],

  ranking: [    // Americano - final
    {
      playerId: String,
      coupleName: String,
      wins: Number,
      gamesPlayed: Number
    }
  ]
}
```
