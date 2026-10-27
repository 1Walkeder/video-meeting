# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # nest start --watch (listens on $PORT, default 4000)
pnpm build          # nest build -> dist/
pnpm start:prod     # node dist/main
pnpm lint           # oxlint src/ test/
pnpm typecheck       # tsc --noEmit -p tsconfig.json
pnpm test           # vitest run (unit specs: **/*.spec.ts)
pnpm test:watch     # vitest (watch mode)
pnpm test:cov       # vitest run --coverage
pnpm test:e2e       # vitest run --config ./vitest.config.e2e.ts (**/*.e2e-spec.ts)
```

Run a single test file: `pnpm exec vitest run src/app.controller.spec.ts`. Filter by test name: `pnpm exec vitest run -t "test name"`.

## Running tests

- **Unit** (`pnpm test`): `src/**/*.spec.ts`, no external dependencies.
- **E2E** (`pnpm test:e2e`): `test/*.e2e-spec.ts`, hit a real Postgres and boot the full `AppModule`.
  1. Start Postgres from the repo root: `docker compose up -d postgres` (connection: `DATABASE_URL`, default `postgres://postgres:postgres@localhost:5432/video_meetings`).
  2. `pnpm test:e2e` (from `apps/api`, or `pnpm --filter api test:e2e` from the root). `JWT_SECRET` is set by `vitest.config.e2e.ts`; tables are created on app startup, no migration step.
- Before/after refactoring run **both** suites — the unit suite alone covers almost nothing (auth, users and meetings are tested only in e2e). The root `pnpm test` runs unit tests only.

## Architecture

- Standard NestJS module structure: `AppModule` (`src/app.module.ts`) wires `AppController` + `AppService`, the global `ValidationPipe` (`APP_PIPE`, class-validator DTOs) and the feature modules. New features follow the Nest convention of `*.module.ts` / `*.controller.ts` / `*.service.ts` per domain.
- `DatabaseModule` (global) provides a `pg` `Pool` (`PG_POOL`) from `DATABASE_URL` (default: the Postgres from the root `docker-compose.yml`). No ORM/migrations yet: the `users` and `meetings` tables are created on startup under an advisory lock.
- `AuthModule` (`POST /auth/register` → 201, `POST /auth/login` → 200, both return `{ accessToken }`, HS256 JWT signed with **required** `JWT_SECRET` (≥32 chars), 1h TTL). Passwords are hashed with `node:crypto` scrypt (in `AuthModule`); e-mails are unique case-insensitively.
- `UsersModule` owns user persistence (`UsersRepository`) and is **only reachable through CQRS** (`@nestjs/cqrs`, `CqrsModule.forRoot()` in `AppModule`): `CreateUserCommand(email, passwordHash)` → `User | null` (null = e-mail taken), `FindUserByEmailQuery`, `FindUserByIdQuery`. Other modules import the commands/queries from `src/users/index.ts` and dispatch via `CommandBus`/`QueryBus`; never inject `UsersRepository` outside `UsersModule`.
- `AuthGuard` (`src/auth/auth.guard.ts`, exported by `AuthModule`) verifies the JWT from the `Authorization: Bearer` header or, as a fallback, the `accessToken` cookie (set by the web app's auth route handlers) and sets `req.user = { id, email }`; apply with `@UseGuards(AuthGuard)` and import `AuthModule` in the feature module.
- `MeetingsModule` (all routes behind `AuthGuard`): `POST /meetings` (`{ title, date (ISO 8601), participants: e-mail[] }` → 201), `GET /meetings` (current user's meetings), `GET /meetings/recent` (3 most recently created, newest first; declared before `:id`), `GET /meetings/:id` (404 if missing, foreign, or not a UUID). Backed by the `meetings` table, also created on startup.
- Inject dependencies with explicit `@Inject(...)` in providers/controllers; vitest runs through `unplugin-swc` so `emitDecoratorMetadata` (needed for DTO validation) works in tests.
- E2E tests (`test/*.e2e-spec.ts`) hit a real Postgres — run `docker compose up -d postgres` from the repo root first.
- **This package is ESM** (`"type": "module"` in `package.json`, `module`/`moduleResolution: "nodenext"` in `tsconfig.json`). Relative imports must include the `.js` extension even though the source files are `.ts` (e.g. `import { AppService } from './app.service.js'`).
- Test runner is **vitest**, not the Jest setup NestJS scaffolds by default — unit specs (`*.spec.ts`) and e2e specs (`*.e2e-spec.ts`, under `test/`) use separate configs (`vitest.config.ts` vs `vitest.config.e2e.ts`) because they use different `include` globs.
- Linting is **oxlint**, not ESLint; rules live in `oxlint.json`.
