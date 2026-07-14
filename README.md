# Income-Outcome Tracker

A Bahasa Indonesia personal cash-flow tracker monorepo. The frontend remains a self-contained mock-data MVP while the new backend is implemented independently; **no frontend adapter or API integration is included yet**.

## Stack

- `apps/frontend`: React / Vite demo application.
- `apps/backend`: ESM TypeScript, Express, Better Auth, PostgreSQL, and Drizzle ORM.
- `packages/shared`: portable Zod contracts, types, and Indonesian finance defaults.

## Backend setup

1. Copy `apps/backend/.env.example` to your local environment file and set `DATABASE_URL`, a 32+-character `BETTER_AUTH_SECRET`, trusted origins, and SMTP credentials/sender.
2. Generate/review schema changes with `pnpm --filter @income-outcome/backend db:generate` when the schema changes.
3. Apply committed migrations with `pnpm --filter @income-outcome/backend db:migrate`.
4. Run the API with `pnpm --filter @income-outcome/backend dev`.

The API exposes Better Auth under `/api/auth/*` and application endpoints under `/api/v1`. It uses credentialed cookies, exact numeric PostgreSQL aggregates, and server-enforced user ownership.

## Checks

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Backend integration tests require an externally provisioned, **isolated** PostgreSQL `TEST_DATABASE_URL`; no container or managed database provider is bundled:

```sh
TEST_DATABASE_URL=postgres://... pnpm --filter @income-outcome/backend test:integration
```

Apply migrations to that isolated test database before running the suite. Never use a production or shared development database for integration tests.
