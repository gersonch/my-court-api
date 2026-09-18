# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Court API is a NestJS REST API for managing sports complexes (football/court reservations). It handles users, complexes, fields, reservations, tournaments, and ratings.

**Stack**: NestJS + MongoDB/Mongoose + JWT + Google OAuth
**Package Manager**: pnpm

## Common Commands

```bash
# Install dependencies (pnpm)
pnpm install

# Development
pnpm run start:dev      # Watch mode with hot reload
pnpm run start:debug    # Debug mode with watch

# Production
pnpm run build          # Build to dist/
pnpm run start          # Run production build
pnpm run start:prod     # Run with memory limit (256MB)

# Code quality
pnpm run lint           # ESLint with auto-fix
pnpm run format         # Prettier format

# Testing
pnpm test               # Run all tests
pnpm run test:watch     # Watch mode for tests
pnpm run test:cov       # Coverage report
pnpm test -- path/to/file  # Run single test file
```

## Architecture

### Module Structure

Each feature module follows NestJS conventions:
- `*.module.ts` - Module definition
- `*.controller.ts` - HTTP endpoints
- `*.service.ts` - Business logic
- `*.schema.ts` - Mongoose schema (if applicable)
- `dto/` - Data transfer objects with validation

**Modules**: `auth`, `users`, `complexes`, `fields`, `reservations`, `tournaments`, `rating`

**Shared**: `common/` (decorators, guards, interfaces), `config/`, `types/`

### API Documentation

API reference available at `/api-docs` (Scalar UI). Enable via:
```bash
pnpm run start:dev
# Visit http://localhost:3000/api-docs
```

### Authentication

Two authentication methods are supported simultaneously:

1. **Bearer Token**: `Authorization: Bearer <token>` header
2. **Cookies**: `token` and `refreshToken` httpOnly cookies (set on login)

Key decorators in `src/auth/decorators/`:
- `@Auth(role)` - Combined auth + role guard
- `@ActiveUser()` - Extract user from request (sub, email, role)

Key files:
- `src/auth/guards/auth.guard.ts` - Token extraction (header priority over cookies)
- `src/auth/strategies/jwt.strategy.ts` - Passport JWT validation
- `src/common/decorators/active-user.decorator.ts` - User extraction from request

### Database

MongoDB with Mongoose. Connection via `MONGODB_URI` env var.

Key schemas and their indexes:
- `User` - email (unique), role
- `Complex` - owner ref, geolocation index
- `Field` - complex ref, type (5/7/11)
- `Reservation` - field+date compound, user+status compound
- `Tournament` - teams array, status enum
- `Rating` - user+complex unique compound

### Global Middleware & Guards

- `ValidationPipe` - whitelist, transform, forbidNonWhitelisted
- `ThrottlerGuard` (APP_GUARD) - 100 req/min per IP
- `cookie-parser` - Cookie parsing middleware
- CORS enabled for `http://localhost:5173`

## Environment Variables

Required in `.env`:
```
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PORT=3000
```

Never commit `.env` - it's gitignored.

## Key Patterns

### Using @ActiveUser()
```typescript
@Get('user')
@Auth(Role.USER)
getReservationsByUser(@ActiveUser() user: IUserActive) {
  // user.sub = userId, user.email, user.role
}
```

### Aggregation Pipelines (avoid N+1)
Use MongoDB aggregation with `$lookup` instead of `.populate()` in services for better performance. See `src/reservations/reservations.service.ts` for examples.

### Adding a New Module
1. Create directory under `src/`
2. Create `*.module.ts`, `*.controller.ts`, `*.service.ts`
3. Add to `imports` array in `app.module.ts`
4. Add DTOs in `dto/` subdirectory with class-validator decorators
