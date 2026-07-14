# Income-Outcome Tracker

A Bahasa Indonesia personal cash-flow tracker monorepo. The frontend remains a self-contained mock-data MVP while the new backend is implemented independently; **no frontend adapter or API integration is included yet**.

## Stack

- `apps/frontend`: React / Vite demo application.
- `apps/backend`: Under development
- `packages/shared`: portable Zod contracts, types, and Indonesian finance defaults.

The API exposes Better Auth under `/api/auth/*` and application endpoints under `/api/v1`. It uses credentialed cookies, exact numeric PostgreSQL aggregates, and server-enforced user ownership.

## Checks

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```
```sh
TEST_DATABASE_URL=postgres://... pnpm --filter @income-outcome/backend test:integration
```

Apply migrations to that isolated test database before running the suite. Never use a production or shared development database for integration tests.
