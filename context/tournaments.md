# Tournaments

> Tournament management system for sports complexes.

---

## Tournament Types

### 1. Liga (League)

Round-robin system where every team plays against all others.

**Characteristics:**

- All teams play against each other
- Scoring: 3 points per win, 1 per draw, 0 per loss
- Standings table: Pts, PJ (played), PG (wins), PE (draws), PP (losses), GF (goals for), GC (goals against), Diff (goal difference)
- Fixture with matchdays (dates)
- Penalty shootout support (counts as win)

**Flow:**

```
1. Owner creates tournament (type: liga)
2. Owner defines number of teams (min 4, max 20)
3. Owner adds teams/players
4. System generates automatic fixture
5. Owner updates results for each match
6. System recalculates standings automatically
7. End: winner is #1 in standings
```

**States:**
`inactive` → `open` (registration) → `in_progress` → `finished`

---

### 2. Playoff (Knockout)

Single-elimination system where losers are out.

**Characteristics:**

- Single elimination (one loss eliminates team)
- Formats: 4, 8, 16 teams
- Rounds: Quarters → Semis → Final
- Winner-take-all
- Seeding determines bracket order

**Flow:**

```
1. Owner creates tournament (type: playoff)
2. Owner defines number of teams (4, 8, 16)
3. Owner adds teams with seeding (1 vs 8, 2 vs 7, etc.)
4. System generates brackets
5. Owner registers result for each match
6. System auto-advances winner
7. End: winner is champion
```

**States:**
`inactive` → `open` (registration) → `in_progress` → `finished`

---

### 3. Americans (Couples - Padel Only)

Rotating couples system where each pair plays against all other pairs.

**Characteristics:**

- **ONLY for padel** (mandatory validation)
- Each player has a fixed partner
- Rotating system: each couple vs each couple
- Scheduling: by hour, uses available courts from complex
- Ranking by number of wins

**Flow:**

```
1. Owner creates tournament (type: americano)
2. System validates: ONLY if sport === 'padel'
3. Owner defines number of players (must be even: 4, 6, 8)
4. System generates couples automatically
5. System generates match table
6. Owner configures: how many courts per hour
7. Scheduling: X matches per hour based on available courts
8. Owner registers results
9. End: ranking by wins
```

**States:**
`inactive` → `open` (registration) → `in_progress` → `finished`

---

## Schema

```typescript
// types/tournaments.ts (extended)

interface Tournament {
  // ... existing fields
  tournamentType: 'liga' | 'playoff' | 'americano'

  // Configuration based on type
  config: {
    teamsCount: number // number of teams/players
    rounds?: number // rounds (americano)
    courts?: number // courts (americano)
    playoffsRounds?: number // playoff: 2 (4 teams), 3 (8), 4 (16)
  }

  // Standings (liga)
  standings?: Standing[]

  // Brackets (playoff)
  brackets?: BracketMatch[]

  // Schedule (all types)
  matches?: Match[]
}

interface Standing {
  teamId: string
  teamName: string
  pts: number // points
  pj: number // played
  pg: number // wins
  pe: number // draws
  pp: number // losses
  gf: number // goals for
  gc: number // goals against
  diff: number // goal difference
}

interface BracketMatch {
  round: number // 1=quarters, 2=semis, 3=final
  matchNumber: number
  teamA?: string
  teamB?: string
  scoreA?: number
  scoreB?: number
  winner?: string
  nextMatchId?: string // to advance winner
}

interface Match {
  matchId: string
  date: Date
  startTime: string
  endTime: string
  fieldId: string
  teamA: string
  teamB: string
  scoreA?: number
  scoreB?: number
  isFinished: boolean
  status: 'pending' | 'in_progress' | 'finished'
  roundNumber?: number // playoff
  matchNumber?: number // playoff: 1, 2, 3...
  events?: MatchEvent[]
}

interface MatchEvent {
  type: 'goal' | 'yellow_card' | 'red_card'
  minute: number
  playerId: string
  team: 'A' | 'B'
}

// Subscribers (users who want to participate)
interface Subscriber {
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  subscribedAt: Date
}
```

---

## Endpoints

### Owner (create/manage)

| Method | Endpoint                               | Description                             |
| ------ | -------------------------------------- | --------------------------------------- |
| POST   | `/tournaments`                         | Create tournament (with tournamentType) |
| PATCH  | `/tournaments/:id/config`              | Configure parameters                    |
| POST   | `/tournaments/:id/teams`               | Add teams                               |
| POST   | `/tournaments/:id/generate`            | Generate fixture/brackets               |
| PATCH  | `/tournaments/:id/match/:matchId`      | Update result                           |
| GET    | `/tournaments/:id/standings`           | View standings (liga)                   |
| GET    | `/tournaments/:id/brackets`            | View brackets (playoff)                 |
| GET    | `/tournaments/:id/ranking`             | View ranking (americano)                |
| GET    | `/tournaments/:id/subscribers`         | View subscribers list                   |
| PATCH  | `/tournaments/:id/subscribers/:userId` | Approve/reject subscriber               |
| POST   | `/tournaments/:id/add-approved-users`  | Add approved users to tournament        |

### User (subscribe)

| Method | Endpoint                            | Description                |
| ------ | ----------------------------------- | -------------------------- |
| POST   | `/tournaments/:id/subscribe`        | User wants to participate  |
| GET    | `/tournaments/:id/subscribe-status` | Get my subscription status |

### User (view results)

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/tournaments/:id`              | View tournament info    |
| GET    | `/tournaments/:id/matches`      | View matches            |
| GET    | `/tournaments/:id/results`      | View results (public)   |
| GET    | `/tournaments/:id/user/:userId` | View user's tournaments |

---

## Rules & Validations

1. **Americano = Padel Only**
   - Validate: `if (tipoTorneo === 'americano' && sport !== 'padel') throw BadRequest`

2. **Playoff Teams**
   - Only allow: 4, 8, 16 teams
   - Must be power of 2

3. **Liga**
   - Minimum 4 teams
   - Fixture: (n-1) matchdays, 2 matches per day

4. **Courts for Americano**
   - Get from complex: `complex.fields` available
   - Max matches per hour = number of courts

---

## Future Improvements

- Double elimination playoffs
- Groups + playoffs (league → final phase)
- Live scoring with WebSockets
- Player stats (goals, cards)
- Photo/video of match
- Match inspection (VAR!)
- Sanctions and suspensions
