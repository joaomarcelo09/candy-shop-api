# AGENTS

Guide for contributors and coding agents working on `candy-shop-api`.

## Project Goal

Maintain a consistent, testable backend for candy sales sessions with strict immutability after session close.

## Non-Negotiable Business Rules

- Exactly one `OPEN` session at a time.
- Session starts with `totalSold = 0`.
- Order creation and order deletion allowed only in `OPEN` session.
- A session order may contain multiple candies.
- Closing a session computes and persists `totalSold`.
- `CLOSED` sessions are immutable.
- `Session.totalSold` and session summary items must always be derivable from `SessionOrder` + `OrderCandy`.
- `OrderCandy.unitPriceSnapshot` is required for historical price stability.

## Architecture Rules

- Keep modular separation:
  - `auth`, `users`, `candies`, `sessions`, `session-orders`, `prisma`, `common`.
- Use controller/service pattern.
- Keep Prisma access in services only.
- Reuse `PrismaService` from `prisma` module.
- Validate all request DTOs with `class-validator`.
- Keep JWT auth on protected routes using existing `JwtAuthGuard`.
- Preserve global exception filter behavior.

## Data and Money Rules

- Monetary values are integers in cents.
- Never store or compute money as floating point.
- `totalSold` must always be recomputable from `OrderCandy.quantity * OrderCandy.unitPriceSnapshot`.
- Session detail aggregation must not depend on the current `Candy.price`.

## Error Contract

When adding/altering logic, keep existing error semantics:
- `400 Bad Request`: business rule violations (e.g. second open session)
- `403 Forbidden`: closed session mutation attempts
- `404 Not Found`: missing entities
- `401 Unauthorized`: invalid auth credentials/token

Preserve meaningful messages already used by services.

## Endpoint and Swagger Rules

- Keep `/api` global prefix.
- Keep Swagger at `/api/docs`.
- For new endpoints:
  - add `@ApiTags`
  - add auth decorators where protected
  - include response examples when useful

## Testing Rules

Every behavior change must include/update Jest tests.
Prioritize tests for:
- session lifecycle
- multi-item order creation
- open-session-only order deletion
- total calculation
- price snapshot stability
- immutable closed session
- auth and validation regressions

## Database/Prisma Rules

- Update `prisma/schema.prisma` first for data model changes.
- Generate and apply migrations consistently.
- Keep relation names and mapped column names coherent.
- New writes must go through `SessionOrder` and `OrderCandy`, not `SessionCandy`.
- If touching historical compatibility, treat `SessionCandy` as legacy/backfill-only data.

## Docker and Runtime Rules

- Keep `Dockerfile` multi-stage and production oriented.
- Keep `docker-compose.yml` with `backend` + `postgres` services.
- Ensure backend startup still runs `prisma migrate deploy` before boot.

## Definition of Done for Changes

- Code compiles.
- Relevant tests pass.
- Swagger remains accessible and accurate.
- Business rules above remain enforced.
- No regressions in session immutability.
- Session summaries and close totals come from order data with price snapshots.
