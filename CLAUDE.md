# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

pnpm workspace monorepo (`pnpm-workspace.yaml`: `apps/*`) containing two apps that are otherwise independent — there is no shared package yet:

- `apps/web` — Next.js 16 frontend (App Router, React 19, Tailwind CSS v4). See `apps/web/CLAUDE.md`.
- `apps/api` — NestJS 12 backend (ESM, vitest, oxlint). See `apps/api/CLAUDE.md`.

Both apps are early-stage scaffolds (`create-next-app` / `nest new`) with minimal custom code so far.

Requires Node >=22 (`.nvmrc` pins 22) and pnpm >=9 (`packageManager` pins `pnpm@9.15.0`).

## Commands

Run from the repo root; `-r` / `--filter` target workspace packages:

```bash
pnpm dev              # run both apps' dev servers in parallel
pnpm dev:web          # web only
pnpm dev:api          # api only
pnpm build            # build all apps
pnpm lint             # lint all apps
pnpm typecheck        # typecheck all apps
pnpm test             # test all apps (--if-present)
pnpm format           # prettier --write .
pnpm format:check     # prettier --check .
```

To target a single app's script directly, use `pnpm --filter <web|api> <script>`, or `cd` into the app and see its own CLAUDE.md for app-specific commands (e.g. running a single test).

## Formatting

Prettier config (`.prettierrc`): single quotes, trailing commas everywhere. `.prettierignore` excludes build output (`dist`, `build`, `.next`, `out`) and `pnpm-lock.yaml`.

## Keeping this documentation current

When a change alters the project's architecture — a new app/package is added to the workspace, a shared package appears, an app switches framework/test-runner/linter, or a new cross-app convention is introduced — update this file and the affected app's `CLAUDE.md` (`apps/web/CLAUDE.md`, `apps/api/CLAUDE.md`) in the same change. Routine feature work inside an app's existing structure doesn't need a doc update.
