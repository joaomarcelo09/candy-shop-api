# Candy Shop API

Backend API for candy shop sales management, built with NestJS, Prisma, and PostgreSQL.

## Overview

The API manages:
- Authentication (`/auth`)
- Users (`/users`)
- Candies (`/candies`)
- Sales sessions (`/sessions`)
- Session orders and order items (`SessionOrder` + `OrderCandy`)

A session represents a selling period (event, shift, or sales day).

## Core Business Rules

- Only one `OPEN` session can exist at a time.
- New sessions start with:
  - `status = OPEN`
  - `totalSold = 0`
  - `date = now`
- Orders can be created or deleted only while session is `OPEN`.
- Closing a session:
  - Computes `totalSold = SUM(quantity * unitPriceSnapshot)`
  - Sets `status = CLOSED`
- Closed sessions are immutable:
  - Cannot create/delete orders
  - Cannot close again
  - Returns `403 Forbidden` with message `Session is already closed`
- Candy price is stored in cents (e.g. `5.50 BRL => 550`).
- Each order can contain multiple candies.
- `OrderCandy.unitPriceSnapshot` freezes the price used at the moment of sale.
- `GET /sessions/:id` still returns aggregated `items` for compatibility, but aggregation now comes from order data.

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
- `session-orders`
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

### SessionOrder
- `id` UUID
- `sessionId` UUID FK
- `createdAt` datetime
- `registeredByUserId` UUID nullable

### OrderCandy
- `id` UUID
- `sessionOrderId` UUID FK
- `candyId` UUID FK
- `quantity` integer
- `unitPriceSnapshot` integer (cents)

Legacy note:
- `SessionCandy` still exists in the schema as migration compatibility data.
- New writes must use `SessionOrder` + `OrderCandy`.

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
- `POST /api/sessions/:id/orders`
- `GET /api/sessions/:id/orders`
- `DELETE /api/sessions/:sessionId/orders/:orderId`
- `PATCH /api/sessions/:id/close`

### Order Request Example

```json
{
  "items": [
    { "candy_id": "uuid-1", "quantity": 5 },
    { "candy_id": "uuid-2", "quantity": 3 }
  ]
}
```

### Order Response Example

```json
{
  "id": "order-uuid",
  "session_id": "session-uuid",
  "created_at": "2026-05-09T15:00:00.000Z",
  "total": 3400,
  "items": [
    {
      "candy_id": "uuid-1",
      "candy": "Chocolate",
      "quantity": 5,
      "unit_price": 500,
      "subtotal": 2500
    }
  ]
}
```

## Validation Rules

Implemented with `class-validator`:
- `quantity > 0`
- `price > 0`
- order `items` must contain at least one entry
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
  - multi-item order creation
  - order deletion protection on closed sessions
  - close session total calculation from order data
  - historical price snapshot stability
  - closed session protections
  - session detail aggregation

Run:

```bash
pnpm test
```
