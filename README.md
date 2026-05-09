# Candy Shop API

Backend API for candy shop sales management, built with NestJS, Prisma, and PostgreSQL.

## Overview

The API manages:
- Authentication (`/auth`)
- Users (`/users`)
- Candies (`/candies`)
- Sales sessions (`/sessions`)
- Candy sales within a session (`SessionCandy` relation)

A session represents a selling period (event, shift, or sales day).

## Core Business Rules

- Only one `OPEN` session can exist at a time.
- New sessions start with:
  - `status = OPEN`
  - `totalSold = 0`
  - `date = now`
- Sales can be registered only while session is `OPEN`.
- Closing a session:
  - Computes `totalSold = SUM(quantitySold * candy.price)`
  - Sets `status = CLOSED`
- Closed sessions are immutable:
  - Cannot add/update/remove sales
  - Cannot close again
  - Returns `403 Forbidden` with message `Session is already closed`
- Candy price is stored in cents (e.g. `5.50 BRL => 550`).
- `SessionCandy` has unique constraint on (`sessionId`, `candyId`) so repeated sales increment quantity instead of duplicating rows.

## Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- Jest
- Docker + Docker Compose

## Modules

- `auth`
- `users`
- `candies`
- `sessions`
- `session-candies`
- `prisma`
- `common`

## API Base URL

All routes use global prefix:
- `/api`

Swagger docs:
- `/api/docs`

## Environment Variables

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/candy_shop?schema=public
JWT_SECRET=change-me
PORT=3000
```

## Local Development

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm start:dev
```

## Run with Docker

```bash
docker compose up --build
```

Services:
- `backend` on port `3000`
- `postgres` on port `5432` with persistent volume `postgres_data`

## Scripts

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm start:prod
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:cov
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
```

## Data Model Summary

### User
- `id` UUID
- `name` string
- `email` string unique
- `password` hashed string
- `createdAt` datetime

### Candy
- `id` UUID
- `name` string unique
- `price` integer (cents)
- `createdAt` datetime

### Session
- `id` UUID
- `totalSold` integer
- `date` datetime
- `status` enum: `OPEN | CLOSED`
- `createdAt` datetime

### SessionCandy
- `id` UUID
- `sessionId` UUID FK
- `candyId` UUID FK
- `quantitySold` integer
- unique (`sessionId`, `candyId`)

## Main Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users (JWT protected)
- `GET /api/users`

### Candies (JWT protected)
- `POST /api/candies`
- `GET /api/candies`
- `PATCH /api/candies/:id`
- `DELETE /api/candies/:id`

### Sessions (JWT protected)
- `POST /api/sessions`
- `GET /api/sessions?status=OPEN|CLOSED`
- `GET /api/sessions/open/current`
- `GET /api/sessions/:id`
- `POST /api/sessions/:id/sales`
- `PATCH /api/sessions/:id/close`

## Validation Rules

Implemented with `class-validator`:
- `quantity > 0`
- `price > 0`
- UUID validation where applicable
- email validation
- password minimum length `6`

Global `ValidationPipe` is enabled with:
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

## Error Handling

Global HTTP exception filter standardizes response format, for example:

```json
{
  "statusCode": 403,
  "message": "Session is already closed",
  "error": "Forbidden"
}
```

## Testing Coverage (Current)

Current unit tests include:
- `AuthService` (register/login flows, password hashing)
- `CandiesService` (create/update/duplicate protection/delete protection)
- `SessionsService`:
  - single open session rule
  - sale quantity increment behavior
  - close session total calculation
  - closed session protections
  - session detail subtotals

Run:

```bash
pnpm test
```
