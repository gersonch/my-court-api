# Technical Decisions

> Logging of architectural and technical decisions for the project.

## Format

For each decision:

```markdown
## [Date] - Decision

**Context**: [What problem or need motivated the decision]

**Decision**: [What was decided]

**Consequences**: [Impact on code, positive and negative]

**Alternatives considered**:

- [Option 1]: [Why it wasn't chosen]
- [Option 2]: [Why it wasn't chosen]
```

---

## 2026-04-21 - Tournament Schema Enhancement

**Context**: The existing tournament system needs to support three different tournament types (Liga, Playoff, Americans) with different data structures and logic. The current schema only supports basic match tracking with string scores.

**Decision**: Extend the Tournament schema to include:

- `tournamentType`: 'liga' | 'playoff' | 'americano' (required field)
- `config`: Configuration object for tournament parameters
- Enhanced `matches` array with numeric scores, status, timing
- `standings`: For Liga mode (points table)
- `brackets`: For Playoff mode (elimination tree)
- `schedule` & `ranking`: For Americans mode (rotating couples)

**Status**: ✅ IMPLEMENTED

**Consequences**:

- Positive: Single source of truth for all tournament types
- Positive: Type-safe fields (Number instead of String for scores)
- Positive: Easy to extend for future tournament types
- Negative: Larger schema, some fields unused depending on type

**Alternatives considered**:

- Separate collections: Separate TournamentLiga, TournamentPlayoff collections - Rejected because most fields are shared, would duplicate logic
- Polymorphic approach with discriminator: Using Mongoose discriminator - More complex, overkill for just 3 types

---

## 2026-04-21 - Query Optimization (N+1 Problem)

**Context**: Several methods were making N+1 queries to the database - 1 query to get tournament + N queries for each user. For 4 users this meant 5 queries, for 10 subscribers meant 11 queries.

**Decision**: Replace individual `findById()` calls with bulk `find({ _id: { $in: [...] } })` queries.

**Methods optimized**:

- `getSubscribers()`: 11 queries → 2 queries
- `addPlayers()`: 8 queries → 1 query
- `createTeams()`: 8 queries → 1 query
- `addApprovedUsers()`: 4 queries → 1 query

**Status**: ✅ IMPLEMENTED

**Implementation**:

```typescript
// Antes (N+1 queries):
const user = await this.userModel.findById(player.userId)

// Después (1 query):
const userIds = players.map((p) => p.userId)
const users = await this.userModel.find({ _id: { $in: userIds } }).lean()
const usersMap = new Map(users.map((u) => [u._id.toString(), u]))
```

---

## [Add decisions here]
