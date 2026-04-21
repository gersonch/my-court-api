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

- `tipoTorneo`: 'liga' | 'playoff' | 'americano' (required field)
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

## [Add decisions here]
